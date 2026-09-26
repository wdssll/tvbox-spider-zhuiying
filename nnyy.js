/**
 * FongMi / TVBox QuickJS Spider for 努努影院 (nnyy.in)
 * Type: 3 (QuickJS ES Module)
 * All lifecycle methods return synchronous JSON-stringified results.
 */

var siteHost = 'https://nnyy.in';
var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Universal HTTP helper (Synchronous in QuickJS, fallback support)
function httpReq(url, opt) {
    opt = opt || {};
    var method = (opt.method || 'GET').toUpperCase();
    var headers = opt.headers || {};
    var data = opt.data || opt.body || null;

    if (!headers['User-Agent']) {
        headers['User-Agent'] = DEFAULT_UA;
    }
    if (!headers['Referer']) {
        headers['Referer'] = siteHost + '/';
    }

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
        if (opt.data) rOpt.data = opt.data;
        if (opt.body) rOpt.body = opt.body;
        if (data && !rOpt.data) rOpt.data = data;
        if (data && !rOpt.body) rOpt.body = (typeof data === 'string') ? data : JSON.stringify(data);
        if (opt.postType) rOpt.postType = opt.postType;

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

var categoryClasses = [
    { type_id: 'dianying', type_name: '电影' },
    { type_id: 'dianshiju', type_name: '电视剧' },
    { type_id: 'zongyi', type_name: '综艺' },
    { type_id: 'dongman', type_name: '动漫' }
];

var commonFilters = [
    {
        key: 'genre',
        name: '类型',
        value: [
            { n: '全部', v: '' },
            { n: '剧情', v: 'ju-qing' },
            { n: '喜剧', v: 'xi-ju' },
            { n: '爱情', v: 'ai-qing' },
            { n: '动作', v: 'dong-zuo' },
            { n: '惊悚', v: 'jing-song' },
            { n: '犯罪', v: 'fan-zui' },
            { n: '悬疑', v: 'xuan-yi' },
            { n: '恐怖', v: 'kong-bu' },
            { n: '科幻', v: 'ke-huan' },
            { n: '奇幻', v: 'qi-huan' },
            { n: '传记', v: 'chuan-ji' },
            { n: '战争', v: 'zhan-zheng' },
            { n: '家庭', v: 'jia-ting' },
            { n: '冒险', v: 'mao-xian' },
            { n: '人性', v: 'ren-xing' },
            { n: '青春', v: 'qing-chun' },
            { n: '历史', v: 'li-shi' },
            { n: '文艺', v: 'wen-yi' },
            { n: '搞笑', v: 'gao-xiao' }
        ]
    },
    {
        key: 'country',
        name: '地区',
        value: [
            { n: '全部', v: '' },
            { n: '大陆', v: 'cn' },
            { n: '美国', v: 'us' },
            { n: '香港', v: 'hk' },
            { n: '台湾', v: 'tw' },
            { n: '日本', v: 'jp' },
            { n: '韩国', v: 'kr' },
            { n: '英国', v: 'gb' },
            { n: '法国', v: 'fr' },
            { n: '德国', v: 'de' },
            { n: '泰国', v: 'th' },
            { n: '意大利', v: 'it' },
            { n: '西班牙', v: 'es' },
            { n: '印度', v: 'in' }
        ]
    },
    {
        key: 'year',
        name: '年份',
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
            { n: '2016', v: '2016' },
            { n: '2015', v: '2015' },
            { n: '2014', v: '2014' },
            { n: '2013', v: '2013' },
            { n: '2012', v: '2012' },
            { n: '2011', v: '2011' },
            { n: '2010', v: '2010' }
        ]
    },
    {
        key: 'ob',
        name: '排序',
        value: [
            { n: '最新更新', v: '' },
            { n: '按人气', v: 'click' },
            { n: '按评分', v: 'rating' }
        ]
    }
];

function buildFilters() {
    var filters = {};
    for (var i = 0; i < categoryClasses.length; i++) {
        filters[categoryClasses[i].type_id] = commonFilters;
    }
    return filters;
}

function parseCards(html) {
    var list = [];
    if (!html) return list;

    var cardRegex = /<li>\s*<a[^>]+href=["'](\/[^"']+\.html)["'][^>]*class=["']thumbnail["'][\s\S]*?<\/li>/gi;
    var match;
    while ((match = cardRegex.exec(html)) !== null) {
        var block = match[0];
        var href = match[1];
        var nameMatch = block.match(/alt=["']([^"']+)["']/) || block.match(/<h2><a[^>]*>([^<]+)<\/a><\/h2>/);
        var picMatch = block.match(/data-src=["']([^"']+)["']/) || block.match(/src=["']([^"']+)["']/);
        var noteMatch = block.match(/<div class="note"><span>([^<]+)<\/span><\/div>/);
        var countrieMatch = block.match(/<div class="countrie">([\s\S]*?)<\/div>/);

        var remarks = noteMatch ? noteMatch[1].trim() : '';
        if (countrieMatch) {
            var spanRegex = /<span[^>]*>([^<]+)<\/span>/g;
            var spMatch;
            var parts = [];
            while ((spMatch = spanRegex.exec(countrieMatch[1])) !== null) {
                parts.push(spMatch[1].trim());
            }
            if (parts.length > 0) {
                remarks = remarks ? (remarks + ' ' + parts.join(' ')) : parts.join(' ');
            }
        }

        var pic = picMatch ? picMatch[1] : '';
        if (pic && pic.indexOf('http') !== 0) {
            pic = siteHost + pic;
        }

        if (href && nameMatch) {
            list.push({
                vod_id: href,
                vod_name: nameMatch[1].trim(),
                vod_pic: pic,
                vod_remarks: remarks
            });
        }
    }
    return list;
}

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
        filters: buildFilters()
    });
}

/**
 * Lifecycle: homeVod
 */
function homeVod() {
    var html = httpReq(siteHost + '/dianying/', {
        headers: { 'User-Agent': DEFAULT_UA, 'Referer': siteHost + '/' }
    });
    var list = parseCards(html);
    return JSON.stringify({
        list: list
    });
}

/**
 * Lifecycle: category
 */
function category(tid, pg, filter, extend) {
    pg = parseInt(pg, 10) || 1;
    extend = extend || {};

    var params = [];
    if (pg > 1) {
        params.push('page=' + pg);
    }
    if (extend.genre) {
        params.push('genre=' + encodeURIComponent(extend.genre));
    }
    if (extend.country) {
        params.push('country=' + encodeURIComponent(extend.country));
    }
    if (extend.year) {
        params.push('year=' + encodeURIComponent(extend.year));
    }
    if (extend.ob) {
        params.push('ob=' + encodeURIComponent(extend.ob));
    }

    var qStr = params.length > 0 ? ('?' + params.join('&')) : '';
    var url = siteHost + '/' + tid + '/' + qStr;

    var html = httpReq(url, {
        headers: { 'User-Agent': DEFAULT_UA, 'Referer': siteHost + '/' }
    });
    var list = parseCards(html);

    var hasMore = list.length >= 24;
    var pageCount = hasMore ? (pg + 1) : pg;

    return JSON.stringify({
        page: pg,
        pagecount: pageCount,
        limit: list.length,
        total: pageCount * (list.length || 24),
        list: list
    });
}

/**
 * Lifecycle: detail
 */
function detail(id) {
    var detailUrl = (id.indexOf('http') === 0) ? id : (siteHost + (id.indexOf('/') === 0 ? id : ('/' + id)));
    var html = httpReq(detailUrl, {
        headers: { 'User-Agent': DEFAULT_UA, 'Referer': siteHost + '/' }
    });

    if (!html) {
        return JSON.stringify({ list: [] });
    }

    var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    var picMatch = html.match(/<img[^>]+src=["'](\/nnimg\/[^"']+)["']/i) || html.match(/class=["']thumb[^"']*["'][^>]+src=["']([^"']+)["']/i);
    var pic = picMatch ? picMatch[1] : '';
    if (pic && pic.indexOf('http') !== 0) {
        pic = siteHost + pic;
    }

    function getExcerpt(label) {
        var reg = new RegExp('<div class="product-excerpt">' + label + '：([\\s\\S]*?)<\\/div>', 'i');
        var m = html.match(reg);
        return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
    }

    var director = getExcerpt('导演');
    var actor = getExcerpt('主演');
    var typeName = getExcerpt('类型');
    var area = getExcerpt('制片国家/地区');
    var desc = getExcerpt('剧情简介');

    var numIdMatch = id.match(/\/(\d+)\.html/) || id.match(/(\d{7,10})/);
    var numId = numIdMatch ? numIdMatch[1] : '';

    var epRegex = /ep_slug=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:button|li|a)>/gi;
    var episodes = [];
    var epMatch;
    while ((epMatch = epRegex.exec(html)) !== null) {
        var slug = epMatch[1];
        var epText = epMatch[2].replace(/<[^>]+>/g, '').trim();
        if (slug && epText) {
            episodes.push(epText + '$' + numId + '/' + slug);
        }
    }

    // Reverse if listed descending (e.g. ep12 down to ep1)
    if (episodes.length > 1) {
        var firstPart = (episodes[0].split('$')[1] || '').split('/')[1] || '';
        var lastPart = (episodes[episodes.length - 1].split('$')[1] || '').split('/')[1] || '';
        var firstNum = parseInt(firstPart.replace(/\D/g, ''), 10);
        var lastNum = parseInt(lastPart.replace(/\D/g, ''), 10);
        if (!isNaN(firstNum) && !isNaN(lastNum) && firstNum > lastNum) {
            episodes.reverse();
        }
    }

    if (episodes.length === 0) {
        var onEpMatch = html.match(/on_ep\(['"]([^'"]+)['"]\)/);
        var fallbackSlug = onEpMatch ? onEpMatch[1] : 'hd';
        episodes.push('正片$' + numId + '/' + fallbackSlug);
    }

    var vod = {
        vod_id: id,
        vod_name: title,
        vod_pic: pic,
        type_name: typeName,
        vod_year: '',
        vod_area: area,
        vod_remarks: '',
        vod_actor: actor,
        vod_director: director,
        vod_content: desc,
        vod_play_from: '努努极速',
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
    var apiUrl = siteHost + '/_gp/' + id;
    var respText = httpReq(apiUrl, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Referer': siteHost + '/',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    var streamUrl = '';
    if (respText) {
        try {
            var data = (typeof respText === 'string') ? JSON.parse(respText) : respText;
            if (data && data.video_plays && data.video_plays.length > 0) {
                for (var i = 0; i < data.video_plays.length; i++) {
                    var vp = data.video_plays[i];
                    if (vp && vp.play_data && (vp.play_data.indexOf('http') === 0)) {
                        streamUrl = vp.play_data;
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
    var searchUrl = siteHost + '/so?wd=' + encodeURIComponent(wd || '');
    if (pg > 1) {
        searchUrl += '&page=' + pg;
    }

    var html = httpReq(searchUrl, {
        headers: { 'User-Agent': DEFAULT_UA, 'Referer': siteHost + '/' }
    });
    var list = parseCards(html);

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
