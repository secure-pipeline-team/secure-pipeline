const express = require('express');
const proxy = require('express-http-proxy');
const helmet = require('helmet');

const app = express();
const PORT = 8080;
const TARGET = process.env.TARGET || 'http://juice-shop:3000';

app.set('trust proxy', true);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/_health', (req, res) => {
  res.json({ status: 'ok', target: TARGET, time: new Date().toISOString() });
});

const SQLI_PATTERN = /('|--|;|\/\*|\*\/|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bOR\s+1\s*=\s*1\b)/i;

app.use('/rest/user/login', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const email = (req.body && req.body.email) || '';
  const password = (req.body && req.body.password) || '';
  console.log(`[/rest/user/login] inspecting email="${email}"`);
  if (SQLI_PATTERN.test(email) || SQLI_PATTERN.test(password)) {
    console.warn(`[BLOCKED] SQLi attempt — email="${email}"`);
    return res.status(401).json({ error: 'Invalid credentials', message: 'Input rejected by security policy' });
  }
  next();
});

app.use('/', proxy(TARGET, {
  proxyReqBodyDecorator: (bodyContent, srcReq) => {
    // Re-send the JSON body
    return srcReq.body ? JSON.stringify(srcReq.body) : bodyContent;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    return proxyResData;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error('[proxy error]', err.message);
    res.status(502).json({ error: 'Upstream unavailable' });
  }
}));

app.listen(PORT, () => {
  console.log(`✅ Middleware on :${PORT} → ${TARGET}`);
});