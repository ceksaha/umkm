require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/admin');

async function update() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await Admin.findOne({ username: 'admin' });
        if (admin) {
            admin.password = 'adm5wira';
            await admin.save();
            console.log('Admin password updated to adm5wira');
        } else {
            await Admin.create({ username: 'admin', password: 'adm5wira' });
            console.log('Admin created with username admin and password adm5wira');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}
update();
