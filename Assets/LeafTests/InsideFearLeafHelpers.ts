// Shared helpers for the Inside Fear LEAF scenarios. All scene object names verified via scene-graphql.
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {InsideFearMain} from "../Scripts/InsideFearMain"
import {InsideFearInterior} from "../Scripts/InsideFearInterior"

export const ENVELOPE_WAIT_MS = 2300 // growDurationSec (1.5 s) + settle

export function main(): InsideFearMain {
  return findSceneObjectByName("InsideFear").getComponent(InsideFearMain.getTypeName()) as InsideFearMain
}

export function interior(): InsideFearInterior {
  return findSceneObjectByName("Interior").getComponent(InsideFearInterior.getTypeName()) as InsideFearInterior
}

export async function tap(name: string): Promise<void> {
  const b = findInteractablesByName(name, undefined, true)[0]
  if (!b) throw new Error(`Button "${name}" not found or not enabled`)
  await new DefaultLeafInteractor().trigger(b)
  await sleep(400)
}

export function buttonVisible(name: string): boolean {
  return findInteractablesByName(name, undefined, true).length > 0
}

export function amygdalaColor(): vec4 {
  const rmv = findSceneObjectByName("Amygdala").getComponent("Component.RenderMeshVisual") as RenderMeshVisual
  return rmv.mainMaterial.mainPass.baseColor
}

export function sameColor(a: vec4, b: vec4): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) + Math.abs(a.w - b.w) < 0.01
}

/** Any audio playing on the controller or its children (step narration is emitted from a child emitter). */
export function anyAudioPlaying(): boolean {
  const walk = (so: SceneObject): boolean =>
    (so.getComponents("Component.AudioComponent") as AudioComponent[]).some((a) => a.isPlaying()) ||
    so.children.some(walk)
  return walk(findSceneObjectByName("InsideFear"))
}

/** All Text under StepCard joined — title + body. */
export function stepCardText(): string {
  const out: string[] = []
  const walk = (so: SceneObject) => {
    for (const t of so.getComponents("Component.Text") as Text[]) out.push(t.text)
    for (const c of so.children) walk(c)
  }
  walk(findSceneObjectByName("StepCard"))
  return out.join(" | ")
}

/** Start → Enter → wait for the envelope; leaves the Lens in state "inside". */
export async function goInside(): Promise<void> {
  await tap("StartButton")
  await tap("EnterButton")
  await sleep(ENVELOPE_WAIT_MS)
  if (main().state !== "inside") throw new Error(`expected state inside, got ${main().state}`)
}

/** Scenarios share one live Lens: bring it back to "outside" whatever the previous one left. */
export async function ensureOutside(): Promise<void> {
  const m = main()
  if (m.state === "triggered") { await tap("EnterButton"); await sleep(ENVELOPE_WAIT_MS) }
  if (m.state === "entering") await sleep(ENVELOPE_WAIT_MS)
  if (m.state === "inside") { await tap("退 / Exit"); await sleep(ENVELOPE_WAIT_MS) }
  if (m.state === "exiting") await sleep(ENVELOPE_WAIT_MS)
  if (m.state !== "outside") throw new Error(`could not reach outside, state=${m.state}`)
}
