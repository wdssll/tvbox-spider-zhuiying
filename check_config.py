#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TVBox Configuration & Source Health Checker
Checks config.json validity, CDN spider availability, target site connectivity,
API signature verification, and video stream resolution.
"""

import base64
import hashlib
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def http_request(url, method="GET", headers=None, data=None, timeout=12):
    req_headers = {"User-Agent": DEFAULT_UA}
    if headers:
        req_headers.update(headers)

    if data is not None and isinstance(data, str):
        data = data.encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    start = time.time()
    with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
        body = resp.read().decode("utf-8", errors="replace")
        elapsed_ms = int((time.time() - start) * 1000)
        return resp.getcode(), body, elapsed_ms, resp.geturl()


def md5_hex(text):
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def sha1_hex(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def check_zhuiying(ext_url):
    status, html, ms, _ = http_request(ext_url + "/")
    cards = re.findall(
        r'<a[^>]+href="/video/([a-zA-Z0-9]+)\.html"[^>]*class="[^"]*card[^"]*"[^>]*>',
        html,
    )
    if not cards:
        return False, ms, f"HTTP {status}, but 0 video cards matched on homepage"

    sample_id = cards[0]
    play_url = f"{ext_url}/play/{sample_id}-1-1.html"
    _, play_html, play_ms, _ = http_request(play_url, headers={"Referer": ext_url + "/"})
    total_ms = ms + play_ms

    m = re.search(r"MAC_PLAY_CONFIG\s*=\s*\{([\s\S]*?)\};", play_html)
    if not m:
        return True, total_ms, f"Homepage OK ({len(cards)} cards), play page loaded"

    cfg_text = m.group(1)
    req_url_m = re.search(r'requestUrl\s*:\s*["\']([^"\']+)["\']', cfg_text)
    base_key_m = re.search(r'baseKey\s*:\s*["\']([^"\']+)["\']', cfg_text)
    if req_url_m and base_key_m:
        request_url = req_url_m.group(1)
        base_key = base_key_m.group(1)
        ts = str(int(time.time()))
        token = md5_hex(base_key + ts + DEFAULT_UA)
        post_body = (
            f"url={urllib.parse.quote(request_url)}&timestamp={ts}&token={token}"
        )
        _, api_resp, api_ms, _ = http_request(
            f"{ext_url}/player_api.php",
            method="POST",
            headers={
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Referer": play_url,
                "X-Requested-With": "XMLHttpRequest",
            },
            data=post_body,
        )
        total_ms += api_ms
        api_json = json.loads(api_resp)
        if api_json.get("data"):
            rev_b64 = api_json["data"][::-1]
            decoded = json.loads(base64.b64decode(rev_b64).decode("utf-8"))
            stream = decoded.get("jmurl") or decoded.get("url") or ""
            if stream:
                return True, total_ms, f"OK ({len(cards)} cards, m3u8 stream verified)"

    return True, total_ms, f"Homepage OK ({len(cards)} cards)"


def check_nivod(ext_url):
    url = f"{ext_url}/filter.html?channel=movie&page=1"
    status, html, ms, _ = http_request(url, headers={"Referer": ext_url + "/"})
    matches = re.findall(r"/voddetail/(\d+)", html)
    if matches:
        return True, ms, f"OK ({len(set(matches))} movies matched)"
    return False, ms, f"HTTP {status}, but 0 /voddetail/ links found"


def check_signed_mw_api(ext_url):
    sign_key = "cb808529bae6b6be45ecfab29a4889bc"
    ts = str(int(time.time() * 1000))
    query_str = "pageNum=1&pageSize=24&type1=1"
    raw = f"{query_str}&key={sign_key}&t={ts}"
    sign = sha1_hex(md5_hex(raw))

    url = f"{ext_url}/mw-movie/anonymous/video/list?{query_str}"
    headers = {
        "Referer": ext_url + "/",
        "Accept": "application/json, text/plain, */*",
        "deviceId": "a1b2c3d4e5f6-1234-4567-89ab-cdef01234567",
        "sign": sign,
        "t": ts,
    }
    status, body, ms, _ = http_request(url, headers=headers)
    data = json.loads(body)
    items = (data.get("data") or {}).get("list") or []
    if data.get("code") == 200 and items:
        first_title = items[0].get("vodName", "")
        return True, ms, f"OK (API code 200, {len(items)} items, e.g. '{first_title}')"
    return False, ms, f"HTTP {status}, unexpected API response: {body[:100]}"


def check_nnyy(ext_url):
    url = f"{ext_url}/dianying/"
    status, html, ms, _ = http_request(url, headers={"Referer": ext_url + "/"})
    cards = re.findall(
        r'<li>\s*<a[^>]+href=["\'](/[^"\']+\.html)["\'][^>]*class=["\']thumbnail["\']',
        html,
        re.I,
    )
    if cards:
        return True, ms, f"OK ({len(cards)} cards matched)"
    return False, ms, f"HTTP {status}, but 0 thumbnail cards matched"


def check_maccms_json(api_url):
    sep = "&" if "?" in api_url else "?"
    url = f"{api_url}{sep}ac=detail"
    status, body, ms, _ = http_request(url)
    data = json.loads(body)
    items = data.get("list") or []
    total = data.get("total", 0)
    if data.get("code") == 1 and items:
        first_title = items[0].get("vod_name", "")
        return True, ms, f"OK (total: {total}, sample: '{first_title}')"
    return False, ms, f"HTTP {status}, invalid MacCMS response"


def check_site(site):
    key = site.get("key", "")
    name = site.get("name", key)
    site_type = site.get("type")
    api = site.get("api", "")
    ext = site.get("ext", "").rstrip("/")

    # 1. If type 3 (QuickJS spider), check if the JS file itself is accessible
    spider_note = ""
    if site_type == 3 and api.startswith("http"):
        try:
            code, js_body, js_ms, _ = http_request(api, timeout=10)
            if code != 200 or len(js_body) < 100:
                return False, js_ms, f"Spider JS unreachable or empty ({api})"
            spider_note = f"JS CDN {js_ms}ms | "
        except Exception as e:
            return False, 0, f"Spider JS failed ({api}): {e}"

    # 2. Check target site data / API
    try:
        if key == "zhuiying":
            ok, ms, msg = check_zhuiying(ext)
        elif key == "nivod":
            ok, ms, msg = check_nivod(ext)
        elif key in ("aidianying", "jinpai"):
            ok, ms, msg = check_signed_mw_api(ext)
        elif key == "nnyy":
            ok, ms, msg = check_nnyy(ext)
        elif site_type in (0, 1):
            ok, ms, msg = check_maccms_json(api)
        else:
            target = ext if ext.startswith("http") else api
            code, _, ms, _ = http_request(target)
            ok = 200 <= code < 400
            msg = f"HTTP {code}"
        return ok, ms, spider_note + msg
    except urllib.error.HTTPError as e:
        return False, 0, f"{spider_note}HTTP Error {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return False, 0, f"{spider_note}Connection Failed: {e.reason}"
    except Exception as e:
        return False, 0, f"{spider_note}Error: {e}"


def check_parse(parse_item):
    name = parse_item.get("name", "Parser")
    url = parse_item.get("url", "")
    test_url = url + "https://www.iqiyi.com"
    try:
        code, _, ms, _ = http_request(test_url, timeout=8)
        return (200 <= code < 400), ms, f"HTTP {code}"
    except Exception as e:
        return False, 0, f"Failed: {e}"


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(script_dir, "config.json")

    print("=" * 75)
    print(f"TVBox Config Health Check: {config_path}")
    print("=" * 75)

    if not os.path.exists(config_path):
        print(f"[ERROR] File not found: {config_path}")
        sys.exit(1)

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
    except Exception as e:
        print(f"[ERROR] Invalid JSON in {config_path}: {e}")
        sys.exit(1)

    sites = config.get("sites", [])
    parses = config.get("parses", [])

    print(f"\n[1/2] Checking {len(sites)} Video Sources (sites):")
    print("-" * 75)
    passed_sites = 0
    for idx, site in enumerate(sites, 1):
        name = site.get("name", "Unknown")
        key = site.get("key", "")
        ok, ms, detail = check_site(site)
        status_str = "PASS" if ok else "FAIL"
        if ok:
            passed_sites += 1
        print(f"  {idx}. [{status_str}] {name} ({key:<10}) | {ms:>5} ms | {detail}")

    print(f"\n[2/2] Checking {len(parses)} Parse Engines (parses):")
    print("-" * 75)
    passed_parses = 0
    for idx, p in enumerate(parses, 1):
        name = p.get("name", "Unknown")
        ok, ms, detail = check_parse(p)
        status_str = "PASS" if ok else "FAIL"
        if ok:
            passed_parses += 1
        print(f"  {idx}. [{status_str}] {name:<12} | {ms:>5} ms | {detail} ({p.get('url', '')})")

    print("\n" + "=" * 75)
    print(
        f"Summary: Sites {passed_sites}/{len(sites)} working | "
        f"Parses {passed_parses}/{len(parses)} working"
    )
    print("=" * 75)


if __name__ == "__main__":
    main()
