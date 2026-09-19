/**
 * FongMi / TVBox QuickJS Spider for 泥视频 (www.nivod.vip)
 * Type: 3 (QuickJS ES Module)
 * All lifecycle methods return synchronous JSON-stringified results.
 */

var siteHost = 'https://www.nivod.vip';
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

// Helper: parse video cards from HTML listings
function parseCardList(html) {
    if (!html) return [];
    var list = [];
    var aRegex = /<a[^>]+href=["'](\/nivod\/(\d+)\/?)["'][^>]*>([\s\S]*?)<\/a>/gi;
    var m;
    var seen = {};

    while ((m = aRegex.exec(html)) !== null) {
        var id = m[2];
        if (seen[id]) continue;

        var fullATag = m[0];
        var inner = m[3];

        var titleMatch = fullATag.match(/title=["']([^"']+)["']/i) ||
                         inner.match(/<img[^>]+alt=["']([^"']+)["']/i) ||
                         inner.match(/class=["'][^"']*title[^"']*["'][^>]*>([^<]+)<\//i);

        var picMatch = inner.match(/data-original=["']([^"']+)["']/i) ||
                         inner.match(/src=["']([^"']+)["']/i);

        var remarkMatch = inner.match(/class=["'][^"']*module-item-note[^"']*["'][^>]*>([^<]+)<\//i) ||
                          inner.match(/class=["'][^"']*note[^"']*["'][^>]*>([^<]+)<\//i) ||
                          inner.match(/class=["'][^"']*remarks[^"']*["'][^>]*>([^<]+)<\//i);

        if (titleMatch) {
            var pic = picMatch ? picMatch[1].trim() : '';
            if (pic.indexOf('//') === 0) {
                pic = 'https:' + pic;
            } else if (pic.indexOf('/') === 0 && pic.indexOf('loading.png') === -1) {
                pic = siteHost + pic;
            }

            seen[id] = true;
            list.push({
                vod_id: id,
                vod_name: titleMatch[1].trim(),
                vod_pic: pic,
                vod_remarks: remarkMatch ? remarkMatch[1].trim() : ''
            });
        }
    }
    return list;
}

var categoryClasses = [
    { type_id: '1', type_name: '电影' },
    { type_id: '2', type_name: '剧集' },
    { type_id: '3', type_name: '综艺' },
    { type_id: '4', type_name: '动漫' }
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
    var html = httpReq(siteHost + '/');
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
    var targetUrl = siteHost + '/t/' + tid + '-' + pg + '/';
    var html = httpReq(targetUrl);
    var list = parseCardList(html);

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
    var detailUrl = siteHost + '/nivod/' + cleanId + '/';
    var html = httpReq(detailUrl);
    if (!html) {
        return JSON.stringify({ list: [] });
    }

    var titleMatch = html.match(/<h1[^>]*class=["'][^"']*page-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<title>([^<_\-]+)/i);
    var vodName = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    var picMatch = html.match(/data-original=["']([^"']+)["']/i) ||
                   html.match(/class=["'][^"']*module-item-pic[^"']*["'][\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    var vodPic = picMatch ? picMatch[1].trim() : '';
    if (vodPic.indexOf('//') === 0) {
        vodPic = 'https:' + vodPic;
    } else if (vodPic.indexOf('/') === 0 && vodPic.indexOf('loading.png') === -1) {
        vodPic = siteHost + vodPic;
    }

    var directorMatch = html.match(/导演[：:]\s*([\s\S]*?)<\/div>/i);
    var actorMatch = html.match(/主演[：:]\s*([\s\S]*?)<\/div>/i);
    var areaMatch = html.match(/地区[：:]\s*([\s\S]*?)<\/div>/i);
    var yearMatch = html.match(/上映[：:]\s*([\s\S]*?)<\/div>/i) || html.match(/年份[：:]\s*([\s\S]*?)<\/div>/i);
    var remarkMatch = html.match(/集数[：:]\s*([\s\S]*?)<\/div>/i) || html.match(/更新[：:]\s*([\s\S]*?)<\/div>/i);
    var descMatch = html.match(/class=["'][^"']*module-info-items[^"']*["']>([\s\S]*?)<\/div>/i) ||
                    html.match(/class=["'][^"']*module-info-introduction[^"']*["'][\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);

    var cleanText = function(m) {
        return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    };

    // Extract tabs
    var tabRegex = /class=["'][^"']*module-tab-item[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
    var allTabs = [];
    var tm;
    while ((tm = tabRegex.exec(html)) !== null) {
        var tName = tm[1].replace(/<[^>]+>/g, '').trim();
        if (tName && tName !== '选择播放源') {
            allTabs.push(tName);
        }
    }

    // Extract playlists
    var playListContainers = [];
    var pRegex = /class=["'][^"']*module-play-list[^"']*["']([\s\S]*?)<\/div>\s*<\/div>/gi;
    var pm;
    while ((pm = pRegex.exec(html)) !== null) {
        playListContainers.push(pm[1]);
    }

    var fromList = [];
    var playUrlList = [];

    for (var i = 0; i < playListContainers.length; i++) {
        var container = playListContainers[i];
        var tabTitle = allTabs[i] || ('播放线路' + (i + 1));

        var epRegex = /<a[^>]+href=["'](\/niplay\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var epMatch;
        var episodes = [];

        while ((epMatch = epRegex.exec(container)) !== null) {
            var epHref = epMatch[1];
            var epName = epMatch[2].replace(/<[^>]+>/g, '').trim();
            if (!epName) {
                var nameMatch = epMatch[0].match(/title=["'](?:播放)?([^"']+)["']/i);
                epName = nameMatch ? nameMatch[1] : ('第' + (episodes.length + 1) + '集');
            }
            episodes.push(epName + '$' + epHref);
        }

        if (episodes.length > 0) {
            fromList.push(tabTitle);
            playUrlList.push(episodes.join('#'));
        }
    }

    // Fallback if no tabbed playlists found
    if (fromList.length === 0) {
        fromList.push('默认线路');
        var singleEpRegex = /href=["'](\/niplay\/[^"']+)["']/gi;
        var sm;
        var fallbackEps = [];
        var epIdx = 1;
        while ((sm = singleEpRegex.exec(html)) !== null) {
            fallbackEps.push('第' + epIdx + '集$' + sm[1]);
            epIdx++;
        }
        playUrlList.push(fallbackEps.join('#'));
    }

    var vod = {
        vod_id: cleanId,
        vod_name: vodName,
        vod_pic: vodPic,
        type_name: '',
        vod_year: cleanText(yearMatch),
        vod_area: cleanText(areaMatch),
        vod_remarks: cleanText(remarkMatch),
        vod_actor: cleanText(actorMatch),
        vod_director: cleanText(directorMatch),
        vod_content: cleanText(descMatch),
        vod_play_from: fromList.join('$$$'),
        vod_play_url: playUrlList.join('$$$')
    };

    return JSON.stringify({
        list: [vod]
    });
}

/**
 * Lifecycle: play
 */
function play(flag, id, flags) {
    var playPageUrl = id;
    if (playPageUrl.indexOf('http') !== 0) {
        if (playPageUrl.indexOf('/') !== 0) {
            playPageUrl = '/' + playPageUrl;
        }
        playPageUrl = siteHost + playPageUrl;
    }

    var html = httpReq(playPageUrl, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/'
        }
    });

    var streamUrl = '';

    if (html) {
        var m = html.match(/player_aaaa\s*=\s*\{[\s\S]*?"url"\s*:\s*["']([^"']+)["']/);
        if (m) {
            streamUrl = m[1].replace(/\\/g, '');
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

    // Fallback to web parser
    return JSON.stringify({
        parse: 1,
        playUrl: '',
        url: playPageUrl,
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
    var encodedWd = encodeURIComponent(wd || '');
    var searchUrl = siteHost + '/s/' + encodedWd + '-------------/?page=' + pg;

    var html = httpReq(searchUrl, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/'
        }
    });

    var list = parseCardList(html);
    var hasMore = list.length >= 15;
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
