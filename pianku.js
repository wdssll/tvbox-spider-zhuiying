import { Spider } from 'catvod';

/**
 * FongMi / TVBox QuickJS Spider for 片库 (4k01.pianku.online)
 * Type: 3 (FongMi QuickJS Class Module)
 */

var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parseCardList(html, siteHost) {
    if (!html) return [];
    var list = [];
    var cardRegex = /<li[^>]*class=["'](?:public-list-exp|public-list-box)[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
    var m;
    while ((m = cardRegex.exec(html)) !== null) {
        var card = m[1];
        var linkMatch = card.match(/href=["']\/voddetail\/(\d+)\.html["']/i) || card.match(/href=["']\/voddetail\/([a-zA-Z0-9]+)\.html["']/i);
        var titleMatch = card.match(/class=["']public-list-exp__title["'][^>]*title=["']([^"']+)["']/i) ||
                         card.match(/class=["']public-list-exp__title["'][^>]*>([^<]+)<\/a>/i) ||
                         card.match(/class=["']gen-movie-title["'][^>]*title=["']([^"']+)["']/i) ||
                         card.match(/class=["']gen-movie-title["'][^>]*>([^<]+)<\/a>/i) ||
                         card.match(/title=["']([^"']+)["']/i);
        var picMatch = card.match(/data-src=["']([^"']+)["']/i) || card.match(/src=["']([^"']+)["']/i);
        var remarkMatch = card.match(/class=["']public-list-prb[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
                          card.match(/class=["']public-list-subtitle[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
                          card.match(/class=["']public-pr-box[^"']*["'][^>]*>([^<]+)<\/span>/i);

        if (linkMatch && titleMatch) {
            var id = linkMatch[1];
            var pic = picMatch ? picMatch[1].trim() : '';
            if (pic.indexOf('//') === 0) {
                pic = 'https:' + pic;
            } else if (pic.indexOf('/') === 0 && pic.indexOf('load.gif') === -1) {
                pic = siteHost + pic;
            }

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
                { n: '警匪片', v: '28' },
                { n: '魔幻片', v: '29' },
                { n: '冒险篇', v: '30' },
                { n: '悬疑片', v: '31' },
                { n: '武侠片', v: '32' },
                { n: '动画片', v: '33' },
                { n: '灾难片', v: '34' },
                { n: '纪录片', v: '35' },
                { n: '犯罪片', v: '36' }
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
                { n: '海外剧', v: '42' }
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

export default class PiankuSpider extends Spider {
    constructor() {
        super();
        this.siteHost = 'https://4k01.pianku.online';
    }

    async init(ext) {
        if (typeof ext === 'string' && ext.indexOf('{') === 0) {
            try { ext = JSON.parse(ext); } catch (e) {}
        }
        if (typeof ext === 'object' && ext !== null) {
            if (ext.host) this.siteHost = ext.host.replace(/\/+$/, '');
        } else if (typeof ext === 'string' && ext.indexOf('http') === 0) {
            this.siteHost = ext.replace(/\/+$/, '');
        }
    }

    async httpReq(url, opt) {
        opt = opt || {};
        var method = (opt.method || 'GET').toUpperCase();
        var headers = opt.headers || {};
        if (!headers['User-Agent'] && !headers['user-agent']) {
            headers['User-Agent'] = DEFAULT_UA;
        }
        if (!headers['Referer'] && !headers['referer']) {
            headers['Referer'] = this.siteHost + '/';
        }
        var rOpt = {
            method: method,
            headers: headers
        };
        if (opt.data) rOpt.data = opt.data;
        if (opt.body) rOpt.body = opt.body;
        if (opt.data && !rOpt.body && method === 'POST') {
            rOpt.body = typeof opt.data === 'string' ? opt.data : JSON.stringify(opt.data);
        }

        try {
            var res = await this.net.req(url, rOpt);
            if (res && res.content) return res.content;
            return '';
        } catch (e) {
            return '';
        }
    }

    async homeContent(filter) {
        var list = [];
        try {
            var html = await this.httpReq(this.siteHost + '/');
            list = parseCardList(html, this.siteHost);
        } catch (e) {
            list = [];
        }

        return {
            class: categoryClasses,
            filters: categoryFilters,
            list: list
        };
    }

    async homeVideoContent() {
        var list = [];
        try {
            var html = await this.httpReq(this.siteHost + '/');
            list = parseCardList(html, this.siteHost);
        } catch (e) {
            list = [];
        }
        return { list: list };
    }

    async categoryContent(tid, pg, filter, extend) {
        var page = parseInt(pg) || 1;
        extend = extend || {};
        var actualTid = (extend.class && extend.class !== '') ? extend.class : tid;

        var url = '';
        if (page === 1) {
            url = this.siteHost + '/vodtype/' + actualTid + '.html';
        } else {
            url = this.siteHost + '/vodtype/' + actualTid + '-' + page + '.html';
        }

        var list = [];
        try {
            var html = await this.httpReq(url);
            list = parseCardList(html, this.siteHost);
        } catch (e) {
            list = [];
        }

        return {
            page: page,
            pagecount: 999,
            limit: 24,
            total: 999 * 24,
            list: list
        };
    }

    async detailContent(ids) {
        var id = Array.isArray(ids) ? ids[0] : ids;
        var url = '';
        if (id.indexOf('http') === 0) {
            url = id;
        } else if (id.indexOf('/voddetail/') === 0) {
            url = this.siteHost + id;
        } else {
            url = this.siteHost + '/voddetail/' + id + '.html';
        }

        var html = await this.httpReq(url, {
            headers: {
                'Referer': this.siteHost + '/'
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
            vod_pic = this.siteHost + vod_pic;
        }

        var yearMatch = html.match(/<span>年代：([^<]+)<\/span>/i);
        var vod_year = yearMatch ? yearMatch[1].trim() : '';

        var areaMatch = html.match(/<span>地区：([^<]+)<\/span>/i);
        var vod_area = areaMatch ? areaMatch[1].trim() : '';

        var typeMatch = html.match(/<span>类型：<a[^>]*>([^<]+)<\/a><\/span>/i);
        var type_name = typeMatch ? typeMatch[1].trim() : '';

        var directorMatch = html.match(/<span>导演：([^<]+)<\/span>/i);
        var vod_director = directorMatch ? directorMatch[1].trim() : '';

        var actorMatch = html.match(/<span>主演：([^<]+)<\/span>/i);
        var vod_actor = actorMatch ? actorMatch[1].trim() : '';

        var descMatch = html.match(/<div class="detail-sketch">([\s\S]*?)<\/div>/i);
        var vod_content = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        var tabRegex = /<a[^>]*class=["']anthology-tab-item[^"']*["'][^>]*href=["']#([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var tabMap = {};
        var tabOrder = [];
        var tm;
        while ((tm = tabRegex.exec(html)) !== null) {
            var tabId = tm[1];
            var tabName = tm[2].replace(/<[^>]+>/g, '').trim();
            tabMap[tabId] = tabName;
            tabOrder.push(tabId);
        }

        var listRegex = /<ul[^>]*id=["']([^"']+)["'][^>]*class=["']anthology-list-play[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi;
        var listMap = {};
        var lm;
        while ((lm = listRegex.exec(html)) !== null) {
            var ulId = lm[1];
            var ulContent = lm[2];
            var epRegex = /<a[^>]+href=["'](\/vodplay\/[^"']+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
            var eps = [];
            var em;
            while ((em = epRegex.exec(ulContent)) !== null) {
                var playPath = em[1].trim();
                var epName = em[2].replace(/<[^>]+>/g, '').trim();
                if (epName && playPath) {
                    eps.push(epName + '$' + playPath);
                }
            }
            listMap[ulId] = eps;
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

        if (playFromList.length === 0) {
            for (var key in listMap) {
                if (listMap[key].length > 0) {
                    playFromList.push(tabMap[key] || '片库播放');
                    playUrlList.push(listMap[key].join('#'));
                }
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

        return {
            list: [vod_info]
        };
    }

    async playerContent(flag, id, vipFlags) {
        var playUrl = '';
        if (id.indexOf('http') === 0) {
            playUrl = id;
        } else if (id.indexOf('/') === 0) {
            playUrl = this.siteHost + id;
        } else {
            playUrl = this.siteHost + '/vodplay/' + id + '.html';
        }

        var html = await this.httpReq(playUrl, {
            headers: {
                'User-Agent': DEFAULT_UA,
                'Referer': this.siteHost + '/'
            }
        });

        var match = html ? html.match(/player_aaaa\s*=\s*\{([\s\S]*?)\}/) : null;
        if (!match) {
            return {
                parse: 1,
                playUrl: '',
                url: playUrl,
                header: {
                    'User-Agent': DEFAULT_UA,
                    'Referer': this.siteHost + '/'
                }
            };
        }

        var rawUrl = '';
        try {
            var config = JSON.parse(match[0].replace(/player_aaaa\s*=\s*/, ''));
            if (config && config.url) {
                rawUrl = config.url;
            }
        } catch (e) {
            var urlMatch = match[1].match(/"url"\s*:\s*"([^"]+)"/);
            if (urlMatch) {
                rawUrl = urlMatch[1].replace(/\\/g, '');
            }
        }

        if (rawUrl && (rawUrl.indexOf('.m3u8') !== -1 || rawUrl.indexOf('.mp4') !== -1 || rawUrl.indexOf('http') === 0)) {
            return {
                parse: 0,
                playUrl: '',
                url: rawUrl,
                header: {
                    'User-Agent': DEFAULT_UA,
                    'Referer': this.siteHost + '/'
                }
            };
        }

        return {
            parse: 1,
            playUrl: '',
            url: playUrl,
            header: {
                'User-Agent': DEFAULT_UA,
                'Referer': this.siteHost + '/'
            }
        };
    }

    async searchContent(wd, quick, pg = '1') {
        var page = parseInt(pg) || 1;
        var url = this.siteHost + '/vodsearch/-------------.html?wd=' + encodeURIComponent(wd);
        if (page > 1) {
            url = this.siteHost + '/vodsearch/' + encodeURIComponent(wd) + '----------' + page + '---.html';
        }

        var html = await this.httpReq(url, {
            headers: {
                'Referer': this.siteHost + '/'
            }
        });

        var list = parseCardList(html, this.siteHost);

        return {
            page: page,
            pagecount: 1,
            limit: list.length,
            total: list.length,
            list: list
        };
    }
}
