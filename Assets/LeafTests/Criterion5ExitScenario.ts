// Done criterion 5: pinch Exit → user is back outside, brain in its normal state, Start available again.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {ENVELOPE_WAIT_MS, amygdalaColor, buttonVisible, ensureOutside, goInside, main, sameColor, tap} from "./InsideFearLeafHelpers"

@component
export class Criterion5ExitScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await ensureOutside()
    const normal = amygdalaColor()
    const amyg = findSceneObjectByName("Amygdala").getTransform()
    const baseScale = amyg.getWorldScale().x
    await goInside()
    await tap("Next")
    await tap("Next")

    await tap("Exit")
    expect(main().state).toBe("exiting")
    await sleep(ENVELOPE_WAIT_MS)

    expect(main().state).toBe("outside")
    expect(main().step).toBe(0)
    expect(findSceneObjectByName("Brain").enabled).toBe(true)
    expect(findSceneObjectByName("Amygdala").enabled).toBe(true)
    expect(findSceneObjectByName("Interior").enabled).toBe(false)
    expect(amyg.getWorldScale().x).toBeCloseTo(baseScale, 1)      // shrunk back
    expect(main().amygdalaLit).toBe(false)
    expect(sameColor(amygdalaColor(), normal)).toBe(true)          // normal color
    expect(buttonVisible("StartButton")).toBe(true)                // Start available again
    expect(buttonVisible("EnterButton")).toBe(false)
    expect(buttonVisible("Next")).toBe(false)
    expect(findSceneObjectByName("StepCard").enabled).toBe(false)
  }
}
