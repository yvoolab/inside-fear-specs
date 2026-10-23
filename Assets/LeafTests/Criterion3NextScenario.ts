// Done criterion 3: pinch Next → each step shows an animated event with a text label and narration audio;
// the previous label is gone (only one label at a time, text replaced).
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {anyAudioPlaying, ensureOutside, goInside, interior, main, stepCardText, tap} from "./InsideFearLeafHelpers"

@component
export class Criterion3NextScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await ensureOutside()
    await goInside()
    expect(findSceneObjectByName("StepCard").enabled).toBe(false)   // no label before the first step
    const card = findSceneObjectByName("StepCard").getTransform()
    const cam = findSceneObjectByName("Camera Object").getTransform()
    const titles = ["1 · Stimulus", "2 · Neurons fire", "3 · Alarm goes out"]
    let prev = ""
    for (let n = 1; n <= 3; n++) {
      const stepBefore = main().step
      await tap("Next")
      expect(main().step).toBe(stepBefore + 1)
      expect(anyAudioPlaying()).toBe(true)                           // narration cue plays
      expect(findSceneObjectByName("StepCard").enabled).toBe(true)
      const txt = stepCardText()
      expect(txt.includes(titles[n - 1])).toBe(true)                  // this step's label
      if (prev) expect(txt.includes(prev)).toBe(false)                // previous label disappeared
      prev = titles[n - 1]
      const dist = card.getWorldPosition().distance(cam.getWorldPosition())
      expect(dist).toBeGreaterThan(60)                                // card ~1 m from the user
      expect(dist < 140).toBe(true)
      expect(interior().getActivity()).toBeGreaterThan(0.3)           // neurons animating (pulses on)
      // Step 3 happens behind the user: cue arrow + "other organs" pulse show; steps 1–2 are in view.
      const focusBehind = interior().focusPointWorld(n).sub(cam.getWorldPosition()).dot(cam.back) < 0
      expect(focusBehind).toBe(n === 3)
      expect(interior().isCueVisible()).toBe(n === 3)
      expect(interior().isOrganVisible()).toBe(n === 3)
      expect(findSceneObjectByName("CueArrow").enabled).toBe(n === 3)
      await sleep(300)
    }
  }
}
