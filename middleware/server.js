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

//1.health check
app.get('/_health', (req, res) => {
  res.json({ status: 'ok', target: TARGET, time: new Date().toISOString() });
});

// 2. patterns
const SQLI_PATTERN = /('|--|;|\/\*|\*\/|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bOR\s+1\s*=\s*1\b)/i;
const XSS_PATTERN = /<\s*script|<\s*\/script|<\s*img|<\s*iframe|<\s*svg|<\s*object|<\s*embed|<\s*body|<\s*link|<\s*style|javascript\s*:|onerror\s*=|onload\s*=|onclick\s*=|onmouseover\s*=|onfocus\s*=|oninput\s*=/i;

//------- Sql validation- search---------
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

//--------------XSS VALIDATION------------------
app.use('/rest/products/:id/reviews', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const message = (req.body && req.body.message) || '';
  console.log(`[XSS check] review message="${message}"`);
  if (XSS_PATTERN.test(message)) {
    console.warn(`[BLOCKED] XSS in review — message="${message}"`);
    return res.status(400).json({ error: 'Invalid input', message: 'Review contains disallowed HTML/script content' });
  }
  next();
});

// ---------------- XSS VALIDATION (search query) ----------------
app.use('/rest/products/search', (req, res, next) => {
  const q = (req.query && req.query.q) || '';
  console.log(`[XSS check] search q="${q}"`);
  if (XSS_PATTERN.test(q)) {
    console.warn(`[BLOCKED] XSS in search — q="${q}"`);
    return res.status(400).json({ error: 'Invalid input', message: 'Search query contains disallowed content' });
  }
  next();
});

// ---proxy-----
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
  console.log(` Middleware on :${PORT} → ${TARGET}`);
});