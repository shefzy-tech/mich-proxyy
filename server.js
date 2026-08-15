const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// YOUR BOT SERVER IP - MAKE SURE THIS IS EXACTLY CORRECT
//const BACKEND_URL = 'http://217.76.60.236:2008'; 
const BACKEND_URL = 'http://38.46.216.164:1960';

// Forward all requests 
app.all('*', async (req, res) => {
  // Remove trailing slashes to avoid double slash issues
  const cleanUrl = req.url.startsWith('/') ? req.url.slice(1) : req.url;
  const targetUrl = `${BACKEND_URL}/${cleanUrl}`;
  
  // Handle root path
  const finalUrl = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;

  // Clean up headers
  const headers = { ...req.headers };
  delete headers.host;
  delete headers['x-forwarded-for'];
  delete headers['x-forwarded-proto'];
  delete headers['accept-encoding'];
  delete headers['content-length'];  // Let fetch handle this

  try {
    console.log(`[PROXY] ${req.method} -> ${finalUrl}`);
    
    const fetchOptions = {
      method: req.method,
      headers: headers,
      timeout: 30000
    };

    // Only add body for methods that support it
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(finalUrl, fetchOptions);

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Forward the response
    res.status(response.status).send(data);
    
  } catch (err) {
    console.error('[PROXY] Error:', err.message);
    res.status(502).json({ 
      error: 'Backend unreachable', 
      details: err.message,
      target: finalUrl
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy running on port ${PORT}`);
  console.log(`🔄 Forwarding to: ${BACKEND_URL}`);
});
