#!/bin/sh
# Regenerates Assets/GeneratedSFX/Step1-4.wav with Piper (offline neural TTS, synthetic voice, no cloning).
#   pip install piper-tts && python3 -m piper.download_voices en_US-ryan-high
# Lines are the step titles + bodies from InsideFearMain.ts DEFAULT_STEPS.
set -e; cd "$(dirname "$0")/.."
MODEL=${PIPER_MODEL:-en_US-ryan-high.onnx}
i=0
while IFS= read -r line; do i=$((i+1))
  printf '%s\n' "$line" | piper -m "$MODEL" --sentence-silence 0.3 -f /tmp/step$i.wav
  ffmpeg -loglevel error -y -i /tmp/step$i.wav -ar 44100 -ac 1 Assets/GeneratedSFX/Step$i.wav
done <<'LINES'
Stimulus. The voice of blame arrives as a signal from the auditory pathway into the amygdala.
Neurons fire. Amygdala neurons activate; glutamate is released across the synapses.
Alarm goes out. A signal reaches the hypothalamus; adrenaline and cortisol are released, heart and breathing speed up.
Fear fades. The threat passes. Neurons calm down and the amygdala returns to normal.
LINES
