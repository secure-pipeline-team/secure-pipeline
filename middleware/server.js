const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');

const app = express();
const PORT = 8080;
const TARGET = process.env.TARGET || 'http://localhost:3000';

// Trust proxy headers
app.set('trust proxy', true);

// Basic security headers (bonus - fixes cookie flags issue)
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle XSS separately
  crossOriginEmbedderPolicy: false
}));

// Parse JSON and URL-encoded bodies
//app.use(express.json({ limit: '1mb' }));
//app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint
app.get('/_health', (req, res) => {
  res.json({ status: 'ok', target: TARGET, time: new Date().toISOString() });
});

// SECURITY FIXES WILL GO HERE

// Proxy everything else to Juice Shop
app.use('/', createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  ws: true,
  logLevel: 'warn',
  onError: (err, req, res) => {
    console.error('[proxy error]', err.message);
    res.status(502).json({ error: 'Upstream unavailable' });
  }
}));

app.listen(PORT, () => {
  console.log(` Security middleware listening on http://localhost:${PORT}`);
  console.log(`   Forwarding to: ${TARGET}`);
});