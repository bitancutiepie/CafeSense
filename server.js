require('dotenv').config();

const app = require('./src/config/app');
const config = require('./src/config');
const db = require('./src/config/database');

const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`☕ CaféSense Unified Server running in [${config.env}] mode`);
    console.log(`🌐 Web UI: http://localhost:${config.port}`);
    console.log(`📡 REST API: http://localhost:${config.port}${config.apiPrefix}`);
    console.log(`====================================================`);
});

function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Shutting down CaféSense server...`);
    server.close(() => {
        console.log('HTTP server closed. Exiting process.');
        process.exit(0);
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
