const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./index');
const apiRoutes = require('../presentation/routes');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend presentation views
const viewsPath = path.join(__dirname, '..', 'presentation', 'views');
app.use(express.static(viewsPath));

// Mount REST API routes
app.use(config.apiPrefix, apiRoutes);

// Fallback to index.html for non-API route navigation
app.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'index.html'));
});

// 404 Route Catch-all
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
