const mongoose = require('mongoose');
const Setting = require('./models/setting');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const s = await Setting.find({});
    console.log(JSON.stringify(s, null, 2));
    process.exit(0);
}
check();
