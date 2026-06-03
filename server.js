const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Your bot server (HTTP)
const BACKEND_URL = 'https://ambassador.seyori.name.ng:2008';

// Forward all requests
app.all('*', async (req, res) => {
  const targetUrl = BACKEND_URL + req.url;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers['x-forwarded-for'];
  delete headers['x-forwarded-proto'];
  delete headers['accept-encoding'];  // optional, can cause issues

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.status(response.status).send(data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(502).json({ error: 'Backend unreachable', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
