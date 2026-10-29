# Inside Fear — Devpost submission text (v2, pasted into Devpost 2026-10-29)

**Tagline:** Someone snaps "How could you?!" and you freeze. Step inside your own amygdala and watch your fear switch on, spread through your body, and calm down.

## Inspiration
Everyone knows the moment: a parent or a teacher raises their voice, your heart pounds and your mind goes blank before you have even understood the words. Biology textbooks explain this with a flat diagram of the amygdala. The learner behind this Lens wanted to "walk into the body" and watch that moment from the inside, at the scale of the cells that make it happen, with someone explaining each step.

## Who it is for
Secondary-school students meeting the fear pathway in biology or psychology, and anyone who freezes when they are scolded and wants to know what their brain is doing. Knowing that fear takes a fast shortcut first and gets checked by a slower road afterwards is a useful thing to know about yourself.

## What it does
A translucent brain about a metre wide floats in your room. Pinch **Start**: a voice snaps "How could you?!" and the amygdala, the brain's fear centre, lights up red. Pinch **Enter** and the lit amygdala grows until it surrounds you; you are now standing inside it, among neurons hanging in the tissue all around you, in front, behind, left and right.

Neuri, the child who was just scolded, tells the story in the first person from a floating card, one step at a time (pinch **Next**):

1. **Sound arrives**: the scolding travels from the ears to the thalamus, the brain's relay station.
2. **The fast shortcut**: a direct path carries the sound into the amygdala before the words are even understood.
3. **Neurons fire**: at a synapse right next to you, glutamate crosses the gap from a see-through axon terminal full of vesicles to the receptors on the next neuron. Sizes are not to scale, but their order is: neuron body > axon terminal > vesicle > glutamate.
4. **Alarm goes out**: this step happens behind you; an arrow and the sound itself make you turn round. The hypothalamus and brainstem raise the heart rate and breathing and make you freeze.
5. **The slow road checks**: the prefrontal cortex works out that it was only words and sends calming waves to the amygdala.
6. **Fear fades**: the neurons settle; stress hormones take a while longer, so you still feel a little shaky.

Pinch **Exit** and the amygdala shrinks back into the brain; you are outside again with Start available.

## Why glasses
On a screen you look at a picture of a brain. Here the region comes to you: it grows around you, and you turn your head to follow the fear response as it moves through the tissue, hands free except for one pinch. Everything sits at room scale in centimetres and inside the Specs field of view from where you stand.

## How it was built
- Planned with the Devpost *Learn AR with Specs* skill pack (`plan-lens` interview → `devpost/design-brief.md`, approved by the learner before any code).
- Built by Claude Code with the CLAD plugin driving Lens Studio 5.24.1 through the Lens Studio MCP; Spectacles Interaction Kit + UI Kit for every button and card.
- One TypeScript state machine (`InsideFearMain.ts`) owns the flow: outside → triggered → entering → inside → exiting. Separate modules build the interior, the Next/Exit panel, the step text and Neuri's card.
- The cell-scale scene is generated at runtime with `MeshBuilder`: each neuron is one mesh of smooth tapering tubes (soma, dendrites radiating in every direction, axon to a myelinated cable), with no outlines, so lighting carries the 3D shape. Far cells fade into the background colour for depth. Astrocytes and oligodendrocytes are shown schematically. The visual style follows widely watched 3D neuroscience animations.
- Tested with LEAF: one scenario per done criterion in the brief, run in the Lens Studio preview; all five pass (see `devpost/leaf-results.md`).
- All voices are synthetic text-to-speech (Microsoft neural voices via edge-tts). No recordings of any person, no voice cloning, no music.

## Challenges
- The display is additive, so the scene stays light and translucent and all text is light with an outline.
- A 1 m brain at 1.2 m overflows the Specs horizontal field of view; it now sits at about 1.4 m.
- Showing size: the real gap between a neuron and a glutamate molecule is too large to show, so the scene keeps the order of sizes and puts the synapse beside its neuron for comparison.
- Step 4 happens behind the user by design, so a cue arrow plus spatial sound point there. The Next/Exit panel follows the gaze lazily and stays below it, so it never covers what is being explained.

## What's next
Other emotions and their circuits, a teacher mode for writing your own narration, anatomical brain and amygdala meshes, and testing on real Specs for comfort and hand reach.

## Built with
Lens Studio 5.24.1 · Spectacles Interaction Kit 2.0 · Spectacles UI Kit 2.0 · LEAF 2.0.2 · Claude Code + CLAD (ls-clad) · Lens Studio MCP · TypeScript

## Links (form fields)
- Video: https://youtu.be/BTCfWfzXbUc (take 8, Public since 2026-10-29; the 2026-10-23 cut bTYO3JB-hD0 is now Unlisted)
- Code: https://github.com/yvoolab/inside-fear-specs
- Devpost project (submitted 2026-10-23, editable until 2026-11-09): https://devpost.com/software/inside-fear

---

## Video v8 — first 30 seconds (plan, not part of the form)
1. 0–6 s · title card over a dark frame: *"Someone snaps at you. Your heart races before you understand a word. Why?"*
2. 6–12 s · second card: *"Inside Fear — a Specs Lens for students. Step inside your own amygdala."*
3. 12–30 s · Lens: the brain floats in a real room (Sunlit Room preview); Start → "How could you?!" → amygdala lights up → Enter → the amygdala grows around the viewer.
Then the six steps, with the camera moving slowly sideways for parallax and pushing in on the synapse at step 3.
