document.addEventListener('DOMContentLoaded', () => {
  console.log('Script loaded successfully');
  let audioContext;
  try {
      audioContext = Tone.context;
      if (audioContext.state !== 'running') {
          console.log('AudioContext not running, waiting for user gesture');
      }
  } catch (e) {
      console.error('Tone.js initialization error:', e);
  }

  const synth = new Tone.PolySynth(Tone.Synth).toDestination();

  let baseFrequency = 261.63;
  let amplitude = 0.5;
  let harmonics = 1;

  const priceChangeElement = document.getElementById('priceChange');
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
  const confirmationDiv = document.getElementById('confirmationDiv');
  let tradeExecution = document.getElementById('tradeExecution');

  console.log('DOM elements checked:', { playC4Btn, frequencySlider, connectBtn, tradingPairInput, confirmationDiv, tradeExecution });

  if (!tradingPairInput || !connectBtn || !latestTradeDiv || !confirmationDiv || !tradeExecution) {
      console.error('One or more DOM elements not found! Check index.html IDs.');
      return;
  }

  document.body.addEventListener('click', () => {
      if (audioContext && audioContext.state !== 'running') {
          audioContext.resume().then(() => {
              console.log('AudioContext resumed');
          });
      }
  }, { once: true });

  function playCustomNote(note) {
      if (audioContext.state !== 'running') {
          console.warn('AudioContext not running, skipping note');
          return;
      }
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
          const symbol = tradingPairInput.value.toLowerCase() || 'ethbtc';
          if (!symbol) {
              confirmationDiv.textContent = 'Please enter a trading pair!';
              playCustomNote('C3');
              return;
          }
          confirmationDiv.textContent = `Connecting to ${symbol.toUpperCase()}...`;
          playCustomNote('C4');
          setTimeout(() => confirmationDiv.textContent = '', 2000);
          // Additional logic can be added here if needed, but polling is handled in index.html
      });
  }

  if (statusDiv && !connectBtn) {
      statusDiv.textContent = 'Connecting to market data...';
      // Placeholder for status updates if needed
  }
});