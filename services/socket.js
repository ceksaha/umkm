let io;

const initSocket = (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
        cors: { origin: '*' }
    });

    io.on('connection', (socket) => {
        console.log('Admin connected to dashboard');
    });

    return io;
};

const notifyNewOrder = (order) => {
    if (io) {
        io.emit('new_order', order);
    }
};

const notifyPairingCode = (code) => {
    if (io) {
        io.emit('pairing_code', { code });
    }
};

module.exports = { initSocket, notifyNewOrder, notifyPairingCode };
