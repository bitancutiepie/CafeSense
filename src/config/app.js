const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./index');
const apiRoutes = require('../presentation/routes');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');

const app = express();

// CORS Configuration
const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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