// InsideFearInterior — the cell-scale scene around the user: neurons, synapses, travelling pulses.
// Owns: runtime-built children under this SceneObject (high-cardinality, so script-built), the
// activity level (0 = calm … 1 = firing) and its visual expression.
// Expects: @input neuronMesh / synapseMesh / neuronMaterial (authored assets wired by the bootstrap).
// Must not: know about steps, buttons or the brain — Main drives setActivity() and reads focusPointWorld().
import {Billboard} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard"

@component
export class InsideFearInterior extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">InsideFearInterior – neurons + synapses around the user</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Sphere mesh used for neuron bodies and pulses")
  neuronMesh!: RenderMesh
  @input
  @hint("Box mesh stretched into thin synapse rods")
  synapseMesh!: RenderMesh
  @input
  @hint("Unlit material cloned for neurons, synapses and pulses")
  neuronMaterial!: Material
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("How many neurons surround the user (first 4 are the per-step focus points)")
  @widget(new SliderWidget(6, 40, 1))
  neuronCount: number = 18
  @input
  @hint("Neuron body diameter in cm")
  @widget(new SliderWidget(4, 40, 1))
  neuronSizeCm: number = 14
  @input
  @hint("Nearest / farthest neuron distance from the user, cm (brief: 1–3 m)")
  @widget(new SliderWidget(60, 400, 10))
  minRadiusCm: number = 120
  @input
  @hint("Farthest neuron distance from the user, cm")
  @widget(new SliderWidget(100, 500, 10))
  maxRadiusCm: number = 280
  @input('vec4', '{0.55,0.75,1,1}')
  @widget(new ColorWidget())
  @hint("Neuron color when calm")
  calmColor: vec4
  @input('vec4', '{1,0.55,0.2,1}')
  @widget(new ColorWidget())
  @hint("Neuron color when firing")
  activeColor: vec4
  @ui.group_end

  // Fixed directions of the 4 focus neurons: step 1 left, step 2 right (both in the forward view),
  // step 3 BEHIND-right (the alarm leaves the amygdala toward "other organs" — the user must turn,
  // guided by the cue arrow + spatial sound), step 4 center.
  private static FOCUS_DIRS = [new vec3(-0.3, 0.0, -1), new vec3(0.3, 0.05, -1), new vec3(0.7, 0.1, 1), new vec3(0, 0.05, -1)]
  private static PULSE_SPEED_CM_S = 140
  private static CUE_LEN = 12

  private activity = 0
  private time = 0
  private neurons: SceneObject[] = []
  private synapses: {a: vec3; b: vec3; len: number}[] = []
  private pulses: {so: SceneObject; syn: number; t: number}[] = []
  private mat!: Material
  private pulseMat!: Material
  private cueRod!: SceneObject
  private cueTip!: SceneObject
  private organ!: SceneObject
  private organLabel!: SceneObject

  onAwake() {
    if (!this.neuronMesh || !this.synapseMesh || !this.neuronMaterial) {
      print("[InsideFearInterior] required @input not wired (neuronMesh / synapseMesh / neuronMaterial)")
      return
    }
    this.mat = this.neuronMaterial.clone()
    this.pulseMat = this.neuronMaterial.clone()
    this.pulseMat.mainPass.baseColor = new vec4(1, 1, 1, 1)
    this.build()
    this.setActivity(0)
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  /** 0 = calm (pulses stop, cool color) … 1 = firing (fast pulses, warm color). */
  setActivity(level: number): void {
    this.activity = Math.max(0, Math.min(1, level))
    this.mat.mainPass.baseColor = vec4.lerp(this.calmColor, this.activeColor, this.activity)
    const showPulses = this.activity > 0.05
    for (const p of this.pulses) p.so.enabled = showPulses
  }

  getActivity(): number { return this.activity }

  /** World position of the neuron a step should be explained next to (step 1..4). */
  focusPointWorld(step: number): vec3 {
    const i = Math.max(0, Math.min(this.neurons.length - 1, step - 1))
    return this.neurons[i].getTransform().getWorldPosition()
  }

  private build(): void {
    const root = this.sceneObject
    const sphereSize = this.meshSize(this.neuronMesh).x
    const boxSize = this.meshSize(this.synapseMesh)
    const positions: vec3[] = []
    for (let i = 0; i < this.neuronCount; i++) {
      let dir: vec3
      if (i < InsideFearInterior.FOCUS_DIRS.length) {
        dir = InsideFearInterior.FOCUS_DIRS[i].normalize()
      } else {
        // uniform random direction on the sphere → content in front, behind, left, right, above
        const z = Math.random() * 2 - 1, phi = Math.random() * Math.PI * 2, r = Math.sqrt(1 - z * z)
        dir = new vec3(r * Math.cos(phi), z * 0.6, r * Math.sin(phi))
      }
      const radius = i < 4 ? (this.minRadiusCm + this.maxRadiusCm) * 0.4 : this.minRadiusCm + Math.random() * (this.maxRadiusCm - this.minRadiusCm)
      const pos = dir.uniformScale(radius)
      positions.push(pos)
      const so = global.scene.createSceneObject("Neuron" + i)
      so.setParent(root)
      so.getTransform().setLocalPosition(pos)
      const s = this.neuronSizeCm / sphereSize
      so.getTransform().setLocalScale(new vec3(s, s, s))
      this.addVisual(so, this.neuronMesh, this.mat)
      this.neurons.push(so)
    }
    // Synapses: each neuron to its 2 nearest neighbours (deduped)
    const seen = new Set<string>()
    for (let i = 0; i < positions.length; i++) {
      const order = positions.map((p, j) => ({j, d: p.distance(positions[i])})).filter((o) => o.j !== i).sort((x, y) => x.d - y.d)
      for (let k = 0; k < Math.min(2, order.length); k++) {
        const j = order[k].j, key = i < j ? i + "-" + j : j + "-" + i
        if (seen.has(key)) continue
        seen.add(key)
        this.addSynapse(root, positions[i], positions[j], boxSize)
      }
    }
    // One pulse per synapse, staggered
    for (let s = 0; s < this.synapses.length; s++) {
      const so = global.scene.createSceneObject("Pulse" + s)
      so.setParent(root)
      const sz = (this.neuronSizeCm * 0.3) / sphereSize
      so.getTransform().setLocalScale(new vec3(sz, sz, sz))
      this.addVisual(so, this.neuronMesh, this.pulseMat)
      this.pulses.push({so, syn: s, t: Math.random()})
    }
    this.buildCue(root, sphereSize, boxSize)
    this.buildOrgan(root, sphereSize)
    print("[InsideFearInterior] built neurons=" + this.neurons.length + " synapses=" + this.synapses.length)
  }

  // ── Out-of-view cue: a short white rod + tip, 70 cm ahead of the user, pointing at the target ──
  private buildCue(root: SceneObject, sphereSize: number, boxSize: vec3): void {
    this.cueRod = global.scene.createSceneObject("CueArrow")
    this.cueRod.setParent(root)
    this.cueRod.getTransform().setLocalScale(new vec3(0.8 / boxSize.x, 0.8 / boxSize.y, InsideFearInterior.CUE_LEN / boxSize.z))
    this.addVisual(this.cueRod, this.synapseMesh, this.pulseMat)
    this.cueTip = global.scene.createSceneObject("CueArrowTip")
    this.cueTip.setParent(root)
    const ts = 2.2 / sphereSize
    this.cueTip.getTransform().setLocalScale(new vec3(ts, ts, ts))
    this.addVisual(this.cueTip, this.neuronMesh, this.pulseMat)
    this.cueRod.enabled = false
    this.cueTip.enabled = false
  }

  /** Point the cue from 70 cm in front of the user, above the nav panel, toward `target`. */
  showCue(target: vec3, camPos: vec3, lookDir: vec3): void {
    const anchor = camPos.add(lookDir.normalize().uniformScale(70)).add(new vec3(0, 20, 0))
    const dir = target.sub(anchor).normalize()
    const t = this.cueRod.getTransform()
    t.setWorldPosition(anchor)
    t.setWorldRotation(quat.lookAt(dir, vec3.up()))   // rod is symmetric: either sign of Z reads the same
    this.cueTip.getTransform().setWorldPosition(anchor.add(dir.uniformScale(InsideFearInterior.CUE_LEN * 0.5)))
    this.cueRod.enabled = true
    this.cueTip.enabled = true
  }

  hideCue(): void { this.cueRod.enabled = false; this.cueTip.enabled = false }
  isCueVisible(): boolean { return this.cueRod.enabled }

  // ── Step 3 "other organs": a red pulsing sphere above the step-3 neuron, with a small label ──
  private buildOrgan(root: SceneObject, sphereSize: number): void {
    this.organ = global.scene.createSceneObject("OrganPulse")
    this.organ.setParent(root)
    const m = this.neuronMaterial.clone()
    m.mainPass.baseColor = new vec4(1, 0.25, 0.3, 1)
    this.addVisual(this.organ, this.neuronMesh, m)
    this.organLabel = global.scene.createSceneObject("OrganLabel")
    this.organLabel.setParent(root)
    const txt = this.organLabel.createComponent("Component.Text") as Text
    txt.text = "heart & lungs\nspeed up"
    txt.size = 200   // plain world Text at ~160 cm: ~8 cm cap height
    txt.textFill.color = new vec4(1, 0.9, 0.9, 1)
    txt.horizontalAlignment = HorizontalAlignment.Center
    this.organLabel.createComponent(Billboard.getTypeName())
    this.organ.enabled = false
    this.organLabel.enabled = false
  }

  showOrgan(on: boolean): void {
    if (on) {
      const p = this.focusPointWorld(3).add(new vec3(0, 26, 0))
      this.organ.getTransform().setWorldPosition(p)
      this.organLabel.getTransform().setWorldPosition(p.add(new vec3(0, -18, 0)))
    }
    this.organ.enabled = on
    this.organLabel.enabled = on
  }
  isOrganVisible(): boolean { return this.organ.enabled }

  private addSynapse(root: SceneObject, a: vec3, b: vec3, boxSize: vec3): void {
    const dir = b.sub(a), len = dir.length
    const so = global.scene.createSceneObject("Synapse")
    so.setParent(root)
    const t = so.getTransform()
    t.setLocalPosition(a.add(b).uniformScale(0.5))
    t.setLocalRotation(quat.lookAt(dir.normalize(), vec3.up()))
    const thick = 1.2
    t.setLocalScale(new vec3(thick / boxSize.x, thick / boxSize.y, len / boxSize.z))
    this.addVisual(so, this.synapseMesh, this.mat)
    this.synapses.push({a, b, len})
  }

  private addVisual(so: SceneObject, mesh: RenderMesh, mat: Material): void {
    const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = mesh
    rmv.mainMaterial = mat
  }

  private meshSize(mesh: RenderMesh): vec3 {
    const s = mesh.aabbMax.sub(mesh.aabbMin)
    return new vec3(s.x || 1, s.y || 1, s.z || 1)
  }

  private tick(): void {
    const dt = getDeltaTime()
    this.time += dt
    if (this.organ.enabled) {   // heartbeat ~1.5 Hz
      const s = (10 / this.meshSize(this.neuronMesh).x) * (1 + 0.25 * Math.max(0, Math.sin(this.time * 9.4)))
      this.organ.getTransform().setLocalScale(new vec3(s, s, s))
    }
    if (this.cueRod.enabled) {  // gentle bob so the arrow catches the eye
      const t = this.cueTip.getTransform()
      const base = this.cueTip.getTransform().getLocalScale()
      const k = 1 + 0.15 * Math.sin(this.time * 6)
      t.setLocalScale(base.uniformScale(k / (1 + 0.15 * Math.sin((this.time - dt) * 6))))
    }
    if (this.activity <= 0.05) return
    for (const p of this.pulses) {
      const syn = this.synapses[p.syn]
      p.t += (InsideFearInterior.PULSE_SPEED_CM_S * this.activity * dt) / syn.len
      if (p.t >= 1) {
        p.t = 0
        p.syn = Math.floor(Math.random() * this.synapses.length)
      }
      p.so.getTransform().setLocalPosition(vec3.lerp(syn.a, syn.b, p.t))
    }
    // gentle breathing on neurons, stronger when firing
    const base = this.neuronSizeCm / this.meshSize(this.neuronMesh).x
    for (let i = 0; i < this.neurons.length; i++) {
      const s = base * (1 + 0.08 * this.activity * Math.sin(this.time * 4 + i))
      this.neurons[i].getTransform().setLocalScale(new vec3(s, s, s))
    }
  }
}
