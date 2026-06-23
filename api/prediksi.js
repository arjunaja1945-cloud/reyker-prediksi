module.exports = async (req, res) => {
    const targetUrl = Array.isArray(req.query?.url) ? req.query.url[0] : req.query?.url;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (!targetUrl) {
        return res.status(400).send('Parameter `url` wajib diisi.');
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(targetUrl);
    } catch (error) {
        return res.status(400).send('URL target tidak valid.');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).send('Protocol URL tidak didukung.');
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const upstreamResponse = await fetch(parsedUrl.toString(), {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        clearTimeout(timeout);

        if (!upstreamResponse.ok) {
            return res.status(upstreamResponse.status).send(`Gagal mengambil sumber data (${upstreamResponse.status}).`);
        }

        const body = await upstreamResponse.text();
        const contentType = upstreamResponse.headers.get('content-type') || 'text/html; charset=utf-8';

        res.setHeader('Content-Type', contentType);
        return res.status(200).send(body);
    } catch (error) {
        const message = error?.name === 'AbortError'
            ? 'Timeout saat mengambil sumber data.'
            : 'Terjadi error saat mengambil sumber data.';

        return res.status(502).send(message);
    }
};
