---
status: approved
---

# Design brief: Inside Fear (default name)

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
A brain about a meter wide floats in front of me in my room. A voice of blame is heard; the brain's owner senses a conflict coming, and the amygdala, the fear region, lights up. I pinch Enter and the lit amygdala grows until it surrounds me; I stay where I am. Around me, in front, behind, left and right, like a 3D movie, the textbook comes alive: step by step I see how this organ reacts, which signal fires, what triggered it, what it sets off, how it talks to other organs. A museum-style narrator explains each step as it happens. When the fear fades, the organ returns to normal.

Learner's words: "让教科书活起来，还要讲解，不是沉默的" (bring the textbook to life, with narration, not silent). Audience: biology students who want to "走进人体里面" (walk into the body) instead of reading a flat diagram.

## Why it belongs on glasses
- Uses: draws in the world (a brain floating in your room that then surrounds you); leaves your body free (you stand and turn your head, eyes up, hands free except for one pinch).
- Why it's better than the phone or laptop version: on a screen you look at a brain; here the lit region comes to you and surrounds you, and you turn your head to see the mechanism happening around you. The learner specifically wants to see "在家里看不到、平面都看不到的" (what you cannot see at home or on any flat surface).

## Product or overlay
- Type: product. The virtual brain is the experience.
- What the real version would sense: the owner's emotional state (fear). Nothing real is sensed in this version.
- Stand-in for the preview: one big **Start** button (default). Pinching it plays a short audio clip of a reproachful voice ("一声责怪", a voice of blame). That clip is the trigger; the amygdala lights up in response. No recognition of anything real.

## Where things live
- Where the user is looking during the main task: outside, straight ahead at the brain, about 1.2 m away. Inside, all around them, turning the head to follow the narrated event. The user does not need to walk.
- Brain (outside view): floats about 120 cm in front of the user, center a little below eye level, diameter about 100 cm. Fits inside the glasses' view from where the user stands. (Learner adopted this over a 300 cm walk-in brain after the view-size concern was raised.)
- Amygdala: inside the brain at its anatomical position (left side, roughly deep temporal lobe). Rendered as a distinct, slightly oversized lump so it reads from 1.2 m; glows strongly (warm red/orange, not dark) when fear is triggered. (default)
- Start button: about 80 cm in front of the user at chest height, large (about 20 cm wide), faces the user. (default)
- Enter button: appears next to the lit amygdala once it glows, large (about 20 cm), facing the user. (default)
- Interior scene (after pinching Enter): the amygdala scales up over about 1 to 2 seconds until it envelops the user; the outside brain fades out. A cell-scale environment then surrounds the user within about 1 to 3 m in every direction: neurons, synapses, signal paths. The user stands roughly in the middle without moving. (default layout; content follows the textbook fear pathway)
- Step labels: a short text card next to the thing being explained, about 1 m from the user, a little below eye level, light text on a translucent panel. (default)
- Next and Exit buttons: two large buttons (about 15 cm each) side by side, about 60 cm in front of the user, below eye level, following the user so they are always reachable. Exit is labelled "退" / "Exit". (default placement; buttons chosen by learner)

## Hands and input
- Start: pinch the Start button. Plays the blame voice, lights the amygdala.
- Enter: pinch the Enter button on the lit amygdala. It grows to surround the user and the interior scene appears. (Learner originally wanted to walk in, "我希望我走入其中"; adopted the stay-put version so it fits the glasses' view and a real room.)
- Next: pinch the Next button to advance one narrated step. (Learner: "捏下一")
- Exit: pinch the "退" / Exit button. The interior shrinks back into the brain and the outside view returns. (Learner: "一钮，退")
- Targets are big and highlight when aimed at.
- Voice (if any) and the button that does the same job: no voice commands.

## When things show
- Start button: shows at launch and whenever the user is outside the brain in the normal state; hides while fear is active.
- Amygdala glow: starts when the blame voice plays; stays lit through the interior steps; dims back to normal on the final "fear fades" step.
- Enter button: shows when the amygdala is lit and the user is outside; hides once inside.
- Interior scene: shows after Enter is pinched and the grow transition ends; hides on Exit.
- Step label + narration: each shows when its step begins and disappears when the step is over ("像博物馆解说，说完了就消失"). Only one label at a time.
- Next / Exit buttons: show only inside the interior scene.
- If something needs attention out of view: spatial sound plays from the lit region / the active event, plus a small arrow pointing to it. (default)

## Narrated steps (default content, textbook fear pathway)
Content detail was left to the textbook by the learner; CLAD should keep it accurate at introductory-biology level. One short sentence of narration per step, also shown as text. English for narration and labels (default; learner asked for whatever maximizes judging odds).

1. Stimulus: the blame voice arrives as a signal from the auditory pathway into the amygdala.
2. Neurons fire: amygdala neurons activate; glutamate released across synapses (animated pulses).
3. Alarm goes out: signal to the hypothalamus; stress hormones (adrenaline, cortisol) are released; heart and breathing speed up (shown as a small pulsing icon/arrow toward "other organs").
4. Fear fades: the threat passes; neurons calm; the amygdala returns to normal.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Pinch **Start**: a reproachful voice clip plays, the amygdala region on the one-meter brain visibly lights up, and an Enter button appears next to it.
2. Pinch **Enter** without moving: the amygdala grows to surround the user and an interior scene with neurons and synapses appears around them; turning the camera shows content in front, behind, left and right.
3. Pinch **Next**: each step plays an animated event (stimulus, neurons firing, signal to other organs) with a text label next to it and narration audio; the previous label has disappeared.
4. On the final step the neurons calm down, narration says the fear fades, and the amygdala returns to its normal color.
5. Pinch **退 / Exit**: the user is back outside, the brain is in its normal state, and Start is available again.

## Out of scope
- The other four emotions (喜怒哀乐) and their regions.
- Walking into any region other than the amygdala.
- Real sensing of anyone's emotion, face, or voice.
- Dopamine, healthy-vs-atrophied comparison, and other brain topics the learner mentioned early on.
- Saving progress between sessions.

## Risks and open questions
- Being enveloped by a growing object may feel sudden on real glasses; the 1 to 2 s transition is a guess. Feel unproven.
- Interior content behind the user is only seen by turning; the arrow and spatial sound (default) are relied on to point there.
- Narration voice: needs generated or recorded audio clips per step. If voice generation fails, text labels alone must still carry each step.
- Learner delegated step content and language to the textbook/judging odds; review the four narrated steps for accuracy before submission.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
