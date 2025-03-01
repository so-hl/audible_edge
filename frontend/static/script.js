document.addEventListener("DOMContentLoaded", () => {
    const socket = io.connect("http://127.0.0.1:5000");

    const tradingPairInput = document.getElementById("tradingPair");
    const thresholdInput = document.getElementById("threshold");
    const timeWindowInput = document.getElementById("timeWindow");
    const connectBtn = document.getElementById("connectBtn");
    const updateBtn = document.getElementById("updateBtn");
    const latestTradeDiv = document.getElementById("latestTrade");

    // Handle WebSocket Events from Flask-SocketIO
    socket.on("price_alert", (data) => {
        latestTradeDiv.innerHTML = `🚨 Price Change Alert: ${data.price_change.toFixed(2)}%`;
        latestTradeDiv.style.color = data.price_change > 0 ? "green" : "red";
    });

    // Connect to WebSocket
    connectBtn.addEventListener("click", () => {
        const symbol = tradingPairInput.value.toLowerCase();
        if (!symbol) {
            alert("Please enter a trading pair (e.g., BTCUSDT)");
            return;
        }
        fetch("/update_settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol })
        }).then((response) => response.json())
          .then((data) => {
              console.log("Updated Symbol:", data.symbol);
              alert(`Switched to tracking ${data.symbol.toUpperCase()}`);
          })
          .catch((error) => console.error("Error updating symbol:", error));
    });

    // Update Settings
    updateBtn.addEventListener("click", () => {
        const threshold = parseFloat(thresholdInput.value);
        const timeWindow = parseInt(timeWindowInput.value, 10);

        if (isNaN(threshold) || isNaN(timeWindow)) {
            alert("Please enter valid threshold and time window values.");
            return;
        }

        fetch("/update_settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ threshold, time_window: timeWindow })
        }).then((response) => response.json())
          .then((data) => {
              console.log("Updated Settings:", data);
              alert(`Updated Threshold: ${data.threshold}%, Time Window: ${data.time_window}s`);
          })
          .catch((error) => console.error("Error updating settings:", error));
    });
});