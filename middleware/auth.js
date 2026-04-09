const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        if (req.headers['accept']?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Tidak diizinkan, silakan login' });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        req.admin = decoded;
        next();
    } catch (e) {
        res.clearCookie('token');
        if (req.headers['accept']?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Sesi berakhir, silakan login ulang' });
        }
        return res.redirect('/login');
    }
};

module.exports = { protect };
