const priceWs = new WebSocket("ws://127.0.0.1:8000/ws/ethusdt");
const voiceTraderAPI = "http://127.0.0.1:5001/trade";  // Voice trader API endpoint

// Price WebSocket Event Listener
priceWs.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const price = parseFloat(data.p);
    console.log(`Price: ${price}`);

    if (price > lastPrice * 1.02) {
        playTone(880);  // High pitch for increase
    } else if (price < lastPrice * 0.98) {
        playTone(440);  // Low pitch for decrease
    }

    lastPrice = price;
};

// Voice Trading (Send Trade via Voice Command)
function sendTrade(order) {
    fetch(voiceTraderAPI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: order })
    }).then(response => response.json())
      .then(data => console.log("Trade Executed:", data))
      .catch(err => console.error("Error:", err));
}
