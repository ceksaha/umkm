const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    isJidBroadcast
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { handleIncomingMessage } = require('./botEngine');
const qrcodeTerminal = require('qrcode-terminal');
const { notifyNewOrder } = require('./socket');
const Setting = require('../models/setting');

const logger = pino({ level: 'silent' });

let sock;

async function startWhatsApp() {
    console.log("Initializing WhatsApp connection...");
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Fetch latest version or use fallback
    let version = [2, 3000, 1015901307];
    try {
        const fetched = await fetchLatestBaileysVersion();
        version = fetched.version;
        console.log(`Using WhatsApp version: ${version.join('.')}`);
    } catch (e) {
        console.log("Could not fetch latest version, using fallback.");
    }

    // Get pairing number from ENV or Database
    let pairingNumber = process.env.PAIRING_NUMBER;
    if (!pairingNumber) {
        try {
            const botSetting = await Setting.findOne({ key: 'bot_number' });
            if (botSetting && botSetting.value) {
                pairingNumber = botSetting.value;
                console.log(`Using Bot Number from Database: ${pairingNumber}`);
            }
        } catch (e) {
            console.error("Error fetching bot_number from DB:", e.message);
        }
    }

    sock = makeWASocket({
        version,
        logger,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Required for Pairing Code
        syncFullHistory: false,
        printQRInTerminal: false,
        generateHighQualityQR: true,
        shouldIgnoreJid: jid => isJidBroadcast(jid)
    });

    // Handle Pairing Code
    if (pairingNumber && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(pairingNumber.replace(/\D/g, ''));
                console.log("\n========================================");
                console.log("🔗 WHATSAPP PAIRING CODE:");
                console.log(`👉 ${code} 👈`);
                console.log(`Masukkan kode ini di HP Anda (Settings > Linked Devices > Link with phone number)`);
                console.log("========================================\n");
            } catch (err) {
                console.error("❌ Gagal menjana Pairing Code:", err.message);
            }
        }, 5000); // Wait a bit for initialization
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && !pairingNumber) {
            console.log("\n👉 SCAN QR CODE BELOW TO CONNECT:");
            qrcodeTerminal.generate(qr, { small: true });
            console.log("Tips: Pastikan layar terminal Anda cukup lebar.\n");
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                startWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Connected Successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Listen for incoming messages
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const from = msg.key.remoteJid;
            
            // Extract text from various message types including deeply nested ones
            const extractText = (message) => {
                if (!message) return "";
                
                // Direct text
                if (typeof message === 'string') return message;
                if (message.conversation) return message.conversation;
                if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
                
                // Nested messages (View Once, Ephemeral, etc.)
                const nested = message.ephemeralMessage?.message || 
                               message.viewOnceMessageV2?.message || 
                               message.viewOnceMessage?.message || 
                               message.documentWithCaptionMessage?.message ||
                               message.imageMessage ||
                               message.videoMessage;
                
                if (nested) {
                    if (nested.caption) return nested.caption;
                    return extractText(nested);
                }
                
                // Interactive messages
                if (message.buttonsResponseMessage?.selectedButtonId) return message.buttonsResponseMessage.selectedButtonId;
                if (message.listResponseMessage?.singleSelectReply?.selectedRowId) return message.listResponseMessage.singleSelectReply.selectedRowId;
                if (message.templateButtonReplyMessage?.selectedId) return message.templateButtonReplyMessage.selectedId;
                if (message.interactiveResponseMessage?.body?.text) return message.interactiveResponseMessage.body.text; // For newer interactive messages
                
                return "";
            };
            
            const text = extractText(msg.message);
            
            console.log(`📩 Pesan Masuk dari ${from}: "${text}"`);

            if (text) {
                try {
                    const reply = await handleIncomingMessage(from, text);
                    if (reply) {
                        console.log(`📤 Mengirim balasan ke ${from}: "${reply.slice(0, 50)}..."`);
                        await sock.sendMessage(from, { text: reply });
                    } else {
                        console.log(`ℹ️ Tidak ada balasan untuk pesan "${text}"`);
                    }
                } catch (error) {
                    console.error("❌ Error saat memproses pesan:", error);
                }
            } else {
                console.log(`ℹ️ Pesan bukan teks/tidak dikenali dari ${from}. Raw: ${JSON.stringify(msg.message)}`);
            }
        }
    });

    return sock;
}

const sendWhatsAppMessage = async (from, text) => {
    if (!sock) {
        console.error("WhatsApp socket not initialized");
        return;
    }
    try {
        await sock.sendMessage(from, { text });
    } catch (e) {
        console.error("Error sending WhatsApp message:", e);
    }
};

module.exports = { startWhatsApp, sendWhatsAppMessage };
