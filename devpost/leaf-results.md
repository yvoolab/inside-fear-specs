# LEAF test results — Inside Fear

Run in Lens Studio 5.24.1 preview (LEAF 2.0.2), 2026-10-23. Scenarios live in `Assets/LeafTests/`,
one per done criterion in `design-brief.md`, registered in `LeafIndex.ts`.

| Done criterion | Scenario id | Result |
| --- | --- | --- |
| 1. Pinch Start: blame voice plays, amygdala lights up, Enter appears next to it | `criterion-1-start` | PASSED |
| 2. Pinch Enter without moving: amygdala envelops the user, interior with neurons and synapses in front, behind, left and right | `criterion-2-enter` | PASSED |
| 3. Pinch Next: animated event + text label + narration cue per step, previous label gone (step 3 behind the user with cue arrow + "other organs" pulse) | `criterion-3-next` | PASSED |
| 4. Final step: neurons calm, narration says the fear fades, amygdala back to normal color | `criterion-4-fade` | PASSED |
| 5. Pinch 退 / Exit: back outside, brain normal, Start available again | `criterion-5-exit` | PASSED |

All five criteria have a test. What the tests cannot tell (feel unproven on real glasses): comfort of the
1.5 s envelope transition, real hand-tracking reach, spatial-audio localisation.

Narration audio is synthetic offline text-to-speech (Piper `en_US-ryan-high`); the blame voice and cues are generated tones. No human recordings, no voice cloning, no music. All five scenarios were re-run after the narration swap (2026-10-23) and PASSED.

To re-run: open the LEAF panel in Lens Studio and run each scenario, or ask the agent to run them.
