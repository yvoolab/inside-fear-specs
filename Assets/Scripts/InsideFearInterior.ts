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
  @hint("How many neuron towers surround the user (first 4 are the per-step focus points)")
  @widget(new SliderWidget(6, 24, 1))
  neuronCount: number = 12
  @input
  @hint("Tower body width in cm")
  @widget(new SliderWidget(20, 60, 1))
  neuronSizeCm: number = 36
  @input
  @hint("Floor distance below the user's eyes, cm")
  @widget(new SliderWidget(80, 200, 5))
  floorDropCm: number = 150
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
  private crowns: vec3[] = []
  private sphere = 1
  private box = new vec3(1, 1, 1)
  private mat!: Material
  private doorMat!: Material
  private windowMat!: Material
  private nucleusMat!: Material
  private beadMat!: Material
  private cableMat!: Material
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
    this.doorMat = this.neuronMaterial.clone()
    this.windowMat = this.tint(1, 0.95, 0.72)
    this.nucleusMat = this.tint(0.98, 0.6, 0.2)
    this.beadMat = this.tint(1, 0.93, 0.6)
    this.cableMat = this.tint(1, 0.96, 0.88)
    this.pulseMat = this.tint(1, 0.75, 0.25)
    this.build()
    this.setActivity(0)
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  /** 0 = calm (pulses stop, cool color) … 1 = firing (fast pulses, warm color). */
  setActivity(level: number): void {
    this.activity = Math.max(0, Math.min(1, level))
    const k = Math.max(0, Math.min(1, (this.activity - 0.3) / 0.7)), c = vec4.lerp(this.calmColor, this.activeColor, k * k * (3 - 2 * k))   // ≤0.3 stays calm blue (no muddy grey)
    this.mat.mainPass.baseColor = c
    this.doorMat.mainPass.baseColor = new vec4(c.x * 0.7, c.y * 0.7, c.z * 0.75, 1)
    const showPulses = this.activity > 0.05
    for (const p of this.pulses) p.so.enabled = showPulses
  }

  getActivity(): number { return this.activity }

  /** World position of the tower crown a step should be explained next to (step 1..4). */
  focusPointWorld(step: number): vec3 {
    const i = Math.max(0, Math.min(this.crowns.length - 1, step - 1))
    return this.sceneObject.getTransform().getWorldTransform().multiplyPoint(this.crowns[i])
  }

  // Cartoon "amygdala town" (brief: towers = neurons, white segmented cables = myelinated axons,
  // pink cobbled tissue floor, dark-red dome). Built from the two authored meshes only:
  // stretched spheres for bodies/windows/doors/cobbles/dome, thin boxes for dendrite branches.
  private build(): void {
    const root = this.sceneObject
    this.sphere = this.meshSize(this.neuronMesh).x
    this.box = this.meshSize(this.synapseMesh)
    const rnd = this.rng(7)
    const fy = -this.floorDropCm
    this.buildRoom(root, fy, rnd)
    const bases: vec3[] = []
    const n = InsideFearInterior.FOCUS_DIRS.length
    for (let i = 0; i < this.neuronCount; i++) {
      let dir: vec3, radius: number, size: number
      if (i < n) {
        const d = InsideFearInterior.FOCUS_DIRS[i]
        dir = new vec3(d.x, 0, d.z).normalize()
        radius = (this.minRadiusCm + this.maxRadiusCm) * 0.55   // ~2.2 m: a whole tower fits the Specs FOV
        size = 1.3
      } else {   // background towers spread evenly round the user, jittered
        const a = ((i - n) / (this.neuronCount - n)) * Math.PI * 2 + rnd() * 0.4
        dir = new vec3(Math.sin(a), 0, -Math.cos(a))
        radius = this.maxRadiusCm + rnd() * 80   // behind the focus towers, never between them and the user
        size = 0.9 + rnd() * 0.4
      }
      const base = dir.uniformScale(radius).add(new vec3(0, fy, 0))
      bases.push(base)
      this.neurons.push(this.buildTower(root, "Neuron" + i, base, size, i < n ? 3 : 2, rnd))
      this.crowns.push(base.add(new vec3(0, 95 * size, 0)))
    }
    // Myelinated axons: each tower to its 2 nearest neighbours (deduped), along the floor
    const seen = new Set<string>()
    for (let i = 0; i < bases.length; i++) {
      const order = bases.map((p, j) => ({j, d: p.distance(bases[i])})).filter((o) => o.j !== i).sort((x, y) => x.d - y.d)
      for (let k = 0; k < Math.min(2, order.length); k++) {
        const j = order[k].j, key = i < j ? i + "-" + j : j + "-" + i
        if (seen.has(key)) continue
        seen.add(key)
        this.addCable(root, bases[i].add(new vec3(0, 8, 0)), bases[j].add(new vec3(0, 8, 0)))
      }
    }
    // One glowing bead per cable, staggered
    for (let s = 0; s < this.synapses.length; s++) {
      this.pulses.push({so: this.part(root, "Pulse" + s, this.neuronMesh, this.pulseMat, vec3.zero(), new vec3(7, 7, 7)), syn: s, t: rnd()})
    }
    this.buildCue(root, this.sphere, this.box)
    this.buildOrgan(root, this.sphere)
    print("[InsideFearInterior] built towers=" + this.neurons.length + " cables=" + this.synapses.length)
  }

  // Pink cobbled floor disc + dark-red dome (seen from inside → two-sided). Specs' additive display
  // makes the dark dome near-transparent on device; in preview / recordings it reads as "inside".
  private buildRoom(root: SceneObject, fy: number, rnd: () => number): void {
    const R = this.maxRadiusCm + 160
    this.part(root, "Floor", this.neuronMesh, this.tint(0.85, 0.4, 0.5), new vec3(0, fy - 2, 0), new vec3(R * 2, 2, R * 2))
    const cob = this.tint(0.96, 0.62, 0.68)
    for (let z = -R; z < R; z += 34) {
      for (let x = -R + ((z / 34) % 2 ? 22 : 0); x < R; x += 46) {
        const r = Math.sqrt(x * x + z * z)
        if (r > R - 30 || r < 50) continue   // keep the user's own spot clear
        this.part(root, "Cobble", this.neuronMesh, cob, new vec3(x + rnd() * 8, fy, z + rnd() * 6), new vec3(38 + rnd() * 6, 3, 26), quat.angleAxis(rnd() * 0.4 - 0.2, vec3.up()))
      }
    }
    const dome = this.tint(0.36, 0.08, 0.16)
    dome.mainPass.twoSided = true
    this.part(root, "Dome", this.neuronMesh, dome, new vec3(0, fy, 0), new vec3(R * 2, R * 1.3, R * 2))
  }

  // One neuron: capsule-ish body facing the user, round window with nucleus, door, branching
  // dendrite antenna with bead tips. `size` 1 ≈ 70 cm body + ~60 cm crown.
  private buildTower(root: SceneObject, name: string, base: vec3, size: number, levels: number, rnd: () => number): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(root)
    const t = so.getTransform()
    t.setLocalPosition(base)
    t.setLocalRotation(quat.lookAt(new vec3(-base.x, 0, -base.z).normalize(), vec3.up()))   // +Z → user
    const w = this.neuronSizeCm * size, h = 80 * size
    this.part(so, "Body", this.neuronMesh, this.mat, new vec3(0, h * 0.35, 0), new vec3(w, h, w))
    this.part(so, "Window", this.neuronMesh, this.windowMat, new vec3(0, h * 0.55, w * 0.44), new vec3(w * 0.42, w * 0.42, 4))
    this.part(so, "Nucleus", this.neuronMesh, this.nucleusMat, new vec3(0, h * 0.55, w * 0.5), new vec3(w * 0.2, w * 0.2, 3))
    this.part(so, "Door", this.neuronMesh, this.doorMat, new vec3(0, h * 0.05, w * 0.46), new vec3(w * 0.38, h * 0.32, 4))
    this.branch(so, new vec3(0, h * 0.8, 0), vec3.up(), 26 * size, 2.6 * size, levels, rnd)
    return so
  }

  private branch(parent: SceneObject, from: vec3, dir: vec3, len: number, thick: number, depth: number, rnd: () => number): void {
    const to = from.add(dir.uniformScale(len))
    this.rod(parent, from, to, thick, this.mat)
    if (depth === 0) {
      this.part(parent, "Bead", this.neuronMesh, this.beadMat, to, new vec3(4, 4, 4))
      return
    }
    const kids = depth >= 2 ? 3 : 2, phase = rnd() * Math.PI * 2
    for (let k = 0; k < kids; k++) {
      const phi = phase + (k / kids) * Math.PI * 2, tilt = 0.5 + rnd() * 0.3
      const side = new vec3(Math.cos(phi), 0, Math.sin(phi))
      const nd = dir.uniformScale(Math.cos(tilt)).add(side.uniformScale(Math.sin(tilt))).add(new vec3(0, 0.25, 0)).normalize()
      this.branch(parent, to, nd, len * 0.72, thick * 0.7, depth - 1, rnd)
    }
  }

  // Myelinated axon: chain of white capsules with small gaps (nodes of Ranvier); pulses ride it.
  private addCable(root: SceneObject, a: vec3, b: vec3): void {
    const len = b.distance(a), seg = 16, n = Math.max(1, Math.floor(len / seg))
    const rot = quat.rotationFromTo(vec3.forward(), b.sub(a).normalize())
    for (let k = 0; k < n; k++) {
      this.part(root, "Myelin", this.neuronMesh, this.cableMat, vec3.lerp(a, b, (k + 0.5) / n), new vec3(5, 5, (len / n) * 0.82), rot)
    }
    this.synapses.push({a, b, len})
  }

  private rod(parent: SceneObject, a: vec3, b: vec3, thick: number, mat: Material): void {
    const so = global.scene.createSceneObject("Branch")
    so.setParent(parent)
    const t = so.getTransform()
    t.setLocalPosition(a.add(b).uniformScale(0.5))
    t.setLocalRotation(quat.rotationFromTo(vec3.forward(), b.sub(a).normalize()))
    t.setLocalScale(new vec3(thick / this.box.x, thick / this.box.y, a.distance(b) / this.box.z))
    this.addVisual(so, this.synapseMesh, mat)
  }

  /** Sphere-mesh part sized in cm (x, y, z diameters). */
  private part(parent: SceneObject, name: string, mesh: RenderMesh, mat: Material, pos: vec3, sizeCm: vec3, rot?: quat): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    const t = so.getTransform()
    t.setLocalPosition(pos)
    if (rot) t.setLocalRotation(rot)
    t.setLocalScale(sizeCm.uniformScale(1 / this.sphere))
    this.addVisual(so, mesh, mat)
    return so
  }

  private tint(r: number, g: number, b: number): Material {
    const m = this.neuronMaterial.clone()
    m.mainPass.baseColor = new vec4(r, g, b, 1)
    return m
  }

  /** Deterministic RNG so the town looks the same every run (screenshots, LEAF). */
  private rng(seed: number): () => number {
    let x = seed
    return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646
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
      const s = (10 / this.sphere) * (1 + 0.25 * Math.max(0, Math.sin(this.time * 9.4)))
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
    // gentle breathing on towers, stronger when firing
    for (let i = 0; i < this.neurons.length; i++) {
      const s = 1 + 0.05 * this.activity * Math.sin(this.time * 4 + i)
      this.neurons[i].getTransform().setLocalScale(new vec3(s, s, s))
    }
  }
}
