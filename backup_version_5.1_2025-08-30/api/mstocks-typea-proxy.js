// Consolidated MStocks TypeA API Proxy
// Handles all TypeA endpoints to reduce serverless function count for Vercel Hobby plan

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
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

    console.log('MStocks API response status:', response.status, response.statusText);

    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      console.error('MStocks API error response:', response.status, response.statusText);
      
      // Try to get error details - read response body only once
      let errorData;
      try {
        const responseText = await response.text();
        console.error('MStocks API error response text:', responseText.substring(0, 500));
        
        // Try to parse as JSON if possible
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { 
            error: 'API Error', 
            message: responseText.substring(0, 200),
            status: response.status,
            statusText: response.statusText
          };
        }
      } catch (textError) {
        errorData = { 
          error: 'API Error', 
          message: 'Failed to read error response',
          status: response.status,
          statusText: response.statusText
        };
      }
      
      return res.status(response.status).json(errorData);
    }

    // Get response data - read response body only once
    let data;
    try {
      const responseText = await response.text();
      
      // Check if response is HTML (error page)
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
          responseText.trim().toLowerCase().startsWith('<html') ||
          responseText.includes('<html') ||
          responseText.includes('<!DOCTYPE')) {
        console.error('MStocks API returned HTML error page:', responseText.substring(0, 500));
        
        return res.status(500).json({
          error: 'HTML Error Response',
          message: 'MStocks API returned HTML error page instead of JSON',
          status: 'error',
          details: 'The API server returned an HTML error page. This usually indicates a server error or authentication issue.',
          responsePreview: responseText.substring(0, 200)
        });
      }
      
      // Try to parse as JSON
      try {
        data = JSON.parse(responseText);
        console.log('MStocks API success response data keys:', Object.keys(data || {}));
      } catch (jsonError) {
        console.error('Failed to parse MStocks API response as JSON:', jsonError);
        console.error('Raw response text:', responseText.substring(0, 500));
        
        return res.status(500).json({
          error: 'Invalid JSON Response',
          message: 'MStocks API returned non-JSON response',
          status: 'error',
          details: responseText.substring(0, 200)
        });
      }
    } catch (textError) {
      console.error('Failed to read response body:', textError);
      return res.status(500).json({
        error: 'Response Read Error',
        message: 'Failed to read response from MStocks API',
        status: 'error'
      });
    }

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
