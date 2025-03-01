document.addEventListener('DOMContentLoaded', () => {
  // Synth setup
  const synth = new Tone.PolySynth(Tone.Synth).toDestination();

  // DOM elements
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

  // Initialize values
  let baseFrequency = parseFloat(frequencySlider.value);
  let amplitude = parseFloat(amplitudeSlider.value);
  let harmonics = parseInt(harmonicsSlider.value);
  freqValue.textContent = baseFrequency.toFixed(2);
  ampValue.textContent = amplitude.toFixed(1);
  harmValue.textContent = harmonics;

  // Custom sound function using Fourier-inspired synthesis
  function playCustomNote(note) {
    const now = Tone.now();
    const frequencies = [];
    for (let i = 1; i <= harmonics; i++) {
      frequencies.push(Tone.Frequency(note).transpose(i * 12).toFrequency() * (1 / i)); // Harmonic series
    }
    synth.triggerAttackRelease(frequencies, '0.5', now, amplitude);
    console.log(`${note} played with freq ${baseFrequency}, amp ${amplitude}, harmonics ${harmonics} at`, new Date().toLocaleTimeString());
  }

  // Button event listeners
  playC4Btn.addEventListener('click', () => playCustomNote('C4'));
  playE4Btn.addEventListener('click', () => playCustomNote('E4'));
  playG4Btn.addEventListener('click', () => playCustomNote('G4'));

  // Slider event listeners
  frequencySlider.addEventListener('input', (e) => {
    baseFrequency = parseFloat(e.target.value);
    freqValue.textContent = baseFrequency.toFixed(2);
  });
  amplitudeSlider.addEventListener('input', (e) => {
    amplitude = parseFloat(e.target.value);
    ampValue.textContent = amplitude.toFixed(1);
  });
  harmonicsSlider.addEventListener('input', (e) => {
    harmonics = parseInt(e.target.value);
    harmValue.textContent = harmonics;
  });

  statusDiv.textContent = 'ToneTrader is active';

  // WebSocket for Binance market data
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
  let price = 0;

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    price = parseFloat(data.p);
    statusDiv.textContent = `Price: ${price} USD`;
    console.log('Price Update:', price, 'at', new Date(data.T).toLocaleTimeString());
  };

  ws.onerror = (error) => console.error('WebSocket Error:', error);
  ws.onclose = () => console.log('WebSocket Closed');
});