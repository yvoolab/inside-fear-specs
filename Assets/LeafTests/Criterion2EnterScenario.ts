// Done criterion 2: pinch Enter without moving → amygdala envelops the user, interior with neurons and
// synapses appears; content exists in front, behind, left and right of the camera.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {ENVELOPE_WAIT_MS, buttonVisible, ensureOutside, main, tap} from "./InsideFearLeafHelpers"

@component
export class Criterion2EnterScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await ensureOutside()
    const cam = findSceneObjectByName("Camera Object").getTransform()
    const camPosBefore = cam.getWorldPosition()
    const amyg = findSceneObjectByName("Amygdala").getTransform()
    const baseScale = amyg.getWorldScale().x

    await tap("StartButton")
    await tap("EnterButton")
    expect(main().state).toBe("entering")
    await sleep(600)
    expect(amyg.getWorldScale().x).toBeGreaterThan(baseScale * 2)   // growing around the user
    await sleep(ENVELOPE_WAIT_MS)

    expect(main().state).toBe("inside")
    expect(cam.getWorldPosition().distance(camPosBefore) < 1).toBe(true)  // user did not move
    expect(findSceneObjectByName("Brain").enabled).toBe(false)             // outside brain gone
    const interior = findSceneObjectByName("Interior")
    expect(interior.enabled).toBe(true)
    const neurons = interior.children.filter((c) => c.name.indexOf("Neuron") === 0)
    const synapses = interior.children.filter((c) => c.name === "Synapse")
    expect(neurons.length).toBeGreaterThan(3)
    expect(synapses.length).toBeGreaterThan(3)

    // Content all around: classify neurons by half-space relative to the camera.
    const camPos = cam.getWorldPosition()
    const look = cam.back      // camera looks down its local -Z
    const right = cam.right
    let front = 0, behind = 0, left = 0, rightN = 0
    for (const n of neurons) {
      const d = n.getTransform().getWorldPosition().sub(camPos)
      if (d.dot(look) > 0) front++; else behind++
      if (d.dot(right) > 0) rightN++; else left++
    }
    expect(front).toBeGreaterThan(0)
    expect(behind).toBeGreaterThan(0)
    expect(left).toBeGreaterThan(0)
    expect(rightN).toBeGreaterThan(0)
    expect(buttonVisible("Next")).toBe(true)
    expect(buttonVisible("退 / Exit")).toBe(true)
    expect(buttonVisible("EnterButton")).toBe(false)
  }
}
