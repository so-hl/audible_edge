require('dotenv').config();
const speech = require('@google-cloud/speech');
const record = require('node-record-lpcm16').record;
const { PassThrough } = require('stream');
const readline = require('readline');
const axios = require('axios');

const client = new speech.SpeechClient();

// Convert number words to digits
const numberWords = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
};

function parseQuantity(word) {
    return numberWords[word.toLowerCase()] || parseFloat(word);
}

// Function to send trade requests to the backend
async function sendTradeRequest(action, amount, baseCurrency, quoteCurrency) {
    console.log(`📤 Sending trade request: ${action.toUpperCase()} ${amount} ${baseCurrency}/${quoteCurrency}`);

    try {
        const response = await axios.post('http://localhost:3000/trade', {
            action: action.toUpperCase(),
            amount: parseFloat(amount),
            baseCurrency: baseCurrency.toUpperCase(),
            quoteCurrency: quoteCurrency.toUpperCase()
        });

        console.log("📡 Response received:", response.data);
        console.log(`✅ Trade Confirmed: ${action.toUpperCase()} ${amount} ${baseCurrency}/${quoteCurrency}`);
    } catch (error) {
        console.error('❌ Trade Execution Error:', error.response?.data || error.message);
    }
}

// Function to process recognized speech
function processCommand(command) {
    console.log(`🎙️ Recognized Command: "${command}"`);

    // Match trading commands with base and quote currencies
    const tradeMatch = command.match(/(buy|sell) ([\d.]+) ([A-Za-z]+) (using|for) ([A-Za-z]+)/i);

    if (tradeMatch) {
        const action = tradeMatch[1];
        const quantity = parseQuantity(tradeMatch[2]);
        const baseCurrency = tradeMatch[3].toUpperCase();
        const quoteCurrency = tradeMatch[5].toUpperCase();
        
        if (!isNaN(quantity) && quantity > 0) {
            console.log(`✅ Executing Trade: ${action.toUpperCase()} ${quantity} ${baseCurrency}/${quoteCurrency}`);
            sendTradeRequest(action, quantity, baseCurrency, quoteCurrency);
        } else {
            console.log("⚠️ Invalid quantity detected.");
        }
    } else if (/stop recording/i.test(command)) {
        console.log("🛑 Stopping recording...");
        record.stop();
        process.exit(0);
    } else {
        console.log("⚠️ Unknown command. Try again.");
    }
}

// Function to stream speech to Google API
function streamSpeechToText() {
    console.log('🎤 Listening... Say a command like "Buy 0.5 BTC using ETH"');

    const request = {
        config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
            interimResults: true // Allows real-time feedback
        },
    };

    const recognizeStream = client
        .streamingRecognize(request)
        .on('data', (data) => {
            const transcript = data.results[0]?.alternatives[0]?.transcript;
            if (transcript) {
                processCommand(transcript);
            }
        })
        .on('error', (error) => {
            console.error("🚨 Speech recognition error:", error);
            console.log("🔄 Retrying in 3 seconds...");
            setTimeout(streamSpeechToText, 3000); // Retry after 3 seconds
        });

    const audioStream = new PassThrough();

    record({
        sampleRate: 16000,
        threshold: 0,
        verbose: true,
        recordProgram: 'sox',
    }).stream().pipe(audioStream);

    audioStream.pipe(recognizeStream);
}

// Stop recording with 'q' or 'ESC'
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key.name === 'q' || key.name === 'escape') {
        console.log("🛑 Stopping recording...");
        record.stop();
        process.exit();
    }
});

// Start voice recognition
streamSpeechToText();
