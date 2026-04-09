require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const connectDB = require('./db');
const cookieParser = require('cookie-parser');
const { protect } = require('./middleware/auth');
connectDB();
const { handleIncomingMessage } = require('./services/botEngine');

const app = express();
app.set('trust proxy', 1); // For production behind Nginx/Proxy
const server = http.createServer(app);

// Initialize Socket.io
const { initSocket } = require('./services/socket');
initSocket(server);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Static Files (Except dashboard)
app.use(express.static('public', { index: false }));

// Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

app.use('/api/auth', authRoutes);
app.use('/api', protect, apiRoutes); // Protect all API routes

// Front-end routes
app.get('/', (req, res) => res.redirect('/dashboard'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', protect, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Health Check for Monitoring
app.get('/health', (req, res) => res.status(200).send('OK'));

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Admin Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🤖 Webhook URL: http://localhost:${PORT}/webhook`);
});

// WhatsApp Integration (Dynamic loading in case of env issues)
try {
    const { startWhatsApp } = require('./services/whatsapp');
    startWhatsApp().catch(err => console.error("WhatsApp Service Error:", err));
} catch (e) {
    console.error("❌ Gagal memuat integrasi WhatsApp:", e.message);
    console.warn("⚠️ Barcode tidak akan muncul selama error ini belum diperbaiki.");
}

// Graceful Shutdown
const shutdown = async (signal) => {
    console.log(`\nSHUTDOWN: Received ${signal}. Closing connections...`);
    
    // Close server
    server.close(() => {
        console.log("- Server stopped.");
        process.exit(0);
    });

    // Timeout if shutdown takes too long
    setTimeout(() => {
        console.error("- Force shutdown after 10s.");
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

