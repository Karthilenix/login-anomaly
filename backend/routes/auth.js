const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { getLocationFromIP, detectAnomalyAndRecord } = require('../services/anomalyService');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.query('INSERT INTO Users (email, password_hash) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // IP Tracking and Device Tracking
        const currentIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        let device = 'Unknown';
        if (req.useragent) {
            device = `${req.useragent.browser} ${req.useragent.version} / ${req.useragent.os}`;
        }

        const location = await getLocationFromIP(currentIp);
        const loginTime = new Date();

        // Anomaly Detection
        const anomalyData = await detectAnomalyAndRecord(user.id, currentIp, location, device, loginTime);

        // JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'super_secret', { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            token,
            riskScore: anomalyData.riskScore,
            isSuspicious: anomalyData.isSuspicious,
            alert: anomalyData.isSuspicious ? 'Suspicious login detected! Please verify your identity.' : null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
