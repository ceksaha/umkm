const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: { type: String, required: true },
    items: [{
        name: String,
        price: Number,
        qty: Number
    }],
    total: { type: Number, required: true },
    address: { type: String, required: true },
    status: { type: String, default: 'PENDING' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
