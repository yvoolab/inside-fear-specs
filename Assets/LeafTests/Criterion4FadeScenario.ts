// Done criterion 4: on the final step neurons calm down, narration says the fear fades, and the amygdala
// returns to its normal color.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {amygdalaColor, ensureOutside, goInside, interior, main, sameColor, stepCardText, tap} from "./InsideFearLeafHelpers"

@component
export class Criterion4FadeScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await ensureOutside()
    const normal = amygdalaColor()
    await goInside()
    for (let n = 1; n <= 3; n++) await tap("Next")
    expect(main().step).toBe(3)
    expect(main().amygdalaLit).toBe(true)
    expect(interior().getActivity()).toBeGreaterThan(0.5)

    await tap("Next")                                   // final step
    expect(main().step).toBe(4)
    expect(interior().getActivity()).toBe(0)            // neurons calm
    expect(stepCardText().toLowerCase().includes("fear fades")).toBe(true)
    expect(main().amygdalaLit).toBe(false)
    expect(sameColor(amygdalaColor(), normal)).toBe(true)   // back to normal color
  }
}
