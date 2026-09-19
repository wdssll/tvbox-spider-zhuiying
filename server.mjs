import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8080;
const LOG_FILE = path.join(__dirname, 'tvbox_debug.log');

function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    process.stdout.write(line);
    fs.appendFileSync(LOG_FILE, line, 'utf8');
}

import crypto from 'crypto';

function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

async function resolveStreamUrl(playPath) {
    const siteHost = 'https://zhuiying3.cc';
    const playUrl = playPath.startsWith('http') ? playPath : (siteHost + playPath);
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const pageRes = await fetch(playUrl, { headers: { 'User-Agent': ua, 'Referer': siteHost + '/' } });
    const html = await pageRes.text();

    const match = html.match(/MAC_PLAY_CONFIG\s*=\s*\{([\s\S]*?)\};/);
    if (!match) throw new Error('MAC_PLAY_CONFIG not found');

    const configText = '{' + match[1] + '}';
    const requestUrlMatch = configText.match(/requestUrl\s*:\s*["']([^"']+)["']/);
    const baseKeyMatch = configText.match(/baseKey\s*:\s*["']([^"']+)["']/);
    if (!requestUrlMatch || !baseKeyMatch) throw new Error('requestUrl or baseKey missing');

    const requestUrl = requestUrlMatch[1];
    const baseKey = baseKeyMatch[1];
    const timestamp = Math.floor(Date.now() / 1000);
    const token = md5(baseKey + timestamp + ua);

    log(`[RESOLVE DEBUG] baseKey=${baseKey}, ts=${timestamp}, token=${token}, reqUrlLen=${requestUrl.length}`);

    const postBody = `url=${encodeURIComponent(requestUrl)}&timestamp=${timestamp}&token=${token}`;
    const apiRes = await fetch(siteHost + '/player_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': playUrl,
            'User-Agent': ua,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: postBody
    });

    const apiJson = await apiRes.json();
    log(`[RESOLVE DEBUG] apiJson: ${JSON.stringify(apiJson)}`);
    if (apiJson.error) throw new Error(apiJson.error);

    const reversed = apiJson.data.split('').reverse().join('');
    const decoded = Buffer.from(reversed, 'base64').toString('utf8');
    const data = JSON.parse(decoded);
    return data.jmurl || data.url;
}

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const clientIp = req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'none';
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    log(`[${req.method}] ${parsedUrl.pathname}${parsedUrl.search} from ${clientIp} (UA: ${userAgent})`);

    // Logger endpoint for gaze.js
    if (parsedUrl.pathname === '/log') {
        const msg = parsedUrl.searchParams.get('msg') || '';
        log(`>>> [TVBOX LOG]: ${msg}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
    }

    // Direct stream resolution proxy endpoint
    if (parsedUrl.pathname === '/parse_play') {
        const playPath = parsedUrl.searchParams.get('id') || '';
        log(`[RESOLVE] Requesting stream for path: ${playPath}`);
        try {
            const streamUrl = await resolveStreamUrl(playPath);
            log(`[RESOLVE SUCCESS] Stream: ${streamUrl}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                code: 1,
                url: streamUrl
            }));
        } catch (err) {
            log(`[RESOLVE ERROR]: ${err.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                code: 0,
                error: err.message
            }));
        }
        return;
    }

    // Static file serving
    let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'config.json' : parsedUrl.pathname);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = {
            '.json': 'application/json; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.mjs': 'application/javascript; charset=utf-8',
            '.html': 'text/html; charset=utf-8',
            '.txt': 'text/plain; charset=utf-8'
        };

        const contentType = mimeMap[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    log(`Server running at http://0.0.0.0:${PORT}/`);
});
