/**
 * FongMi / TVBox QuickJS Spider for 片库 (4k01.pianku.online)
 * Type: 3 (QuickJS ES Module)
 * All lifecycle methods return synchronous JSON-stringified results.
 */

var siteHost = 'https://4k01.pianku.online';
var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

    if (typeof fetch === 'function') {
        throw new Error('fetch is asynchronous, native req required for synchronous QuickJS');
    }

    return '';
}

// Helper: parse video cards from HTML listings
function parseCardList(html) {
    if (!html) return [];
    var list = [];
    var aRegex = /<a[^>]+href=["'](\/voddetail\/\d+\.html)["'][^>]*>([\s\S]*?)<\/a>/g;
    var m;
    var seen = {};

    while ((m = aRegex.exec(html)) !== null) {
        var detailPath = m[1];
        var inner = m[2];
        var idMatch = detailPath.match(/\d+/);
        if (!idMatch) continue;
        var id = idMatch[0];
        if (seen[id]) continue;

        var titleMatch = inner.match(/<h4 class=["']title["'][^>]*>([^<]+)<\/h4>/i) ||
                         inner.match(/class=["']title["'][^>]*>([^<]+)<\//i) ||
                         inner.match(/title=["']([^"']+)["']/i);
        var picMatch = inner.match(/<img[^>]*?\ssrc=["']([^"']+)["']/i);
        var remarkMatch = inner.match(/class=["']remarks["'][^>]*>([^<]+)<\//i);

        if (titleMatch) {
            var pic = picMatch ? picMatch[1].trim() : '';
            if (pic.indexOf('//') === 0) {
                pic = 'https:' + pic;
            } else if (pic.indexOf('/') === 0 && pic.indexOf('load.gif') === -1) {
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
    { type_id: '20', type_name: '电影' },
    { type_id: '37', type_name: '剧集' },
    { type_id: '43', type_name: '动漫' },
    { type_id: '45', type_name: '综艺' }
];

var categoryFilters = {
    '20': [
        {
            key: 'class',
            name: '类型',
            init: '20',
            value: [
                { n: '全部', v: '20' },
                { n: '动作片', v: '21' },
                { n: '喜剧片', v: '22' },
                { n: '爱情片', v: '23' },
                { n: '科幻片', v: '24' },
                { n: '恐怖片', v: '25' },
                { n: '剧情片', v: '26' },
                { n: '战争片', v: '27' },
                { n: '惊悚片', v: '28' },
                { n: '犯罪片', v: '29' },
                { n: '冒险篇', v: '30' },
                { n: '动画片', v: '31' },
                { n: '悬疑片', v: '32' },
                { n: '武侠片', v: '33' },
                { n: '奇幻片', v: '34' },
                { n: '纪录片', v: '35' },
                { n: '其他片', v: '36' }
            ]
        }
    ],
    '37': [
        {
            key: 'class',
            name: '类型',
            init: '37',
            value: [
                { n: '全部', v: '37' },
                { n: '国产剧', v: '38' },
                { n: '港台剧', v: '39' },
                { n: '欧美剧', v: '40' },
                { n: '日韩剧', v: '41' },
                { n: '其他剧', v: '42' }
            ]
        }
    ],
    '43': [
        {
            key: 'class',
            name: '类型',
            init: '43',
            value: [
                { n: '全部', v: '43' },
                { n: '动漫', v: '44' }
            ]
        }
    ],
    '45': [
        {
            key: 'class',
            name: '类型',
            init: '45',
            value: [
                { n: '全部', v: '45' },
                { n: '综艺', v: '46' }
            ]
        }
    ]
};

/**
 * Lifecycle Hook 1: init(ext)
 */
function init(ext) {
    if (typeof ext === 'string' && ext.indexOf('{') === 0) {
        try { ext = JSON.parse(ext); } catch (e) {}
    }
    if (typeof ext === 'object' && ext !== null) {
        if (ext.host) siteHost = ext.host.replace(/\/+$/, '');
    } else if (typeof ext === 'string' && ext.indexOf('http') === 0) {
        siteHost = ext.replace(/\/+$/, '');
    }
}

/**
 * Lifecycle Hook 2: home(filter) / homeContent(filter)
 */
function home(filter) {
    var list = [];
    try {
        var html = httpReq(siteHost + '/');
        list = parseCardList(html);
    } catch (e) {
        list = [];
    }

    return JSON.stringify({
        class: categoryClasses,
        filters: categoryFilters,
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
    var actualTid = (extend.class && extend.class !== '') ? extend.class : tid;

    var url = '';
    if (page === 1) {
        url = siteHost + '/vodtype/' + actualTid + '.html';
    } else {
        url = siteHost + '/vodtype/' + actualTid + '-' + page + '.html';
    }

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
        limit: 30,
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
    if (id.indexOf('http') === 0) {
        url = id;
    } else if (id.indexOf('/voddetail/') === 0) {
        url = siteHost + id;
    } else {
        url = siteHost + '/voddetail/' + id + '.html';
    }

    var html = httpReq(url, {
        headers: {
            'Referer': siteHost + '/'
        }
    });

    var titleMatch = html.match(/<h1 class="detail-title">([^<]+)(?:<span class="detail-remarks">([^<]+)<\/span>)?<\/h1>/i);
    var vod_name = titleMatch ? titleMatch[1].trim() : '';
    var vod_remarks = (titleMatch && titleMatch[2]) ? titleMatch[2].trim() : '';

    var picMatch = html.match(/<div class="detail-poster">[\s\S]*?<img[^>]*?\ssrc=["']([^"']+)["']/i);
    var vod_pic = picMatch ? picMatch[1].trim() : '';
    if (vod_pic.indexOf('//') === 0) {
        vod_pic = 'https:' + vod_pic;
    } else if (vod_pic.indexOf('/') === 0 && vod_pic.indexOf('load.gif') === -1) {
        vod_pic = siteHost + vod_pic;
    }

    var yearMatch = html.match(/<span>年份：([^<]+)<\/span>/i);
    var vod_year = yearMatch ? yearMatch[1].trim() : '';

    var areaMatch = html.match(/<span>地区：([^<]+)<\/span>/i);
    var vod_area = areaMatch ? areaMatch[1].trim() : '';

    var typeMatch = html.match(/<span>分类：<a[^>]*>([^<]+)<\/a><\/span>/i);
    var type_name = typeMatch ? typeMatch[1].trim() : '';

    var directorMatch = html.match(/<span>导演：([^<]+)<\/span>/i);
    var vod_director = directorMatch ? directorMatch[1].trim() : '';

    var actorMatch = html.match(/<span>主演：([^<]+)<\/span>/i);
    var vod_actor = actorMatch ? actorMatch[1].trim() : '';

    var descMatch = html.match(/<div class="detail-desc">[\s\S]*?<p>([\s\S]*?)<\/p>/i);
    var vod_content = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract tab names
    var tabRegex = /<span[^>]+class=["'][^"']*source-tab-item[^"']*["'][^>]*data-target=["']([^"']+)["'][^>]*>([\s\S]*?)<\/span>/g;
    var tabMap = {};
    var tabOrder = [];
    var tm;
    while ((tm = tabRegex.exec(html)) !== null) {
        var tKey = tm[1].trim();
        var tName = tm[2].replace(/<[^>]+>/g, '').trim();
        tabMap[tKey] = tName;
        tabOrder.push(tKey);
    }

    // Extract episodes per playlist pane
    var paneSplits = html.split(/<div[^>]+class=["'][^"']*source-pane[^"']*["'][^>]*id=["']/i);
    var listMap = {};
    for (var p = 1; p < paneSplits.length; p++) {
        var part = paneSplits[p];
        var qIdx = part.indexOf('"');
        if (qIdx === -1) continue;
        var paneId = part.slice(0, qIdx);
        var epRegex = /<a[^>]+href=["'](\/vodplay\/[^"']+\.html)["'][^>]*>([\s\S]*?)<\/a>/g;
        var eps = [];
        var em;
        while ((em = epRegex.exec(part)) !== null) {
            var href = em[1].trim();
            var name = em[2].replace(/<[^>]+>/g, '').trim();
            if (name && href) eps.push(name + '$' + href);
        }
        listMap[paneId] = eps;
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

    // Fallback if no tabs identified
    if (playFromList.length === 0) {
        var allKeys = Object.keys(listMap);
        for (var k = 0; k < allKeys.length; k++) {
            var kId = allKeys[k];
            if (listMap[kId] && listMap[kId].length > 0) {
                playFromList.push('片库线路 ' + (k + 1));
                playUrlList.push(listMap[kId].join('#'));
            }
        }
    }

    // Final fallback to single play button if exists
    if (playFromList.length === 0) {
        var singleBtnMatch = html.match(/<a[^>]+href=["'](\/vodplay\/[^"']+\.html)["'][^>]*class=["'][^"']*btn-play[^"']*["'][^>]*>/i);
        if (singleBtnMatch) {
            playFromList.push('片库线路');
            playUrlList.push('正片$' + singleBtnMatch[1].trim());
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
    var playUrl = '';
    if (id.indexOf('http') === 0) {
        playUrl = id;
    } else if (id.indexOf('/') === 0) {
        playUrl = siteHost + id;
    } else {
        playUrl = siteHost + '/vodplay/' + id + '.html';
    }

    var html = httpReq(playUrl, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/'
        }
    });

    var match = html ? html.match(/player_aaaa\s*=\s*\{([\s\S]*?)\}/) : null;
    if (!match) {
        return JSON.stringify({
            parse: 1,
            playUrl: '',
            url: playUrl,
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

    var rawUrl = '';
    try {
        var config = JSON.parse(match[0].replace(/player_aaaa\s*=\s*/, ''));
        rawUrl = config.url || '';
    } catch (e) {
        rawUrl = '';
    }

    if (!rawUrl) rawUrl = playUrl;

    var isDirect = rawUrl.indexOf('.m3u8') !== -1 || rawUrl.indexOf('.mp4') !== -1 || rawUrl.indexOf('.flv') !== -1;

    return JSON.stringify({
        parse: isDirect ? 0 : 1,
        playUrl: '',
        url: rawUrl,
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
    var url = siteHost + '/vodsearch/-------------.html?wd=' + encodeURIComponent(wd);
    var list = [];
    try {
        var html = httpReq(url, {
            headers: {
                'Referer': siteHost + '/'
            }
        });
        list = parseCardList(html);
    } catch (e) {
        list = [];
    }

    return JSON.stringify({
        page: page,
        pagecount: 1,
        limit: list.length,
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
