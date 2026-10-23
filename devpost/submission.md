# Inside Fear — Devpost submission text (draft)

**Tagline:** Step inside the brain's fear centre and watch the textbook come alive around you, with a museum-style narrator.

## Inspiration
Biology students read about the amygdala on a flat page. The learner behind this Lens wanted to "walk into the body" and see what no diagram can show: the region lighting up, the signal firing, the alarm reaching other organs. Specs can put a one-metre brain in your room and then let that region grow around you.

## What it does
A translucent brain floats about 1.2 m in front of you. Pinch **Start**: a reproachful voice is heard, and the amygdala, the brain's fear region, lights up warm orange. Pinch **Enter** and the lit amygdala grows until it surrounds you; the outside brain fades and you are standing in a cell-scale scene of neurons, synapses and travelling signal pulses, in front, behind, left and right. Pinch **Next** to follow the textbook fear pathway step by step, each with a short text card next to the event and a spoken narration line emitted from where it happens:

1. Stimulus: the voice arrives as a signal from the auditory pathway into the amygdala.
2. Neurons fire: amygdala neurons activate; glutamate is released across synapses.
3. Alarm goes out: a signal reaches the hypothalamus; adrenaline and cortisol are released; heart and breathing speed up. This step happens behind you: a small arrow and the sound itself point you there, and a pulsing "heart & lungs" marker shows the alarm reaching other organs.
4. Fear fades: the threat passes, the neurons calm and the amygdala returns to its normal colour.

Pinch **退 / Exit** and the interior shrinks back into the brain; you are outside again with Start available.

## Why glasses
On a screen you look at a brain. Here the lit region comes to you and surrounds you, and you turn your head to see the mechanism happening around you, hands free except for one pinch. Everything sits at real-world scale in centimetres and inside the Specs field of view from where you stand.

## How it was built
- Planned with the Devpost *Learn AR with Specs* skill pack (`plan-lens` interview → `devpost/design-brief.md`, approved by the learner before any code).
- Built by Claude Code with the CLAD plugin driving Lens Studio 5.24.1 through the Lens Studio MCP (scene built with VirtualScene, materials and meshes as native presets, Spectacles Interaction Kit + UI Kit for every button and card).
- One TypeScript state machine (`InsideFearMain.ts`) owns the flow: outside → triggered → entering → inside → exiting. Separate modules build the interior (neurons, synapses, pulses, cue arrow, organ marker) and the UI (big buttons, head-following Next/Exit panel, step card).
- Tested with LEAF: one scenario per done criterion in the brief, run in the Lens Studio preview; all five pass (see `devpost/leaf-results.md`).
- Audio is fully synthetic: the step narration is offline neural text-to-speech (Piper, voice `en_US-ryan-high`), the blame voice and clicks are generated tones. No recordings of any person, no voice cloning, no music.

## Challenges
- The display is additive, so the brain and amygdala had to stay light and translucent, and all text light on translucent panels.
- A 1 m brain at 1.2 m overflows the Specs horizontal field of view; it now sits at about 1.4 m.
- Step 3 happens behind the user by design, so a cue arrow plus spatial sound were needed to point there.

## What's next
On-device TTS so the narration can follow a teacher's own script, proper anatomical brain and amygdala meshes, richer glutamate/synapse visuals, and the other emotions and their regions.

## Built with
Lens Studio 5.24.1 · Spectacles Interaction Kit 2.0 · Spectacles UI Kit 2.0 · LEAF 2.0.2 · Claude Code + CLAD (ls-clad) · Lens Studio MCP · TypeScript

## Links (form fields)
- Video: https://youtu.be/bTYO3JB-hD0 (Public since 2026-10-23)
- Code: https://github.com/yvoolab/inside-fear-specs
- Devpost project (submitted 2026-10-23, editable until 2026-11-09): https://devpost.com/software/inside-fear
