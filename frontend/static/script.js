document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded successfully');
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
  
    let baseFrequency = 261.63;
    let amplitude = 0.5;
    let harmonics = 1;
  
    const playC4Btn = document.getElementById('playC4');
    const playE4Btn = document.getElementById('playE4');
    const playG4Btn = document.getElementById('playG4');
    const frequencySlider = document.getElementById('frequency');
    const amplitudeSlider = document.getElementById('amplitude');
    const harmonicsSlider = document.getElementById('harmonics');
    const freqValue = document.getElementById('freqValue');
    const ampValue = document.getElementById('ampValue');
    const harmValue = document.getElementById('harmValue');
    const statusDiv = document.getElementById('status');
    const connectBtn = document.getElementById('connectBtn');
    const tradingPairInput = document.getElementById('tradingPair');
    const latestTradeDiv = document.getElementById('latestTrade');
    let socket;
  
    console.log('DOM elements checked:', { playC4Btn, frequencySlider, connectBtn });
  
    function playCustomNote(note) {
      const now = Tone.now();
      const frequencies = [];
      for (let i = 1; i <= harmonics; i++) {
        frequencies.push(Tone.Frequency(note).toFrequency() * i * (baseFrequency / 261.63));
      }
      synth.triggerAttackRelease(frequencies, '0.5', now, amplitude / Math.sqrt(harmonics));
      console.log(`${note} played with freq ${baseFrequency}, amp ${amplitude}, harmonics ${harmonics} at`, new Date().toLocaleTimeString());
    }
  
    if (playC4Btn) {
      playC4Btn.addEventListener('click', () => playCustomNote('C4'));
      playE4Btn.addEventListener('click', () => playCustomNote('E4'));
      playG4Btn.addEventListener('click', () => playCustomNote('G4'));
    }
  
    if (frequencySlider) {
      frequencySlider.addEventListener('input', (e) => {
        baseFrequency = parseFloat(e.target.value);
        freqValue.textContent = baseFrequency.toFixed(2);
        console.log('Frequency changed to:', baseFrequency);
      });
      amplitudeSlider.addEventListener('input', (e) => {
        amplitude = parseFloat(e.target.value);
        ampValue.textContent = amplitude.toFixed(1);
      });
      harmonicsSlider.addEventListener('input', (e) => {
        harmonics = parseInt(e.target.value);
        harmValue.textContent = harmonics;
        console.log('Harmonics changed to:', harmonics);
      });
    }
  
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        console.log('Connect button clicked');
        const symbol = tradingPairInput.value.toLowerCase() || 'btcusdt';
        if (socket) socket.disconnect();
        socket = io(`http://127.0.0.1:8000`, { path: '/ws' });
        latestTradeDiv.textContent = 'Connecting...';
  
        socket.on('connect', () => {
          console.log('Socket.IO connection opened');
          latestTradeDiv.textContent = 'Connected';
          socket.emit('subscribe', symbol); // Subscribe to the trading pair
        });
  
        socket.on('trade', (data) => {
          const price = parseFloat(data.p);
          const time = new Date(data.T).toLocaleTimeString();
          latestTradeDiv.textContent = `Latest Trade: ${price} USD at ${time}`;
          console.log('Trade Update:', data);
        });
  
        socket.on('error', (error) => {
          console.error('Socket.IO Error:', error);
          latestTradeDiv.textContent = 'Connection failed';
        });
  
        socket.on('disconnect', () => latestTradeDiv.textContent = 'Not connected');
      });
    }
  
    if (statusDiv && !connectBtn) {
      statusDiv.textContent = 'Connecting to market data...';
  
      const socket = io('http://127.0.0.1:8000', { path: '/ws' });
      let price = 0;
  
      socket.on('connect', () => {
        console.log('Socket.IO connection opened');
        statusDiv.textContent = 'Connected - Price: Loading...';
        socket.emit('subscribe', 'ethusdt');
      });
  
      socket.on('trade', (data) => {
        price = parseFloat(data.p);
        statusDiv.textContent = `Price: ${price} USD`;
        console.log('Price Update:', price, 'at', new Date(data.T).toLocaleTimeString());
      });
  
      socket.on('error', (error) => console.error('Socket.IO Error:', error));
      socket.on('disconnect', () => console.log('Socket.IO Closed'));
    }
  });