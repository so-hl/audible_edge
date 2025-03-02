require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const API_KEY = process.env.BINANCE_API_KEY;
const SECRET_KEY = process.env.BINANCE_SECRET_KEY;
const BASE_URL = 'https://testnet.binance.vision/api/v3/order';
const EXCHANGE_INFO_URL = 'https://api.binance.com/api/v3/exchangeInfo';

if (!SECRET_KEY) {
    console.error("❌ ERROR: Secret Key is missing! Check your .env file.");
    process.exit(1);
}

// Fetch Binance available trading pairs
let validTradingPairs = new Set();
async function fetchTradingPairs() {
    try {
        const response = await axios.get(EXCHANGE_INFO_URL);
        validTradingPairs = new Set(response.data.symbols.map(s => s.symbol));
        console.log("✅ Trading pairs loaded from Binance.");
    } catch (error) {
        console.error("⚠️ Failed to fetch Binance trading pairs:", error.message);
    }
}
fetchTradingPairs();

// Function to get the correct trading pair format
function getValidSymbol(base, quote) {
    const direct = `${base}${quote}`.toUpperCase();
    const inverse = `${quote}${base}`.toUpperCase();
    if (validTradingPairs.has(direct)) return direct;
    if (validTradingPairs.has(inverse)) return inverse;
    return null;
}

// Function to sign API requests
function signQuery(params) {
    const query = new URLSearchParams(params).toString();
    return crypto.createHmac('sha256', SECRET_KEY).update(query).digest('hex');
}

// Trade execution route
app.post('/trade', async (req, res) => {
    const { action, amount, baseCurrency, quoteCurrency } = req.body;
    if (!action || !amount || !baseCurrency || !quoteCurrency) {
        return res.status(400).json({ error: "Missing trade details." });
    }

    const symbol = getValidSymbol(baseCurrency, quoteCurrency);
    if (!symbol) {
        return res.status(400).json({ error: `Invalid trading pair: ${baseCurrency}/${quoteCurrency}` });
    }

    const side = action.toUpperCase();
    const params = {
        symbol,
        side,
        type: "MARKET",
        quantity: amount,
        timestamp: Date.now()
    };
    params.signature = signQuery(params);

    try {
        const response = await axios.post(BASE_URL, null, {
            headers: { 'X-MBX-APIKEY': API_KEY },
            params
        });
        res.json({ success: true, trade: response.data });
    } catch (error) {
        console.error("❌ Trade Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || "Trade execution failed." });
    }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));