require('dotenv').config();
const speech = require('@google-cloud/speech');
const record = require('node-record-lpcm16').record;
const { PassThrough } = require('stream');
const readline = require('readline');

const client = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Function to process recognized speech
function processCommand(command) {
  console.log(`🎙️ Recognized Command: "${command}"`);

  // More flexible command recognition
  const buyMatch = command.match(/(buy|purchase) (\d+) (btc|bitcoin)/i);
  const stopLossMatch = command.match(/(set|place) stop loss at (\d+)/i);

  if (buyMatch) {
    const quantity = parseInt(buyMatch[2], 10);
    console.log(`✅ Executing Buy Order: ${quantity} BTC`);
  } else if (stopLossMatch) {
    const price = parseInt(stopLossMatch[2], 10);
    console.log(`✅ Setting Stop Loss at ${price} USDT`);
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
  console.log('🎤 Listening... Say a command like "Buy 10 BTC" or "Set stop loss at 60000"');

  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    },
    interimResults: false,
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
