/**
 * FongMi / TVBox QuickJS Spider for 泥视频 (www.nivod.cc)
 * Type: 3 (QuickJS ES Module)
 * All lifecycle methods return synchronous JSON-stringified results.
 */

var siteHost = 'https://www.nivod.cc';
var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

// Helper: parse video cards from HTML listings (filter.html and search.html)
function parseCardList(html) {
    if (!html) return [];
    var list = [];
    var seen = {};

    var liRegex = /class=["'][^"']*qy-mod-li[^"']*["']([\s\S]*?)<\/li>/gi;
    var m;
    while ((m = liRegex.exec(html)) !== null) {
        var card = m[1];
        var linkMatch = card.match(/href=["']\/voddetail\/(\d+)["']/);
        var titleMatch = card.match(/class=["'][^"']*link-txt[^"']*["'][^>]*title=["']([^"']+)["']/i) ||
                         card.match(/title=["']([^"']+)["']/i);
        var remarkMatch = card.match(/class=["'][^"']*qy-mod-label[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);

        if (linkMatch && titleMatch) {
            var id = linkMatch[1];
            if (!seen[id]) {
                seen[id] = true;
                list.push({
                    vod_id: id,
                    vod_name: titleMatch[1].trim(),
                    vod_pic: siteHost + '/imgs/small/' + id + '.jpg',
                    vod_remarks: remarkMatch ? remarkMatch[1].replace(/<[^>]+>/g, '').trim() : ''
                });
            }
        }
    }

    // Fallback if no li tags matched
    if (list.length === 0) {
        var linkRegex = /<a[^>]+href=["']\/voddetail\/(\d+)["'][^>]*title=["']([^"']+)["']/gi;
        while ((m = linkRegex.exec(html)) !== null) {
            var fId = m[1];
            if (!seen[fId]) {
                seen[fId] = true;
                list.push({
                    vod_id: fId,
                    vod_name: m[2].trim(),
                    vod_pic: siteHost + '/imgs/small/' + fId + '.jpg',
                    vod_remarks: ''
                });
            }
        }
    }

    return list;
}

var categoryClasses = [
    { type_id: 'movie', type_name: '电影' },
    { type_id: 'tv', type_name: '电视剧' },
    { type_id: 'show', type_name: '综艺' },
    { type_id: 'anime', type_name: '动漫' }
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
    var html = httpReq(siteHost + '/filter.html?channel=movie&page=1', {
        headers: { 'User-Agent': DEFAULT_UA, 'Referer': siteHost + '/' }
    });
    var list = parseCardList(html);
    return JSON.stringify({
        list: list
    });
}

/**
 * Lifecycle: category
 */
function category(tid, pg, filter, extend) {
    pg = parseInt(pg, 10) || 1;
    var channel = tid || 'movie';
    // Fallback for numeric IDs from previous config
    if (channel === '1') channel = 'movie';
    else if (channel === '2') channel = 'tv';
    else if (channel === '3') channel = 'show';
    else if (channel === '4') channel = 'anime';

    var url = siteHost + '/filter.html?channel=' + channel + '&page=' + pg;
    var html = httpReq(url, {
        headers: { 'User-Agent': DEFAULT_UA, 'Referer': siteHost + '/' }
    });
    var list = parseCardList(html);

    var hasMore = list.length >= 24;
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
    var detailUrl = siteHost + '/voddetail/' + cleanId;
    var html = httpReq(detailUrl, {
        headers: { 'User-Agent': DEFAULT_UA, 'Referer': siteHost + '/' }
    });

    if (!html) {
        return JSON.stringify({ list: [] });
    }

    var titleMatch = html.match(/<title>([^<_]+)/i);
    var vodName = titleMatch ? titleMatch[1].trim() : ('影片' + cleanId);

    var kwMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
    var kw = kwMatch ? kwMatch[1].split(',') : [];
    var year = kw[1] || '';
    var area = kw[3] ? kw[3].split('-')[0].trim() : '';

    var descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    var desc = descMatch ? descMatch[1].trim() : '';

    // Extract episodes: <a href="/vodplay/202652077/ep1">第01集</a>
    var epRegex = /<a[^>]+href=["'](\/vodplay\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    var m;
    var episodes = [];
    var seenEp = {};
    while ((m = epRegex.exec(html)) !== null) {
        var name = m[2].replace(/<[^>]+>/g, '').trim();
        var epHref = m[1];
        if (name && (name.indexOf('集') !== -1 || name.indexOf('期') !== -1 || /^\d+$/.test(name) || name === '正片')) {
            if (!seenEp[epHref]) {
                seenEp[epHref] = true;
                episodes.push(name + '$' + epHref);
            }
        }
    }
    // Reverse episodes so earlier episodes appear first
    episodes.reverse();

    if (episodes.length === 0) {
        episodes.push('正片$/vodplay/' + cleanId + '/ep1');
    }

    var vod = {
        vod_id: cleanId,
        vod_name: vodName,
        vod_pic: siteHost + '/imgs/small/' + cleanId + '.jpg',
        type_name: '',
        vod_year: year,
        vod_area: area,
        vod_remarks: '',
        vod_actor: '',
        vod_director: '',
        vod_content: desc,
        vod_play_from: '泥视频专线',
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
    // id can be e.g. "/vodplay/202652077/ep1" or "202652077-ep1"
    var clean = ('' + id).replace(/^\/+/, '').replace(/^vodplay\//, '').replace('/', '-');
    var apiUrl = siteHost + '/xhr_playinfo/' + clean;

    var resp = httpReq(apiUrl, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/vodplay/' + clean.replace('-', '/'),
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json, text/javascript, */*; q=0.01'
        }
    });

    var streamUrl = '';
    if (resp) {
        try {
            var data = (typeof resp === 'string') ? JSON.parse(resp) : resp;
            if (data && data.pdatas && data.pdatas.length > 0) {
                for (var i = 0; i < data.pdatas.length; i++) {
                    var p = data.pdatas[i];
                    if (p.playurl && (p.playurl.indexOf('http') === 0)) {
                        streamUrl = p.playurl;
                        break;
                    }
                }
            }
        } catch (e) {}
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
    var searchUrl = siteHost + '/search.html?keyword=' + encodeURIComponent(wd || '');
    var html = httpReq(searchUrl, {
        headers: { 'User-Agent': DEFAULT_UA, 'Referer': siteHost + '/' }
    });

    var list = parseCardList(html);

    return JSON.stringify({
        page: pg,
        pagecount: 1,
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
