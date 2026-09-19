/**
 * FongMi / TVBox QuickJS Spider for 爱电影 (kuhh4jo.com)
 * Type: 3 (QuickJS ES Module)
 * All lifecycle methods return synchronous JSON-stringified results.
 */

var siteHost = 'https://kuhh4jo.com';
var apiPrefix = '/mw-movie';
var signKey = 'cb808529bae6b6be45ecfab29a4889bc';
var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
var deviceId = 'a1b2c3d4e5f6-1234-4567-89ab-cdef01234567';

// Universal HTTP helper (Synchronous in QuickJS, fallback support)
function httpReq(url, opt) {
    opt = opt || {};
    var method = (opt.method || 'GET').toUpperCase();
    var headers = opt.headers || {};
    if (!headers['User-Agent'] && !headers['user-agent']) {
        headers['User-Agent'] = DEFAULT_UA;
    }
    if (!headers['Referer'] && !headers['referer']) {
        headers['Referer'] = siteHost + '/';
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

    if (typeof fetch === 'function') {
        throw new Error('fetch is asynchronous, native req required for synchronous QuickJS');
    }

    return '';
}

// Pure JavaScript SHA1 Implementation
function sha1(message) {
    function rotateLeft(n, s) { return (n << s) | (n >>> (32 - s)); }
    function cvtHex(val) {
        var str = "";
        for (var i = 7; i >= 0; i--) {
            var v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    }
    var blockstart;
    var i;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xefcdab89;
    var H2 = 0x98badcfe;
    var H3 = 0x10325476;
    var H4 = 0xc3d2e1f0;
    var A, B, C, D, E;
    var temp;

    var msg = unescape(encodeURIComponent(message));
    var nblk = ((msg.length + 8) >> 6) + 1;
    var blks = new Array(nblk * 16);
    for (i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (i = 0; i < msg.length; i++) {
        blks[i >> 2] |= msg.charCodeAt(i) << (24 - (i % 4) * 8);
    }
    blks[i >> 2] |= 0x80 << (24 - (i % 4) * 8);
    blks[nblk * 16 - 1] = msg.length * 8;

    for (blockstart = 0; blockstart < blks.length; blockstart += 16) {
        for (i = 0; i < 16; i++) W[i] = blks[blockstart + i];
        for (i = 16; i < 80; i++) W[i] = rotateLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

        A = H0; B = H1; C = H2; D = H3; E = H4;

        for (i = 0; i < 20; i++) {
            temp = (rotateLeft(A, 5) + ((B & C) | ((~B) & D)) + E + W[i] + 0x5a827999) & 0xffffffff;
            E = D; D = C; C = rotateLeft(B, 30); B = A; A = temp;
        }
        for (i = 20; i < 40; i++) {
            temp = (rotateLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ed9eba1) & 0xffffffff;
            E = D; D = C; C = rotateLeft(B, 30); B = A; A = temp;
        }
        for (i = 40; i < 60; i++) {
            temp = (rotateLeft(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8f1bbcdc) & 0xffffffff;
            E = D; D = C; C = rotateLeft(B, 30); B = A; A = temp;
        }
        for (i = 60; i < 80; i++) {
            temp = (rotateLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xca62c1d6) & 0xffffffff;
            E = D; D = C; C = rotateLeft(B, 30); B = A; A = temp;
        }

        H0 = (H0 + A) & 0xffffffff;
        H1 = (H1 + B) & 0xffffffff;
        H2 = (H2 + C) & 0xffffffff;
        H3 = (H3 + D) & 0xffffffff;
        H4 = (H4 + E) & 0xffffffff;
    }
    return (cvtHex(H0) + cvtHex(H1) + cvtHex(H2) + cvtHex(H3) + cvtHex(H4)).toLowerCase();
}

// Pure JavaScript MD5 Implementation
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

// Compute API request signature: SHA1(MD5(sorted_query + "&key=" + signKey + "&t=" + t))
function apiSign(params, timestamp) {
    var keys = Object.keys(params).sort();
    var queryParts = [];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (params[k] !== undefined && params[k] !== null) {
            queryParts.push(k + '=' + params[k]);
        }
    }
    var queryStr = queryParts.join('&');
    var h = queryStr + '&key=' + signKey + '&t=' + timestamp;
    return sha1(md5(h));
}

// Signed API request helper
function signedApiReq(endpoint, params) {
    params = params || {};
    var timestamp = Date.now().toString();
    var sign = apiSign(params, timestamp);

    var queryParts = [];
    var keys = Object.keys(params);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (params[k] !== undefined && params[k] !== null) {
            queryParts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
        }
    }
    var fullUrl = siteHost + apiPrefix + endpoint + (queryParts.length > 0 ? ('?' + queryParts.join('&')) : '');

    var resp = httpReq(fullUrl, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/',
            'Accept': 'application/json, text/plain, */*',
            'deviceId': deviceId,
            'authorization': '',
            'sign': sign,
            't': timestamp
        }
    });

    if (!resp) return null;
    try {
        return JSON.parse(resp);
    } catch (e) {
        return null;
    }
}

var categoryClasses = [
    { type_id: '1', type_name: '电影' },
    { type_id: '2', type_name: '电视剧' },
    { type_id: '3', type_name: '综艺' },
    { type_id: '4', type_name: '动漫' },
    { type_id: '88', type_name: '短剧' }
];

/**
 * Lifecycle: init
 */
function init(ext) {
    if (ext) {
        if (typeof ext === 'string' && ext.indexOf('http') === 0) {
            siteHost = ext.replace(/\/+$/, '');
        } else if (typeof ext === 'object' && ext.site) {
            siteHost = ext.site.replace(/\/+$/, '');
        }
    }
    return JSON.stringify({
        code: 1,
        msg: 'ok'
    });
}

/**
 * Lifecycle: home
 */
function home(filter) {
    return JSON.stringify({
        class: categoryClasses,
        filters: {}
    });
}

/**
 * Lifecycle: homeVod
 */
function homeVod() {
    var res = signedApiReq('/anonymous/video/list', {
        type1: '1',
        pageNum: '1',
        pageSize: '24'
    });

    var list = [];
    if (res && res.data && res.data.list) {
        var rawList = res.data.list;
        for (var i = 0; i < rawList.length; i++) {
            var item = rawList[i];
            list.push({
                vod_id: '' + item.vodId,
                vod_name: item.vodName,
                vod_pic: item.vodPic || '',
                vod_remarks: item.vodRemarks || item.vodVersion || ''
            });
        }
    }

    return JSON.stringify({
        list: list
    });
}

/**
 * Lifecycle: category
 */
function category(tid, pg, filter, extend) {
    pg = parseInt(pg, 10) || 1;
    var res = signedApiReq('/anonymous/video/list', {
        type1: '' + tid,
        pageNum: '' + pg,
        pageSize: '24'
    });

    var list = [];
    if (res && res.data && res.data.list) {
        var rawList = res.data.list;
        for (var i = 0; i < rawList.length; i++) {
            var item = rawList[i];
            list.push({
                vod_id: '' + item.vodId,
                vod_name: item.vodName,
                vod_pic: item.vodPic || '',
                vod_remarks: item.vodRemarks || item.vodVersion || ''
            });
        }
    }

    var hasMore = list.length >= 20;
    var pageCount = hasMore ? (pg + 1) : pg;

    return JSON.stringify({
        page: pg,
        pagecount: pageCount,
        limit: list.length,
        total: pageCount * list.length,
        list: list
    });
}

/**
 * Lifecycle: detail
 */
function detail(id) {
    var cleanId = ('' + id).replace(/[^0-9]/g, '');
    var res = signedApiReq('/anonymous/video/detail', {
        id: cleanId
    });

    if (!res || !res.data) {
        return JSON.stringify({ list: [] });
    }

    var data = res.data;
    var epList = data.episodeList || [];
    var episodes = [];

    for (var i = 0; i < epList.length; i++) {
        var ep = epList[i];
        var epName = ep.name || ('第' + (i + 1) + '集');
        var nid = ep.nid || '';
        episodes.push(epName + '$' + cleanId + '*' + nid);
    }

    var vod = {
        vod_id: cleanId,
        vod_name: data.vodName || '',
        vod_pic: data.vodPic || '',
        type_name: data.typeName || '',
        vod_year: '' + (data.vodYear || ''),
        vod_area: data.vodArea || '',
        vod_remarks: data.vodRemarks || data.vodVersion || '',
        vod_actor: data.vodActor || '',
        vod_director: data.vodDirector || '',
        vod_content: (data.vodContent || '').replace(/<[^>]+>/g, '').trim(),
        vod_play_from: '蓝光专线',
        vod_play_url: episodes.join('#')
    };

    return JSON.stringify({
        list: [vod]
    });
}

/**
 * Lifecycle: play
 */
function play(flag, id, flags) {
    var cleanId = '';
    var nid = '';

    if (id.indexOf('*') !== -1) {
        var parts = id.split('*');
        cleanId = parts[0];
        nid = parts[1];
    } else {
        cleanId = id;
    }

    var res = signedApiReq('/anonymous/v2/video/episode/url', {
        clientType: '1',
        id: cleanId,
        nid: nid
    });

    var streamUrl = '';
    if (res && res.data && res.data.list && res.data.list.length > 0) {
        var resList = res.data.list;
        // Prefer highest resolution (1080 -> 720 -> 480 -> first available)
        var bestItem = null;
        for (var i = 0; i < resList.length; i++) {
            if (resList[i].resolution === 1080 && resList[i].url) {
                bestItem = resList[i];
                break;
            }
        }
        if (!bestItem) {
            for (var j = 0; j < resList.length; j++) {
                if (resList[j].resolution === 720 && resList[j].url) {
                    bestItem = resList[j];
                    break;
                }
            }
        }
        if (!bestItem) {
            for (var k = 0; k < resList.length; k++) {
                if (resList[k].url) {
                    bestItem = resList[k];
                    break;
                }
            }
        }
        if (bestItem && bestItem.url) {
            streamUrl = bestItem.url;
        }
    }

    if (streamUrl) {
        return JSON.stringify({
            parse: 0,
            playUrl: '',
            url: streamUrl,
            header: {
                'User-Agent': DEFAULT_UA,
                'Referer': siteHost + '/'
            }
        });
    }

    // Fallback if not found
    return JSON.stringify({
        parse: 0,
        playUrl: '',
        url: '',
        header: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/'
        }
    });
}

/**
 * Lifecycle: search
 */
function search(wd, quick, pg) {
    pg = parseInt(pg, 10) || 1;
    var res = signedApiReq('/anonymous/video/searchByWordPageable', {
        keyword: wd || '',
        pageNum: '' + pg,
        pageSize: '20'
    });

    var list = [];
    if (res && res.data && res.data.list) {
        var rawList = res.data.list;
        for (var i = 0; i < rawList.length; i++) {
            var item = rawList[i];
            list.push({
                vod_id: '' + item.vodId,
                vod_name: item.vodName,
                vod_pic: item.vodPic || '',
                vod_remarks: item.vodRemarks || item.vodVersion || ''
            });
        }
    }

    var hasMore = list.length >= 20;
    var pageCount = hasMore ? (pg + 1) : pg;

    return JSON.stringify({
        page: pg,
        pagecount: pageCount,
        limit: list.length,
        total: list.length,
        list: list
    });
}

// Aliases for TVBox naming conventions
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
