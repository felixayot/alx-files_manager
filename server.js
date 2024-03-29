// Express server

const express = require('express');
const mapRoutes = require('./routes/index');

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(mapRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for testing
module.exports = app;
