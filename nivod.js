import { Spider } from 'catvod';

/**
 * FongMi / TVBox QuickJS Spider for 泥视频 (www.nivod.cc)
 * Type: 3 (FongMi QuickJS Class Module)
 */

var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parseCardList(html, siteHost) {
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

export default class NivodSpider extends Spider {
    constructor() {
        super();
        this.siteHost = 'https://www.nivod.cc';
    }

    async init(ext) {
        if (ext) {
            if (typeof ext === 'string' && ext.indexOf('http') === 0) {
                this.siteHost = ext.replace(/\/+$/, '');
            } else if (typeof ext === 'object' && ext.site) {
                this.siteHost = ext.site.replace(/\/+$/, '');
            }
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
        return {
            class: categoryClasses,
            filters: {}
        };
    }

    async homeVideoContent() {
        var html = await this.httpReq(this.siteHost + '/filter.html?channel=movie&page=1', {
            headers: { 'User-Agent': DEFAULT_UA, 'Referer': this.siteHost + '/' }
        });
        var list = parseCardList(html, this.siteHost);
        return {
            list: list
        };
    }

    async categoryContent(tid, pg, filter, extend) {
        pg = parseInt(pg, 10) || 1;
        var channel = tid || 'movie';
        if (channel === '1') channel = 'movie';
        else if (channel === '2') channel = 'tv';
        else if (channel === '3') channel = 'show';
        else if (channel === '4') channel = 'anime';

        var url = this.siteHost + '/filter.html?channel=' + channel + '&page=' + pg;
        var html = await this.httpReq(url, {
            headers: { 'User-Agent': DEFAULT_UA, 'Referer': this.siteHost + '/' }
        });
        var list = parseCardList(html, this.siteHost);

        var hasMore = list.length >= 24;
        var pageCount = hasMore ? (pg + 1) : pg;

        return {
            page: pg,
            pagecount: pageCount,
            limit: list.length,
            total: pageCount * list.length,
            list: list
        };
    }

    async detailContent(ids) {
        var id = Array.isArray(ids) ? ids[0] : ids;
        var cleanId = ('' + id).replace(/[^0-9]/g, '');
        var detailUrl = this.siteHost + '/voddetail/' + cleanId;
        var html = await this.httpReq(detailUrl, {
            headers: { 'User-Agent': DEFAULT_UA, 'Referer': this.siteHost + '/' }
        });

        if (!html) {
            return { list: [] };
        }

        var titleMatch = html.match(/<title>([^<_]+)/i);
        var vodName = titleMatch ? titleMatch[1].trim() : ('影片' + cleanId);

        var kwMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
        var kw = kwMatch ? kwMatch[1].split(',') : [];
        var year = kw[1] || '';
        var area = kw[3] ? kw[3].split('-')[0].trim() : '';

        var descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
        var desc = descMatch ? descMatch[1].trim() : '';

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
        episodes.reverse();

        if (episodes.length === 0) {
            episodes.push('正片$/vodplay/' + cleanId + '/ep1');
        }

        var vod = {
            vod_id: cleanId,
            vod_name: vodName,
            vod_pic: this.siteHost + '/imgs/small/' + cleanId + '.jpg',
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

        return {
            list: [vod]
        };
    }

    async playerContent(flag, id, flags) {
        var clean = ('' + id).replace(/^\/+/, '').replace(/^vodplay\//, '').replace('/', '-');
        var apiUrl = this.siteHost + '/xhr_playinfo/' + clean;

        var resp = await this.httpReq(apiUrl, {
            headers: {
                'User-Agent': DEFAULT_UA,
                'Referer': this.siteHost + '/vodplay/' + clean.replace('-', '/'),
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
            return {
                parse: 0,
                playUrl: '',
                url: streamUrl,
                header: {
                    'User-Agent': DEFAULT_UA,
                    'Referer': this.siteHost + '/'
                }
            };
        }

        return {
            parse: 0,
            playUrl: '',
            url: '',
            header: {
                'User-Agent': DEFAULT_UA,
                'Referer': this.siteHost + '/'
            }
        };
    }

    async searchContent(wd, quick, pg = '1') {
        pg = parseInt(pg, 10) || 1;
        var searchUrl = this.siteHost + '/search.html?keyword=' + encodeURIComponent(wd || '');
        var html = await this.httpReq(searchUrl, {
            headers: { 'User-Agent': DEFAULT_UA, 'Referer': this.siteHost + '/' }
        });

        var list = parseCardList(html, this.siteHost);

        return {
            page: pg,
            pagecount: 1,
            limit: list.length,
            total: list.length,
            list: list
        };
    }
}
