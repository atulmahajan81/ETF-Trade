// Consolidated MStocks TypeA API Proxy
// Handles all TypeA endpoints to reduce serverless function count for Vercel Hobby plan

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Mirae-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract the path from query parameters
    const { path = [] } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    
    // Construct the target MStocks API URL
    const baseUrl = 'https://api.mstock.trade/openapi/typea';
    const targetUrl = `${baseUrl}/${apiPath}`;
    
    console.log('Proxying TypeA request:', {
      method: req.method,
      apiPath,
      targetUrl,
      headers: {
        'Authorization': req.headers.authorization ? 'Present' : 'Missing',
        'X-Mirae-Version': req.headers['x-mirae-version']
      }
    });

    // Prepare headers for the target API
    const headers = {
      'X-Mirae-Version': req.headers['x-mirae-version'] || '1',
      'Content-Type': req.headers['content-type'] || 'application/json'
    };

    // Add authorization if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Make the request to MStocks API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    // Get response data
    const data = await response.json();
    
    console.log('MStocks API response:', {
      status: response.status,
      statusText: response.statusText,
      dataKeys: Object.keys(data || {})
    });

    // Return the response
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message,
      status: 'error'
    });
  }
}
