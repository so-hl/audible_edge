document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded successfully');

    let socket = null;
    let previousPrice = null;
    let currentSymbol = null;
    let lastUpdateTime = 0;  // Track last UI update time
    let fetchInterval = 5000; // Default 5 seconds

    // UI Elements
    const tradingPairInput = document.getElementById('tradingPair');
    const latestTradeDiv = document.getElementById('latestTrade');
    const confirmationDiv = document.getElementById('confirmationDiv');
    const priceChangeElement = document.getElementById('priceChange');
    const connectBtn = document.getElementById('connectBtn');

    // Threshold Elements
    const thresholdSlider = document.getElementById('thresholdSlider');
    const thresholdValue = document.getElementById('thresholdValue');
    let threshold = parseFloat(thresholdSlider.value);

    // Fetch Interval Elements
    const intervalSlider = document.getElementById('intervalSlider');
    const intervalValue = document.getElementById('intervalValue');

    // Update fetch interval dynamically when the slider moves
    intervalSlider.addEventListener('input', function () {
        fetchInterval = parseInt(this.value) * 1000; // Convert seconds to milliseconds
        intervalValue.innerText = this.value;
        console.log(`Fetch interval updated: ${fetchInterval}ms`);
    });

    // Update threshold when slider changes
    thresholdSlider.addEventListener('input', function () {
        threshold = parseFloat(this.value);
        thresholdValue.innerText = this.value;
    });

    function connectWebSocket(symbol) {
        if (socket && currentSymbol === symbol) {
            console.log(`Already connected to ${symbol}, skipping reconnection.`);
            return;  // Prevent unnecessary reconnections
        }

        if (socket) {
            console.log(`Closing old connection to ${currentSymbol}`);
            socket.close(); // Close previous WebSocket connection
        }

        currentSymbol = symbol;
        previousPrice = null;
        lastUpdateTime = 0;

        console.log(`Connecting to WebSocket for ${symbol}`);
        socket = new WebSocket(`ws://127.0.0.1:8000/ws/${symbol.toLowerCase()}`);

        socket.onopen = () => {
            console.log(`✅ Connected to ${symbol.toUpperCase()}`);
            confirmationDiv.textContent = `✅ Connected to ${symbol.toUpperCase()}`;
        };

        socket.onmessage = (event) => {
            try {
                let data = JSON.parse(event.data);

                // Ensure we update UI only for the currently connected symbol
                if (data.symbol.toLowerCase() !== currentSymbol.toLowerCase()) return;

                let price = parseFloat(data.price);
                let time = new Date(data.time * 1000).toLocaleTimeString();

                let priceChange = 0;
                let priceChangePercentage = 0;

                if (previousPrice !== null) {
                    priceChange = price - previousPrice;
                    priceChangePercentage = ((priceChange / previousPrice) * 100).toFixed(3);
                }

                previousPrice = price;

                // Throttle updates based on the dynamic fetch interval
                const now = Date.now();
                if (now - lastUpdateTime >= fetchInterval) {
                    lastUpdateTime = now;  // Update last update time

                    latestTradeDiv.innerText = `Latest Trade: ${price} USD at ${time}`;
                    priceChangeElement.innerText = `Price Change: ${priceChangePercentage}%`;

                    // Play sound only if price change exceeds the threshold
                    if (Math.abs(priceChangePercentage) > threshold) {
                        playAlert();
                    }
                }

            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        };

        socket.onclose = () => {
            console.log(`❌ Disconnected from ${symbol.toUpperCase()}`);
            confirmationDiv.textContent = `❌ Disconnected from ${symbol.toUpperCase()}`;
        };

        socket.onerror = (error) => {
            console.error("WebSocket error: ", error);
            confirmationDiv.textContent = `⚠️ Error connecting to ${symbol.toUpperCase()}`;
        };
    }

    function playAlert() {
        const audio = new Audio('static/beep.wav');  // Ensure correct path
        audio.volume = 0.5;  // Adjust volume if needed
        audio.play().catch(error => console.log("Audio play error:", error));
    }

    connectBtn.addEventListener('click', () => {
        const symbol = tradingPairInput.value.trim().toLowerCase() || 'btcusdt';
        if (!symbol) {
            confirmationDiv.textContent = 'Please enter a trading pair!';
            return;
        }
        confirmationDiv.textContent = `Connecting to ${symbol.toUpperCase()}...`;
        connectWebSocket(symbol);
    });
});
