const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// Get all orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// +++++ PRODUCTS API +++++
const Product = require('../models/product');

// Get all products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ name: 1 });
        res.json({ success: true, data: products });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Create product
router.post('/products', async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: product });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// Update product
router.put('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ success: false, message: 'Product Not Found' });
        res.json({ success: true, data: product });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// Delete product (Soft delete or hard delete? Let's do hard delete for now but toggle isActive is better)
router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product Not Found' });
        res.json({ success: true, message: 'Product deleted' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Update order status
const { sendWhatsAppMessage } = require('../services/whatsapp');

router.patch('/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedOrder) return res.status(404).json({ success: false, message: 'Order Not Found' });
        
        // Notify customer via WhatsApp
        let message = '';
        if (status === 'PROSES') {
            message = `👨‍🍳 *PESANAN DIPROSES* 👩‍🍳\n\nID Order: #${updatedOrder._id.toString().slice(-6)}\nStatus: Sedang disiapkan/dimasak.\n\nMohon ditunggu ya!`;
        } else if (status === 'COMPLETED') {
            message = `✅ *PESANAN SELESAI* ✅\n\nID Order: #${updatedOrder._id.toString().slice(-6)}\nStatus: Pesanan sudah selesai & dibayar.\n\nTerima kasih sudah berbelanja!`;
        } else if (status === 'CANCELLED') {
            message = `❌ *PESANAN DIBATALKAN* ❌\n\nID Order: #${updatedOrder._id.toString().slice(-6)}\nMohon maaf, pesanan Anda telah dibatalkan oleh admin.`;
        }

        if (message) {
            await sendWhatsAppMessage(updatedOrder.customer, message);
        }

        res.json({ success: true, data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// +++++ SETTINGS API +++++
const Setting = require('../models/setting');

router.get('/settings', async (req, res) => {
    try {
        const settings = await Setting.find();
        // Convert to object for easier use
        const settingsObj = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json({ success: true, data: settingsObj });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.patch('/settings/:key', async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    try {
        const setting = await Setting.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: setting });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// +++++ REPORTS API +++++
router.get('/reports/sales', async (req, res) => {
    try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const sales = await Order.aggregate([
            {
                $match: {
                    status: 'COMPLETED',
                    createdAt: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, data: sales });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// +++++ EXPORT API +++++
router.get('/export/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        
        let csv = 'ID,Tanggal,Customer,Total,Alamat,Status,Items\n';
        
        orders.forEach(o => {
            const items = o.items.map(i => `${i.name} (${i.qty})`).join('; ');
            const date = o.createdAt.toISOString().split('T')[0];
            csv += `"${o._id}","${date}","${o.customer}","${o.total}","${o.address.replace(/"/g, '""')}","${o.status}","${items.replace(/"/g, '""')}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
        res.status(200).send(csv);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
