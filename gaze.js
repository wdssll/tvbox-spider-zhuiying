/**
 * FongMi / TVBox QuickJS Spider for 追影 (zhuiying3.cc)
 * Type: 3 (QuickJS ES Module)
 * All lifecycle methods return synchronous JSON-stringified results.
 */

var siteHost = 'https://zhuiying3.cc';
var proxyHost = '';
var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function httpLog(msg) {
    try {
        if (proxyHost) {
            httpReq(proxyHost + '/log?msg=' + encodeURIComponent(msg), { timeout: 3000 });
        }
    } catch (e) {}
}

// Pure JavaScript MD5 implementation (Synchronous & QuickJS compatible)
function md5(string) {
    function md5_RotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function md5_AddUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = lX & 0x80000000;
        lY8 = lY & 0x80000000;
        lX4 = lX & 0x40000000;
        lY4 = lY & 0x40000000;
        lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
        if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
            else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
        } else return lResult ^ lX8 ^ lY8;
    }
    function md5_F(x, y, z) { return (x & y) | (~x & z); }
    function md5_G(x, y, z) { return (x & z) | (y & ~z); }
    function md5_H(x, y, z) { return x ^ y ^ z; }
    function md5_I(x, y, z) { return y ^ (x | ~z); }
    function md5_FF(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    }
    function md5_GG(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    }
    function md5_HH(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    }
    function md5_II(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    }
    function md5_ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }
    function md5_WordToHex(lValue) {
        var WordToHexValue = '', WordToHexValue_temp = '', lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue_temp = '0' + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
    }
    function md5_Utf8Encode(string) {
        string = string.replace(/\r\n/g, '\n');
        var utftext = '';
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if (c > 127 && c < 2048) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }
    var x = Array();
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    string = md5_Utf8Encode(string);
    x = md5_ConvertToWordArray(string);
    a = 0x67452301; b = 0xefcdab89; c = 0x98badcfe; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = md5_FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
        d = md5_FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
        c = md5_FF(c, d, a, b, x[k + 2], S13, 0x242070db);
        b = md5_FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
        a = md5_FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
        d = md5_FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
        c = md5_FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
        b = md5_FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
        a = md5_FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
        d = md5_FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
        c = md5_FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
        b = md5_FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
        a = md5_FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
        d = md5_FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
        c = md5_FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
        b = md5_FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
        a = md5_GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
        d = md5_GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
        c = md5_GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
        b = md5_GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
        a = md5_GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
        d = md5_GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = md5_GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
        b = md5_GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
        a = md5_GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
        d = md5_GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
        c = md5_GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
        b = md5_GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
        a = md5_GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
        d = md5_GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
        c = md5_GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
        b = md5_GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
        a = md5_HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
        d = md5_HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
        c = md5_HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
        b = md5_HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
        a = md5_HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
        d = md5_HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
        c = md5_HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
        b = md5_HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
        a = md5_HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
        d = md5_HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
        c = md5_HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
        b = md5_HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
        a = md5_HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
        d = md5_HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
        c = md5_HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
        b = md5_HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
        a = md5_II(a, b, c, d, x[k + 0], S41, 0xf4292244);
        d = md5_II(d, a, b, c, x[k + 7], S42, 0x432aff97);
        c = md5_II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
        b = md5_II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
        a = md5_II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
        d = md5_II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
        c = md5_II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
        b = md5_II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
        a = md5_II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
        d = md5_II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
        c = md5_II(c, d, a, b, x[k + 6], S43, 0xa3014314);
        b = md5_II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
        a = md5_II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
        d = md5_II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
        c = md5_II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
        b = md5_II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
        a = md5_AddUnsigned(a, AA);
        b = md5_AddUnsigned(b, BB);
        c = md5_AddUnsigned(c, CC);
        d = md5_AddUnsigned(d, DD);
    }
    return (md5_WordToHex(a) + md5_WordToHex(b) + md5_WordToHex(c) + md5_WordToHex(d)).toLowerCase();
}

// Pure JavaScript Base64 decode
function base64Decode(str) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    str = String(str).replace(/=+$/, '');
    if (str.length % 4 === 1) {
        throw new Error('Invalid base64 string');
    }
    for (var bc = 0, bs, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
        buffer = chars.indexOf(buffer);
    }
    return output;
}

// Universal HTTP helper (Synchronous in QuickJS, fallback support)
function httpReq(url, opt) {
    opt = opt || {};
    var method = (opt.method || 'GET').toUpperCase();
    var headers = opt.headers || {};
    if (!headers['User-Agent'] && !headers['user-agent']) {
        headers['User-Agent'] = DEFAULT_UA;
    }
    var data = opt.data || opt.body || null;

    var fnReq = (typeof req === 'function') ? req :
                (typeof globalThis !== 'undefined' && typeof globalThis.req === 'function') ? globalThis.req :
                (typeof fm !== 'undefined' && typeof fm.req === 'function') ? fm.req.bind(fm) :
                (typeof fongmi !== 'undefined' && typeof fongmi.req === 'function') ? fongmi.req.bind(fongmi) : null;

    if (fnReq) {
        var rOpt = {
            method: method,
            headers: headers,
            timeout: opt.timeout || 15000
        };
        if (opt.data) {
            rOpt.data = opt.data;
        }
        if (opt.body) {
            rOpt.body = opt.body;
        }
        if (data && !rOpt.data) {
            rOpt.data = data;
        }
        if (data && !rOpt.body) {
            rOpt.body = (typeof data === 'string') ? data : JSON.stringify(data);
        }
        if (opt.postType) {
            rOpt.postType = opt.postType;
        }

        try {
            var resp = fnReq(url, rOpt);
            if (resp) {
                if (typeof resp === 'string') return resp;
                if (resp.content) return resp.content;
                if (resp.data && typeof resp.data === 'string') return resp.data;
                if (resp.body && typeof resp.body === 'string') return resp.body;
                return JSON.stringify(resp);
            }
        } catch (e) {
            return '';
        }
        return '';
    }

    // Fallback if running under node environment (for testing)
    if (typeof fetch === 'function') {
        throw new Error('fetch is asynchronous, native req required for synchronous QuickJS');
    }

    return '';
}

// Helper: parse regular category cards from HTML
function parseCardList(html) {
    if (!html) return [];
    var list = [];
    var cardRegex = /<a[^>]+href="\/video\/([a-zA-Z0-9]+)\.html"[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
    var m;
    while ((m = cardRegex.exec(html)) !== null) {
        var vod_id = m[1];
        var inner = m[2];
        var titleMatch = inner.match(/<div class="card-title">([^<]+)<\/div>/) || inner.match(/alt="([^"]+)"/);
        var vod_name = titleMatch ? titleMatch[1].trim() : '';
        var picMatch = inner.match(/<img[^>]+src="([^"]+)"/);
        var vod_pic = picMatch ? picMatch[1].trim() : '';
        var remarkMatch = inner.match(/<span class="card-status">([^<]+)<\/span>/);
        var vod_remarks = remarkMatch ? remarkMatch[1].trim() : '';
        list.push({ vod_id: vod_id, vod_name: vod_name, vod_pic: vod_pic, vod_remarks: vod_remarks });
    }
    return list;
}

// Common filter dictionary
var defaultFilterConfig = [
    {
        key: 'class',
        name: '类型',
        init: '',
        value: [
            { n: '全部', v: '' },
            { n: '剧情', v: '剧情' },
            { n: '喜剧', v: '喜剧' },
            { n: '动作', v: '动作' },
            { n: '爱情', v: '爱情' },
            { n: '科幻', v: '科幻' },
            { n: '动画', v: '动画' },
            { n: '悬疑', v: '悬疑' },
            { n: '惊悚', v: '惊悚' },
            { n: '恐怖', v: '恐怖' },
            { n: '犯罪', v: '犯罪' },
            { n: '战争', v: '战争' },
            { n: '冒险', v: '冒险' },
            { n: '奇幻', v: '奇幻' }
        ]
    },
    {
        key: 'area',
        name: '地区',
        init: '',
        value: [
            { n: '全部', v: '' },
            { n: '中国大陆', v: '中国大陆' },
            { n: '中国香港', v: '中国香港' },
            { n: '中国台湾', v: '中国台湾' },
            { n: '美国', v: '美国' },
            { n: '韩国', v: '韩国' },
            { n: '日本', v: '日本' },
            { n: '英国', v: '英国' },
            { n: '法国', v: '法国' },
            { n: '德国', v: '德国' },
            { n: '印度', v: '印度' },
            { n: '泰国', v: '泰国' }
        ]
    },
    {
        key: 'year',
        name: '年份',
        init: '',
        value: [
            { n: '全部', v: '' },
            { n: '2026', v: '2026' },
            { n: '2025', v: '2025' },
            { n: '2024', v: '2024' },
            { n: '2023', v: '2023' },
            { n: '2022', v: '2022' },
            { n: '2021', v: '2021' },
            { n: '2020', v: '2020' },
            { n: '2019', v: '2019' },
            { n: '2018', v: '2018' },
            { n: '2017', v: '2017' },
            { n: '2016', v: '2016' }
        ]
    },
    {
        key: 'by',
        name: '排序',
        init: 'time',
        value: [
            { n: '按时间', v: 'time' },
            { n: '按人气', v: 'hits' },
            { n: '按评分', v: 'score' }
        ]
    }
];

var categoryClasses = [
    { type_id: 'dianying', type_name: '电影' },
    { type_id: 'dianshiju', type_name: '电视剧' },
    { type_id: 'dongman', type_name: '动漫' },
    { type_id: 'zongyi', type_name: '综艺' },
    { type_id: 'duanju', type_name: '短剧' }
];

/**
 * Lifecycle Hook 1: init(ext)
 */
function init(ext) {
    if (typeof ext === 'string' && ext.startsWith('{')) {
        try { ext = JSON.parse(ext); } catch (e) {}
    }
    if (typeof ext === 'object' && ext !== null) {
        if (ext.host) siteHost = ext.host.replace(/\/+$/, '');
        if (ext.proxy) proxyHost = ext.proxy.replace(/\/+$/, '');
    } else if (typeof ext === 'string' && ext.startsWith('http')) {
        siteHost = ext.replace(/\/+$/, '');
    }
}

/**
 * Lifecycle Hook 2: home(filter) / homeContent(filter)
 */
function home(filter) {
    var filters = {};
    for (var i = 0; i < categoryClasses.length; i++) {
        filters[categoryClasses[i].type_id] = defaultFilterConfig;
    }

    var list = [];
    try {
        var html = httpReq(siteHost + '/');
        list = parseCardList(html);
    } catch (e) {
        list = [];
    }

    return JSON.stringify({
        class: categoryClasses,
        filters: filters,
        list: list
    });
}

function homeVod() {
    var list = [];
    try {
        var html = httpReq(siteHost + '/');
        list = parseCardList(html);
    } catch (e) {
        list = [];
    }
    return JSON.stringify({ list: list });
}

/**
 * Lifecycle Hook 3: category(tid, pg, filter, extend) / categoryContent(...)
 */
function category(tid, pg, filter, extend) {
    var page = parseInt(pg) || 1;
    extend = extend || {};

    var area = extend.area ? encodeURIComponent(extend.area) : '';
    var by = extend.by ? encodeURIComponent(extend.by) : '';
    var class_name = extend.class ? encodeURIComponent(extend.class) : '';
    var year = extend.year ? encodeURIComponent(extend.year) : '';

    var parts = [tid, area, by, class_name, '', '', '', '', String(page), '', '', year];
    var url = siteHost + '/vodshow/' + parts.join('-') + '.html';

    var list = [];
    try {
        var html = httpReq(url);
        list = parseCardList(html);
    } catch (e) {
        list = [];
    }

    return JSON.stringify({
        page: page,
        pagecount: 999,
        limit: 27,
        total: 9999,
        list: list
    });
}

/**
 * Lifecycle Hook 4: detail(id) / detailContent(id)
 */
function detail(id) {
    if (Array.isArray(id)) id = id[0];
    var url = '';
    if (id.startsWith('http')) {
        url = id;
    } else if (id.startsWith('/video/')) {
        url = siteHost + id;
    } else {
        url = siteHost + '/video/' + id + '.html';
    }

    var html = httpReq(url);

    var titleMatch = html.match(/<h1 class="detail-title">([^<]+)<\/h1>/);
    var vod_name = titleMatch ? titleMatch[1].trim() : '';

    var picMatch = html.match(/<img class="detail-poster" src="([^"]+)"/);
    var vod_pic = picMatch ? picMatch[1].trim() : '';

    var yearMatch = html.match(/<span class="detail-year">\(([^)]+)\)<\/span>/);
    var vod_year = yearMatch ? yearMatch[1].trim() : '';

    var typeMatch = html.match(/<span class="m-val">([^<]+)<\/span>\s*<span class="m-lbl">类型<\/span>/);
    var type_name = typeMatch ? typeMatch[1].trim() : '';

    var areaMatch = html.match(/<span class="m-val">([^<]+)<\/span>\s*<span class="m-lbl">制片国家\/地区<\/span>/);
    var vod_area = areaMatch ? areaMatch[1].trim() : '';

    var directorMatch = html.match(/<div class="actor-line">\s*<span class="label">导演:<\/span>\s*<span[^>]*>([^<]+)<\/span>/);
    var vod_director = directorMatch ? directorMatch[1].trim() : '';

    var actorMatch = html.match(/<div class="actor-line">\s*<span class="label">主演:<\/span>\s*<div[^>]*id="actorValBox"[^>]*>([\s\S]*?)<\/div>/);
    var vod_actor = actorMatch ? actorMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    var descMatch = html.match(/<div class="synopsis-text"[^>]*id="synopsisContent"[^>]*>([\s\S]*?)<\/div>/);
    var vod_content = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    var remarksMatch = html.match(/<div class="poster-badge">([^<]+)<\/div>/);
    var vod_remarks = remarksMatch ? remarksMatch[1].trim() : '';

    var tabRegex = /<div class="source-tab"[^>]*data-target="([^"]+)"[^>]*>[\s\S]*?<span class="tab-name">([^<]+)<\/span>/g;
    var tabMap = {};
    var tabOrder = [];
    var tm;
    while ((tm = tabRegex.exec(html)) !== null) {
        tabMap[tm[1]] = tm[2].trim();
        tabOrder.push(tm[1]);
    }

    var listRegex = /<div[^>]*class="[^"]*ep-square-list[^"]*"[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/div>/g;
    var listMap = {};
    var lm;
    while ((lm = listRegex.exec(html)) !== null) {
        var listId = lm[1];
        var listContent = lm[2];
        var epRegex = /<a[^>]+href="(\/play\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/g;
        var eps = [];
        var em;
        while ((em = epRegex.exec(listContent)) !== null) {
            var playPath = em[1].trim();
            var epName = em[2].replace(/<[^>]+>/g, '').trim();
            if (epName && playPath) {
                eps.push(epName + '$' + playPath);
            }
        }
        listMap[listId] = eps;
    }

    var playFromList = [];
    var playUrlList = [];

    for (var i = 0; i < tabOrder.length; i++) {
        var tid = tabOrder[i];
        if (listMap[tid] && listMap[tid].length > 0) {
            playFromList.push(tabMap[tid] || tid);
            playUrlList.push(listMap[tid].join('#'));
        }
    }

    var vod_info = {
        vod_id: id,
        vod_name: vod_name,
        vod_pic: vod_pic,
        type_name: type_name,
        vod_year: vod_year,
        vod_area: vod_area,
        vod_remarks: vod_remarks,
        vod_actor: vod_actor,
        vod_director: vod_director,
        vod_content: vod_content,
        vod_play_from: playFromList.join('$$$'),
        vod_play_url: playUrlList.join('$$$')
    };

    return JSON.stringify({
        list: [vod_info]
    });
}

/**
 * Lifecycle Hook 5: play(flag, id, vipFlags) / playerContent(...)
 */
function play(flag, id, vipFlags) {
    if (Array.isArray(id)) id = id[0];
    httpLog('Entering play() with id: ' + id);

    var playUrl = '';
    if (id.startsWith('http')) {
        playUrl = id;
    } else if (id.startsWith('/')) {
        playUrl = siteHost + id;
    } else {
        playUrl = siteHost + '/play/' + id + '.html';
    }

    var streamUrl = '';

    // Step 1: Try Native Direct Resolution on the TV
    try {
        var html = httpReq(playUrl, {
            headers: {
                'User-Agent': DEFAULT_UA,
                'Referer': siteHost + '/'
            }
        });

        var match = html ? html.match(/MAC_PLAY_CONFIG\s*=\s*\{([\s\S]*?)\};/) : null;
        if (match) {
            var configText = '{' + match[1] + '}';
            var requestUrlMatch = configText.match(/requestUrl\s*:\s*["']([^"']+)["']/);
            var baseKeyMatch = configText.match(/baseKey\s*:\s*["']([^"']+)["']/);

            if (requestUrlMatch && baseKeyMatch) {
                var requestUrl = requestUrlMatch[1];
                var baseKey = baseKeyMatch[1];
                var timestamp = Math.floor(Date.now() / 1000);
                var token = md5(baseKey + timestamp + DEFAULT_UA);

                var postBody = 'url=' + encodeURIComponent(requestUrl) + '&timestamp=' + timestamp + '&token=' + token;
                var postDataObj = {
                    url: requestUrl,
                    timestamp: String(timestamp),
                    token: token
                };

                var apiRespStr = httpReq(siteHost + '/player_api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Referer': playUrl,
                        'User-Agent': DEFAULT_UA,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    postType: 'form',
                    data: postDataObj,
                    body: postBody
                });

                if (apiRespStr) {
                    try {
                        var apiJson = JSON.parse(apiRespStr);
                        if (apiJson && apiJson.data) {
                            var reversed = apiJson.data.split('').reverse().join('');
                            var decoded = base64Decode(reversed);
                            var data = JSON.parse(decoded);
                            streamUrl = data.jmurl || data.url || '';
                            if (streamUrl) {
                                httpLog('Native resolution succeeded: ' + streamUrl);
                            }
                        } else if (apiJson && apiJson.error) {
                            httpLog('Native player_api returned error: ' + apiJson.error);
                        }
                    } catch (pe) {
                        httpLog('JSON parse error of apiResp: ' + pe.message);
                    }
                } else {
                    httpLog('Native player_api returned empty response');
                }
            } else {
                httpLog('requestUrl or baseKey missing from configText');
            }
        } else {
            httpLog('MAC_PLAY_CONFIG not matched in play page');
        }
    } catch (e) {
        httpLog('Native resolution exception: ' + e.message);
    }

    // Step 2: Automatic fallback to proxy server if native resolution did not produce a streamUrl
    if (!streamUrl && proxyHost) {
        try {
            httpLog('Attempting proxy resolution via: ' + proxyHost);
            var proxyResp = httpReq(proxyHost + '/parse_play?id=' + encodeURIComponent(id), { timeout: 8000 });
            if (proxyResp) {
                var pJson = JSON.parse(proxyResp);
                if (pJson && pJson.code === 1 && pJson.url) {
                    streamUrl = pJson.url;
                    httpLog('Proxy resolution succeeded: ' + streamUrl);
                } else if (pJson && pJson.error) {
                    httpLog('Proxy resolution failed with error: ' + pJson.error);
                }
            }
        } catch (pe) {
            httpLog('Proxy resolution exception: ' + pe.message);
        }
    }

    if (!streamUrl) {
        httpLog('All resolution methods failed for id: ' + id);
        return JSON.stringify({
            parse: 0,
            url: ''
        });
    }

    return JSON.stringify({
        parse: 0,
        playUrl: '',
        url: streamUrl,
        header: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/'
        },
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/'
        }
    });
}

/**
 * Lifecycle Hook 6: search(wd, quick, pg) / searchContent(...)
 */
function search(wd, quick, pg) {
    var page = parseInt(pg) || 1;
    var url = siteHost + '/vod/search/wd/' + encodeURIComponent(wd) + '.html';
    var html = httpReq(url, {
        headers: {
            'Referer': siteHost + '/'
        }
    });

    var list = [];
    var cardRegex = /<a[^>]+href="\/video\/([a-zA-Z0-9]+)\.html"[^>]*class="(?:hero|list)-card-thumb"[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    var m;
    while ((m = cardRegex.exec(html)) !== null) {
        var vod_id = m[1];
        var vod_name = m[2].trim();
        var inner = m[3];
        var picMatch = inner.match(/<img[^>]+src="([^"]+)"/);
        var vod_pic = picMatch ? picMatch[1].trim() : '';
        var remarkMatch = inner.match(/<span[^>]*class="(?:hero|list)-thumb-remark"[^>]*>([^<]+)<\/span>/);
        var vod_remarks = remarkMatch ? remarkMatch[1].trim() : '';
        list.push({ vod_id: vod_id, vod_name: vod_name, vod_pic: vod_pic, vod_remarks: vod_remarks });
    }

    if (list.length === 0) {
        var fallbackList = parseCardList(html);
        for (var i = 0; i < fallbackList.length; i++) {
            list.push(fallbackList[i]);
        }
    }

    return JSON.stringify({
        page: page,
        pagecount: 1,
        limit: 20,
        total: list.length,
        list: list
    });
}

// Aliases for both naming conventions
var homeContent = home;
var homeVideoContent = homeVod;
var categoryContent = category;
var detailContent = detail;
var playerContent = play;
var searchContent = search;

// Global exposure for non-ESM QuickJS loaders
if (typeof globalThis !== 'undefined') {
    globalThis.init = init;
    globalThis.home = home;
    globalThis.homeContent = homeContent;
    globalThis.homeVod = homeVod;
    globalThis.homeVideoContent = homeVideoContent;
    globalThis.category = category;
    globalThis.categoryContent = categoryContent;
    globalThis.detail = detail;
    globalThis.detailContent = detailContent;
    globalThis.play = play;
    globalThis.playerContent = playerContent;
    globalThis.search = search;
    globalThis.searchContent = searchContent;
}

// Default export for FongMi QuickJS ES Module
export default {
    init: init,
    home: home,
    homeContent: homeContent,
    homeVod: homeVod,
    homeVideoContent: homeVideoContent,
    category: category,
    categoryContent: categoryContent,
    detail: detail,
    detailContent: detailContent,
    play: play,
    playerContent: playerContent,
    search: search,
    searchContent: searchContent
};

export {
    init,
    home,
    homeContent,
    homeVod,
    homeVideoContent,
    category,
    categoryContent,
    detail,
    detailContent,
    play,
    playerContent,
    search,
    searchContent
};
