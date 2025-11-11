const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;

// Minimal status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Minimal server running', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Minimal Islamic College API - Working!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
});