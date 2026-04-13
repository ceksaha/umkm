require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/admin');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admins = await Admin.find({});
        console.log('Admins found:', admins.map(a => a.username));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}
check();
