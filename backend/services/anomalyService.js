const axios = require('axios');
const db = require('../db');

// Service to get location from IP loosely
async function getLocationFromIP(ip) {
    try {
        let lookupIp = ip;
        // If testing locally, fake the IP to the actual machine's public IP so geolocation works!
        if (!ip || ip === '127.0.0.1' || ip === '::1') {
            const publicIpRes = await axios.get('https://api.ipify.org?format=json');
            lookupIp = publicIpRes.data.ip;
        }

        const response = await axios.get(`http://ip-api.com/json/${lookupIp}`);
        if (response.data.status === 'success') {
            return `${response.data.regionName}, ${response.data.country}`;
        }
        return 'Unknown Location';
    } catch (error) {
        console.error('IP API Error:', error.message);
        return 'Unknown Location';
    }
}

// Compute the risk score and persist in DB
async function detectAnomalyAndRecord(userId, currentIp, location, device, loginTime) {
    let riskScore = 0;
    
    // 1. Fetch previous logins
    const [rows] = await db.query(
        'SELECT ip_address, location, device, login_time FROM Login_History WHERE user_id = ? ORDER BY login_time DESC LIMIT 10',
        [userId]
    );

    if (rows.length > 0) {
        // Compare with past data
        const ips = rows.map(r => r.ip_address);
        const locations = rows.map(r => r.location);
        const devices = rows.map(r => r.device);

        if (!ips.includes(currentIp)) {
            riskScore += 30; // New IP -> +30
        }
        if (!locations.includes(location) && location !== 'Unknown/Localhost') {
            riskScore += 30; // New Location -> +30
        }
        if (!devices.includes(device)) {
            riskScore += 20; // New Device -> +20
        }

        // Odd login time logic: Assume normal is 6 AM to 10 PM. 
        // Odd is 10 PM to 6AM based on server time.
        // Actually, requirement says "odd login time". We can simply check the current hour.
        const hour = loginTime.getHours();
        if (hour < 6 || hour >= 23) {
            riskScore += 20;
        }
    } else {
        // First time logging in ever, default low risk
        // You could also say risk=0 or something here.
    }

    const isSuspicious = riskScore >= 50;

    // Record this login to DB
    await db.query(
        'INSERT INTO Login_History (user_id, ip_address, location, device, risk_score, is_suspicious, login_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, currentIp, location, device, riskScore, isSuspicious, loginTime]
    );

    return { riskScore, isSuspicious };
}

module.exports = {
    getLocationFromIP,
    detectAnomalyAndRecord
};
