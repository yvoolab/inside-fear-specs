// Done criterion 1: pinch Start → blame voice plays, amygdala lights up, Enter button appears next to it.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {amygdalaColor, anyAudioPlaying, buttonVisible, ensureOutside, main, sameColor, tap} from "./InsideFearLeafHelpers"

@component
export class Criterion1StartScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await ensureOutside()
    const normal = amygdalaColor()
    expect(buttonVisible("StartButton")).toBe(true)
    expect(buttonVisible("EnterButton")).toBe(false)

    await tap("StartButton")

    expect(main().state).toBe("triggered")
    expect(main().amygdalaLit).toBe(true)
    expect(anyAudioPlaying()).toBe(true)                 // blame voice clip is playing
    expect(sameColor(amygdalaColor(), normal)).toBe(false) // visibly lit (color changed)
    expect(amygdalaColor().x).toBeGreaterThan(0.8)        // warm red/orange, not dark
    expect(buttonVisible("StartButton")).toBe(false)
    expect(buttonVisible("EnterButton")).toBe(true)
    const d = findSceneObjectByName("EnterButton").getTransform().getWorldPosition()
      .distance(findSceneObjectByName("Amygdala").getTransform().getWorldPosition())
    expect(d < 50).toBe(true)                             // Enter sits next to the lit amygdala (< 50 cm)
  }
}
