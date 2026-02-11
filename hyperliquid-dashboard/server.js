const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

// Cache tweets for 5 minutes
let tweetCache = { data: [], timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

function fetchTweets() {
    const now = Date.now();
    if (now - tweetCache.timestamp < CACHE_TTL && tweetCache.data.length > 0) {
        return tweetCache.data;
    }
    
    try {
        // Fetch home timeline using bird
        const result = execSync('bird home --count 20 --json 2>/dev/null', { 
            encoding: 'utf-8',
            timeout: 30000 
        });
        const tweets = JSON.parse(result);
        tweetCache = { data: tweets, timestamp: now };
        return tweets;
    } catch (e) {
        console.error('Failed to fetch tweets:', e.message);
        // Return cached data even if stale
        return tweetCache.data;
    }
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // API endpoint for tweets
    if (req.url === '/api/tweets') {
        const tweets = fetchTweets();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(tweets));
        return;
    }
    
    // Static file serving
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Miyamoto Labs Dashboard running at http://localhost:${PORT}`);
    console.log('   Twitter feed: /api/tweets');
});
