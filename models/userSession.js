const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    stage: { type: String, default: 'START' }, // e.g., START, SELECT_PRODUCT, ADD_MORE, ASKING_ADDRESS
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        qty: { type: Number, default: 1 }
    }],
    tempMenuMap: [String] // Stores product IDs in the order shown to user
});

module.exports = mongoose.model('UserSession', userSessionSchema);
