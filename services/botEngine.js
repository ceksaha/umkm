const UserSession = require('../models/userSession');
const Product = require('../models/product');
const Order = require('../models/order');
const Setting = require('../models/setting');

const handleIncomingMessage = async (from, text) => {
    let session = await UserSession.findOne({ phoneNumber: from }).populate('cart.product');
    if (!session) {
        session = await UserSession.create({ phoneNumber: from });
    }

    const command = text.toLowerCase().trim();
    console.log(`[BOT ENGINE] Processing "${command}" for ${from}. Current Stage: ${session.stage}`);

    // Fetch all settings
    const settings = await Setting.find();
    const config = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});

    const storeName = config.store_name || "UMKM";
    const botFooter = config.bot_footer || "Terima kasih, mohon tunggu konfirmasi admin di dashboard.";
    const storeMaps = config.store_maps || "";

    const isShopOpen = config.is_open !== false;

    if (!isShopOpen && command !== 'status') {
        return `📴 Mohon maaf, *${storeName}* sedang *TUTUP* saat ini. Silakan hubungi kembali di jam operasional.\n\nKetik *status [ID]* untuk cek pesanan Anda sebelumnya.`;
    }

    // Status Tracking Command
    if (command.startsWith('status')) {
        const orderIdPart = command.split(' ')[1];
        if (!orderIdPart) return "🔍 Ketik *status [ID_PESANAN]* untuk melacak.\nContoh: *status 123abc*";
        
        try {
            // Find order by last 6 digits of ID or full ID
            const orders = await Order.find({ customer: from }).sort({ createdAt: -1 });
            const matchingOrder = orders.find(o => o._id.toString().endsWith(orderIdPart) || o._id.toString() === orderIdPart);
            
            if (!matchingOrder) return "❌ Pesanan tidak ditemukan atau bukan milik Anda.";
            
            return `📦 *STATUS PESANAN* 📦\n\nID: #${matchingOrder._id.toString().slice(-6)}\nStatus: *${matchingOrder.status}*\nTotal: Rp ${matchingOrder.total.toLocaleString()}\nAlamat: ${matchingOrder.address}\n\n${botFooter}`;
        } catch (e) {
            return "⚠️ Terjadi kesalahan saat mencari pesanan.";
        }
    }

    // Global Commands
    if (command === 'batal') {
        session.stage = 'START';
        session.cart = [];
        await session.save();
        return "❌ Pesanan dibatalkan. Keranjang dikosongkan.\nKetik *menu* untuk mulai lagi.";
    }

    if (command === 'keranjang') {
        if (session.cart.length === 0) return "🛒 Keranjang Anda masih kosong.";
        
        let total = 0;
        let summary = "🛒 *KERANJANG ANDA* 🛒\n\n";
        session.cart.forEach((item, index) => {
            const subtotal = item.product.price * item.qty;
            total += subtotal;
            summary += `${index + 1}. ${item.product.name} x${item.qty} = Rp ${subtotal.toLocaleString()}\n`;
        });
        summary += `\n*TOTAL: Rp ${total.toLocaleString()}*\n\nKetik *menu* untuk tambah, atau *checkout* untuk lanjut.`;
        return summary;
    }

    if (command === 'checkout' && session.cart.length > 0) {
        session.stage = 'ADD_MORE';
        return await handleIncomingMessage(from, '2'); // Simulate choosing checkout
    }

    // Reset flow if user says "menu" or if session is START
    if (command === 'menu' || session.stage === 'START') {
        const products = await Product.find({ isActive: true }).sort({ category: 1, name: 1, price: 1 });
        if (products.length === 0) return `📴 Maaf, saat ini menu di *${storeName}* belum tersedia.`;

        // Grouping by category
        const groups = products.reduce((acc, p) => {
            if (!acc[p.category]) acc[p.category] = [];
            acc[p.category].push(p);
            return acc;
        }, {});

        let menuStr = `🌟 *MENU ${storeName.toUpperCase()}* 🌟\n\n Pilih angka untuk memesan:\n`;
        // Reset and populate tempMenuMap
        const newMenuMap = [];
        let globalIndex = 1;
        
        for (const cat in groups) {
            menuStr += `\n*【 ${cat.toUpperCase()} 】*\n`;
            groups[cat].forEach(p => {
                menuStr += `${globalIndex}. ${p.name} - Rp ${p.price.toLocaleString()}\n`;
                newMenuMap.push(p._id.toString());
                globalIndex++;
            });
        }
        
        if (storeMaps) menuStr += `\n📍 Lokasi: ${storeMaps}\n`;
        menuStr += "\n---\nKetik *keranjang* untuk melihat pesanan.\nKetik *batal* untuk reset.";
        
        session.tempMenuMap = newMenuMap;
        session.stage = 'SELECT_PRODUCT';
        await session.save();
        return menuStr;
    }

    if (session.stage === 'SELECT_PRODUCT') {
        const choice = parseInt(text) - 1;
        console.log(`[BOT ENGINE] User choice index: ${choice}. Map available: ${!!session.tempMenuMap}. Map length: ${session.tempMenuMap?.length}`);

        if (!isNaN(choice) && session.tempMenuMap && session.tempMenuMap[choice]) {
            const product = await Product.findById(session.tempMenuMap[choice]);
            if (!product) {
                console.log(`[BOT ENGINE] Product ${session.tempMenuMap[choice]} NOT FOUND in DB`);
                return "⚠️ Produk tidak ditemukan. Ketik *menu* untuk update daftar.";
            }

            // Check if product already in cart
            const cartItemIndex = session.cart.findIndex(item => item.product._id.toString() === product._id.toString());
            if (cartItemIndex > -1) {
                session.cart[cartItemIndex].qty += 1;
            } else {
                session.cart.push({ product: product._id, qty: 1 });
            }
            
            session.stage = 'ADD_MORE';
            await session.save();
            console.log(`[BOT ENGINE] Product ${product.name} added. Stage set to ADD_MORE`);

            return `✅ *${product.name}* berhasil ditambah!\n\nPilih *1* untuk tambah menu lain,\natau *2* untuk Checkout (Selesai).`;
        } else {
            console.log(`[BOT ENGINE] Choice ${choice} was invalid or out of map range`);
            return "⚠️ Mohon pilih angka yang sesuai dari menu, atau ketik *menu* untuk melihat daftar lagi.";
        }
    }

    if (session.stage === 'ADD_MORE') {
        if (text === '1') {
            session.stage = 'START'; // Re-show menu
            await session.save();
            return await handleIncomingMessage(from, 'menu');
        } else if (text === '2') {
            // Summary checkout
            let total = 0;
            let summary = "📄 *RINGKASAN ORDER* 📄\n\n";
            session.cart.forEach((item, index) => {
                const subtotal = item.product.price * item.qty;
                total += subtotal;
                summary += `${index + 1}. ${item.product.name} x${item.qty} = Rp ${subtotal.toLocaleString()}\n`;
            });
            summary += `\n*TOTAL: Rp ${total.toLocaleString()}*\n\nSilakan kirim *Alamat Pengiriman* lengkap Anda:`;
            
            session.stage = 'ASKING_ADDRESS';
            await session.save();
            return summary;
        } else {
            return "⚠️ Tekan *1* untuk lanjut belanja, atau *2* untuk checkout.";
        }
    }

    if (session.stage === 'ASKING_ADDRESS') {
        const address = text;
        let total = 0;
        const orderItems = session.cart.map(item => {
            total += item.product.price * item.qty;
            return {
                name: item.product.name,
                price: item.product.price,
                qty: item.qty
            };
        });

        // Save Order
        const newOrder = await Order.create({
            customer: from,
            items: orderItems,
            total: total,
            address: address,
            status: 'PENDING'
        });

        // Trigger dashboard live update
        try {
            const { notifyNewOrder } = require('./socket');
            notifyNewOrder(newOrder);
        } catch (e) {
            console.error("Socket notification error:", e);
        }

        // Reset session
        session.stage = 'START';
        session.cart = [];
        await session.save();

        return `✅ *PESANAN BERHASIL!* ✅\n\nID Order: #${newOrder._id.toString().slice(-6)}\nTotal: *Rp ${total.toLocaleString()}*\nAlamat: ${address}\n\n${botFooter}`;
    }

    return "Ketik 'menu' untuk mulai berbelanja.";
};

module.exports = { handleIncomingMessage };
