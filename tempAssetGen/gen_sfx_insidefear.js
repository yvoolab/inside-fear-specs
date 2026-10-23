// One-shot generator: all Inside Fear placeholder audio. Synthetic only (no voices, no music).
const fs = require('fs'), path = require('path'), os = require('os');
// CLAD build-sfx engine (ls-clad plugin); override with CLAD_SFX_TOOLS if installed elsewhere
const ENGINE = process.env.CLAD_SFX_TOOLS || path.join(os.homedir(), '.claude/plugins/cache/ls-extensions/ls-clad/1.0.0/skills/build-sfx/tools');
const audio = require(ENGINE);
const p = audio.sfx_presets;
const PROJECT_ASSETS_SFX = path.join(__dirname, '..', 'Assets', 'GeneratedSFX');
fs.mkdirSync(PROJECT_ASSETS_SFX, { recursive: true });

function write(name, buf) {
  audio.mix_bus.masterChain(buf, { normalize: 'peak' });
  audio.WavBuilder.write(buf, path.join(PROJECT_ASSETS_SFX, name + '.wav'));
}

// BlameVoice: reproachful, voice-LIKE but obviously synthetic — formant-filtered saw growl, descending.
function blame() {
  const SR = audio.SAMPLE_RATE;
  const growl = audio.sweep(190, 120, 0.9, 'sawtooth', 'exponential');
  audio.adsrExp(growl, 0.03, 0.2, 0.6, 0.35, 2);
  audio.humanize.ampWobble(growl, 5.5, 0.25);           // syllable-like pulsing
  const g = audio.mix_bus.applyFx(growl, { vowel: { vowel: 'a', mix: 0.8 }, distort: 4, lpf: 2400, hpf: 100, gain: 0.8 });
  const err = p.uiError({ pitch: -4 });
  const out = new Float32Array(Math.floor(1.1 * SR));
  audio.addInto(out, g, 0, 0.9);
  audio.addInto(out, err, Math.floor(0.15 * SR), 0.45);
  audio.fadeOut(out, 0.02);
  return audio.mix_bus.applyFx(out, { reverb: 'mediumRoom', gain: 0.9 });
}

// Step cues: distinct, short, non-musical-phrase chimes
const step1 = p.uiNotify();                                  // stimulus arrives
const step2 = (() => {                                       // neurons fire: 3 rapid blips
  const SR = audio.SAMPLE_RATE, out = new Float32Array(Math.floor(0.6 * SR));
  for (let i = 0; i < 3; i++) audio.addInto(out, p.uiBlip({ pitch: 2 * i }), Math.floor(i * 0.14 * SR), 0.7);
  return audio.mix_bus.applyFx(out, { reverb: 'smallRoom' });
})();
const step3 = p.riser({ duration: 0.9 });                   // alarm goes out
const step4 = (() => {                                       // fear fades: soft descending power-down + air
  const b = p.powerDown({ pitch: -6 });
  return audio.mix_bus.applyFx(b, { lpf: 1800, reverb: 'largeHall', gain: 0.7 });
})();

write('BlameVoice', blame());
write('Step1', step1);
write('Step2', step2);
write('Step3', step3);
write('Step4', step4);
write('Click', p.uiClick({ character: 'soft' }));
console.log('done');
