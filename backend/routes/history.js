const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [rows] = await db.query(
            'SELECT id, ip_address, location, device, login_time, risk_score, is_suspicious FROM Login_History WHERE user_id = ? ORDER BY login_time DESC LIMIT 50',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/risk-analysis', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [rows] = await db.query(
            'SELECT risk_score, is_suspicious, location, device FROM Login_History WHERE user_id = ? ORDER BY login_time DESC',
            [userId]
        );
        
        let avgRisk = 0;
        let suspiciousCount = 0;
        let connectedDevicesCount = 0;
        let lastLocation = 'Unknown';
        let uniqueDevices = [];
        
        if (rows.length > 0) {
            // First row is the most recent login
            lastLocation = rows[0].location;
            
            const recent10 = rows.slice(0, 10);
            const sum = recent10.reduce((acc, curr) => acc + curr.risk_score, 0);
            avgRisk = (sum / recent10.length).toFixed(2);
            suspiciousCount = recent10.filter(r => r.is_suspicious).length;
            
            // Calculate unique devices over all time
            const devicesSet = new Set(rows.map(r => r.device).filter(d => d && d !== 'Unknown'));
            uniqueDevices = Array.from(devicesSet);
            connectedDevicesCount = devicesSet.size || 1; // At least 1 if they are logged in
        }

        res.json({
            averageRisk: avgRisk,
            suspiciousCount,
            recentLogins: Math.min(rows.length, 10),
            connectedDevicesCount,
            lastLocation,
            uniqueDevices
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
