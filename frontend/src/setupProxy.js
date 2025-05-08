const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /api requests to the backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );
  
  // Proxy direct endpoint requests to the backend
  const endpoints = ['/zkp', '/tax', '/users', '/blockchain'];
  endpoints.forEach(endpoint => {
    app.use(
      endpoint,
      createProxyMiddleware({
        target: 'http://localhost:5000/api',
        changeOrigin: true,
      })
    );
  });
};
