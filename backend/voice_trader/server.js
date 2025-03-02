require('dotenv').config();
console.log("🔑 API Key:", process.env.BINANCE_API_KEY);
console.log("🔒 Secret Key:", process.env.BINANCE_SECRET_KEY ? "Loaded" : "Not Loaded");

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend/backend connection

const API_KEY = process.env.BINANCE_API_KEY;
const SECRET_KEY = process.env.BINANCE_SECRET_KEY;
const BASE_URL = 'https://testnet.binance.vision/api/v3/order'; // Testnet URL

// 🛠 Fix: Ensure Secret Key is Loaded
if (!SECRET_KEY) {
    console.error("❌ ERROR: Secret Key is missing! Check your .env file.");
    process.exit(1); // Stop execution if secret key is missing
}

// ✅ Correct Signature Generation
function signQuery(params) {
    const query = new URLSearchParams(params).toString(); // Proper formatting
    return crypto.createHmac('sha256', SECRET_KEY).update(query).digest('hex');
}

// ✅ Trade API Route
app.post('/trade', async (req, res) => {
    try {
        const { action, amount } = req.body;
        const side = action.toUpperCase();
        const timestamp = Date.now();

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, error: "Invalid trade amount." });
        }

        // Construct parameters in Binance-required format
        const params = {
            symbol: "BTCUSDT",
            side: side,
            type: "MARKET",
            quantity: parseFloat(amount).toFixed(6), // Binance requires exact decimal format
            timestamp: timestamp,
            recvWindow: 5000 // ✅ Ensures Binance allows up to 5s network latency
        };

        // ✅ Generate Signature
        params.signature = signQuery(params);

        console.log("🚀 Binance API Request:", params);

        // ✅ Send trade request to Binance API
        const response = await axios.post(BASE_URL, null, {
            params: params,
            headers: { 
                'X-MBX-APIKEY': API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log(`✅ Trade Executed: ${side} ${amount} BTC`);
        console.log("📝 Binance Response:", response.data);

        res.json({ success: true, trade: response.data, message: `✅ Trade Confirmed: ${side} ${amount} BTC` });

    } catch (error) {
        console.error("❌ Trade Execution Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

// ✅ Start the Server
app.listen(3000, () => console.log('🚀 Backend running on port 3000'));
