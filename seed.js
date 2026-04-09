require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wa-order-bot';

const seedProducts = async () => {
    console.log('Connecting to MongoDB:', MONGO_URI);
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        await Product.deleteMany({});

        const initialProducts = [
            { name: 'Nasi Uduk', price: 10000, category: 'Makanan', description: 'Nasi uduk betawi komplit' },
            { name: 'Ayam Goreng', price: 15000, category: 'Makanan', description: 'Ayam goreng bumbu kuning' },
            { name: 'Es Teh Manis', price: 5000, category: 'Minuman', description: 'Es teh manis segar' },
            { name: 'Tempe Goreng', price: 3000, category: 'Camilan', description: 'Tempe goreng crispy' },
            { name: 'Soto Ayam', price: 12000, category: 'Makanan', description: 'Soto ayam kuah kuning' },
        ];

        await Product.insertMany(initialProducts);
        console.log('✅ Produk berhasil di-seed!');

        // Seed Admin
        const Admin = require('./models/admin');
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            await Admin.create({
                username: 'admin',
                password: 'password123' // This will be hashed by pre-save middleware
            });
            console.log('✅ Admin default dibuat (admin / password123)');
        } else {
            console.log('ℹ️ Admin sudah ada, tidak dibuat ulang.');
        }

        initialProducts.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.name} - Rp ${p.price.toLocaleString()}`);
        });
    } catch (error) {
        console.error('❌ Error seeding:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
};

seedProducts();
