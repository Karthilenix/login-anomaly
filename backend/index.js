const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const useragent = require('express-useragent');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(useragent.express());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
