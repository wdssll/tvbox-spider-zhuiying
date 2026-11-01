import { Spider } from 'catvod';

/**
 * FongMi / TVBox QuickJS Spider for 努努影院 (nnyy.in)
 * Type: 3 (FongMi QuickJS Class Module)
 */

var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

var categoryClasses = [
    { type_id: 'dianying', type_name: '电影' },
    { type_id: 'dianshiju', type_name: '电视剧' },
    { type_id: 'zongyi', type_name: '综艺' },
    { type_id: 'dongman', type_name: '动漫' }
];

var commonFilters = [
    {
        key: 'area',
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
            { n: '最新', v: '' },
            { n: '热门', v: 'click' },
            { n: '评分', v: 'rating' }
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

function parseCards(html, siteHost) {
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

export default class NnyySpider extends Spider {
    constructor() {
        super();
        this.siteHost = 'https://nnyy.in';
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
            filters: buildFilters()
        };
    }

    async homeVideoContent() {
        var html = await this.httpReq(this.siteHost + '/dianying/', {
            headers: { 'User-Agent': DEFAULT_UA, 'Referer': this.siteHost + '/' }
        });
        var list = parseCards(html, this.siteHost);
        return {
            list: list
        };
    }

    async categoryContent(tid, pg, filter, extend) {
        pg = parseInt(pg, 10) || 1;
        extend = extend || {};

        var url = this.siteHost + '/' + tid + '/';
        var query = [];
        if (extend.area) query.push('area=' + encodeURIComponent(extend.area));
        if (extend.year) query.push('year=' + encodeURIComponent(extend.year));
        if (extend.ob) query.push('ob=' + encodeURIComponent(extend.ob));
        if (pg > 1) query.push('page=' + pg);

        if (query.length > 0) {
            url += '?' + query.join('&');
        }

        var html = await this.httpReq(url, {
            headers: { 'User-Agent': DEFAULT_UA, 'Referer': this.siteHost + '/' }
        });
        var list = parseCards(html, this.siteHost);

        var hasMore = list.length >= 20;
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
        var detailUrl = (id.indexOf('http') === 0) ? id : (this.siteHost + (id.indexOf('/') === 0 ? id : ('/' + id)));
        var html = await this.httpReq(detailUrl, {
            headers: { 'User-Agent': DEFAULT_UA, 'Referer': this.siteHost + '/' }
        });

        if (!html) {
            return { list: [] };
        }

        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        var picMatch = html.match(/<img[^>]+src=["'](\/nnimg\/[^"']+)["']/i) || html.match(/class=["']thumb[^"']*["'][^>]+src=["']([^"']+)["']/i);
        var pic = picMatch ? picMatch[1] : '';
        if (pic && pic.indexOf('http') !== 0) {
            pic = this.siteHost + pic;
        }

        var self = this;
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
            if (numId && slug) {
                episodes.push(epText + '$' + numId + '-' + slug);
            }
        }

        if (episodes.length === 0 && numId) {
            episodes.push('正片$' + numId + '-1');
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
            vod_play_from: '努努专线',
            vod_play_url: episodes.join('#')
        };

        return {
            list: [vod]
        };
    }

    async playerContent(flag, id, flags) {
        var apiUrl = this.siteHost + '/_gp/' + id;
        var respText = await this.httpReq(apiUrl, {
            headers: {
                'User-Agent': DEFAULT_UA,
                'Referer': this.siteHost + '/',
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
        var searchUrl = this.siteHost + '/search.html?wd=' + encodeURIComponent(wd || '');
        if (pg > 1) searchUrl += '&page=' + pg;

        var html = await this.httpReq(searchUrl, {
            headers: { 'User-Agent': DEFAULT_UA, 'Referer': this.siteHost + '/' }
        });
        var list = parseCards(html, this.siteHost);

        return {
            page: pg,
            pagecount: 1,
            limit: list.length,
            total: list.length,
            list: list
        };
    }
}
