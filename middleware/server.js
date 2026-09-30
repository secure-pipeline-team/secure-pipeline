const express = require('express');
const proxy = require('express-http-proxy');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8080;
const TARGET = process.env.TARGET || 'http://juice-shop:3000';

app.set('trust proxy', true);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ---------------- HEALTH CHECK ----------------
app.get('/_health', (req, res) => {
  res.json({ status: 'ok', target: TARGET, time: new Date().toISOString() });
});

// ---------------- PATTERNS ----------------
const SQLI_PATTERN = /('|--|;|\/\*|\*\/|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bOR\s+1\s*=\s*1\b)/i;
const XSS_PATTERN = /<\s*script|<\s*\/script|<\s*img|<\s*iframe|<\s*svg|<\s*object|<\s*embed|<\s*body|<\s*link|<\s*style|javascript\s*:|onerror\s*=|onload\s*=|onclick\s*=|onmouseover\s*=|onfocus\s*=|oninput\s*=/i;

// ---------------- JWT HELPER ----------------
function getUserFromToken(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  try {
    // Split JWT and decode the middle (payload) segment
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    console.log(`[TOKEN DEBUG] id=${payload.data && payload.data.id}, role=${payload.data && payload.data.role}, bid=${payload.bid}`);
    return payload;
  } catch (e) {
    console.log(`[TOKEN DEBUG] decode error: ${e.message}`);
    return null;
  }
}

// ---------------- SQLi VALIDATION (login) ----------------
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

// ---------------- XSS VALIDATION (reviews) ----------------
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

// ---------------- XSS VALIDATION (search) ----------------
app.use('/rest/products/search', (req, res, next) => {
  const q = (req.query && req.query.q) || '';
  console.log(`[XSS check] search q="${q}"`);
  if (XSS_PATTERN.test(q)) {
    console.warn(`[BLOCKED] XSS in search — q="${q}"`);
    return res.status(400).json({ error: 'Invalid input', message: 'Search query contains disallowed content' });
  }
  next();
});

// ---------------- IDOR FIX (user records) ----------------
app.use('/api/Users', (req, res, next) => {
  const decoded = getUserFromToken(req);
  if (!decoded || !decoded.data) {
    console.log(`[IDOR check] no valid token, passing through`);
    return next();
  }

  const currentUserId = decoded.data.id;
  const currentRole = decoded.data.role;
  // Inside an app.use mount, req.path is relative — use req.originalUrl to be safe
  const parts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
  const requestedId = parts[2];

  console.log(`[IDOR check] user=${currentUserId} role=${currentRole} -> requested=${requestedId}`);

  if (requestedId && currentRole !== 'admin' && String(currentUserId) !== String(requestedId)) {
    console.warn(`[BLOCKED] IDOR: user ${currentUserId} (${currentRole}) tried to access user ${requestedId}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own user record'
    });
  }

  next();
});

// ---------------- IDOR FIX (user list) ----------------
app.use('/rest/user/authentication-details', (req, res, next) => {
  const decoded = getUserFromToken(req);
  if (!decoded || !decoded.data) return next();

  const currentRole = decoded.data.role;
  console.log(`[Admin check] authentication-details requested by role=${currentRole}`);

  if (currentRole !== 'admin') {
    console.warn(`[BLOCKED] Non-admin (${currentRole}) tried to list all users`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required'
    });
  }

  next();
});

// ---------------- BASKET IDOR FIX ----------------
app.use('/rest/basket', (req, res, next) => {
  const decoded = getUserFromToken(req);
  if (!decoded || !decoded.data) {
    console.log(`[BasketIDOR] no valid token`);
    return next();
  }

  const userBid = decoded.bid;
  const userRole = decoded.data.role;
  const parts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
  const requestedBid = parts[2];

  console.log(`[BasketIDOR] user bid=${userBid} role=${userRole} -> requested=${requestedBid}`);

  if (requestedBid && userRole !== 'admin' && String(userBid) !== String(requestedBid)) {
    console.warn(`[BLOCKED] Basket IDOR: user bid=${userBid} tried to access basket ${requestedBid}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own basket'
    });
  }

  next();
});

// ---------------- PROXY (MUST BE LAST) ----------------
app.use('/', proxy(TARGET, {
  // Preserve Authorization header when forwarding
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (srcReq.headers['authorization']) {
      proxyReqOpts.headers['authorization'] = srcReq.headers['authorization'];
    }
    return proxyReqOpts;
  },
  proxyReqBodyDecorator: (bodyContent, srcReq) => {
    if (srcReq.body && Object.keys(srcReq.body).length > 0) {
      const body = JSON.stringify(srcReq.body);
      // express-http-proxy sets content-length automatically from this
      return body;
    }
    return bodyContent;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error('[proxy error]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Upstream unavailable' });
    }
  }
}));

app.listen(PORT, () => {
  console.log(` Middleware on :${PORT} -> ${TARGET}`);
});