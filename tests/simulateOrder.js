const axios = require('axios');

const URL = 'http://localhost:3000/webhook';
const PHONE = '6281234567890';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runDemo() {
    console.log("🚀 Starting Order Simulation...");

    // 1. Send 'menu'
    console.log("--- User: menu");
    let resp = await axios.post(URL, { from: PHONE, message: 'menu' });
    console.log("--- Bot:", resp.data.reply);
    await sleep(2000);

    // 2. Select product 1
    console.log("--- User: 1");
    resp = await axios.post(URL, { from: PHONE, message: '1' });
    console.log("--- Bot:", resp.data.reply);
    await sleep(2000);

    // 3. Checkout (Option 2)
    console.log("--- User: 2");
    resp = await axios.post(URL, { from: PHONE, message: '2' });
    console.log("--- Bot:", resp.data.reply);
    await sleep(2000);

    // 4. Enter Address
    console.log("--- User: Jl. Mawar No. 12, Bekasi");
    resp = await axios.post(URL, { from: PHONE, message: 'Jl. Mawar No. 12, Bekasi' });
    console.log("--- Bot:", resp.data.reply);

    console.log("\n✅ Simulation Complete! Check your Dashboard.");
}

runDemo().catch(err => {
    console.error("❌ Simulation Failed. Make sure the server is running on port 3000.");
    console.error(err.message);
});
