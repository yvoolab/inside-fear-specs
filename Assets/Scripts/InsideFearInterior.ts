// InsideFearInterior — the cell-scale scene around the user: neurons, synapses, travelling pulses.
// Owns: runtime-built children under this SceneObject (high-cardinality, so script-built), the
// activity level (0 = calm … 1 = firing) and its visual expression.
// Expects: @input neuronMesh / synapseMesh / neuronMaterial (authored assets wired by the bootstrap).
// Must not: know about buttons, narration or the brain — Main drives setActivity() / stage(n) and reads focusPointWorld().
import {Billboard} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard"

/** Runtime mesh of smooth tubes and balls (one per neuron): tapering branches without seams, and one draw per cell. */
class Sculpt {
  private v: number[] = []
  private idx: number[] = []
  private n = 0

  /** Tube through `pts` with a radius per point; rings of `sides` vertices, open ends (cover them with balls). */
  tube(pts: vec3[], radii: number[], sides = 8): void {
    let u = vec3.zero()
    for (let k = 0; k < pts.length; k++) {
      const tan = pts[Math.min(k + 1, pts.length - 1)].sub(pts[Math.max(k - 1, 0)]).normalize()
      const ref = Math.abs(tan.y) < 0.9 ? vec3.up() : vec3.right()
      const carried = u.sub(tan.uniformScale(u.dot(tan)))   // carry the frame along the path: no twist
      u = k > 0 && carried.length > 1e-3 ? carried.normalize() : tan.cross(ref).normalize()
      const w = tan.cross(u)
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2
        const nrm = u.uniformScale(Math.cos(a)).add(w.uniformScale(Math.sin(a)))
        const p = pts[k].add(nrm.uniformScale(radii[k]))
        this.v.push(p.x, p.y, p.z, nrm.x, nrm.y, nrm.z, 0, 0)
      }
      if (k > 0) {
        const r0 = this.n + (k - 1) * sides, r1 = this.n + k * sides
        for (let j = 0; j < sides; j++) {
          const j1 = (j + 1) % sides
          this.idx.push(r0 + j, r1 + j, r1 + j1, r0 + j, r1 + j1, r0 + j1)
        }
      }
    }
    this.n += pts.length * sides
  }

  /** Ellipsoid with radii r (x, y, z) at c. */
  ball(c: vec3, r: vec3, seg = 8): void {
    const lon = seg * 2, start = this.n
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI
      for (let j = 0; j <= lon; j++) {
        const ph = (j / lon) * Math.PI * 2
        const d = new vec3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph))
        const nrm = new vec3(d.x / r.x, d.y / r.y, d.z / r.z).normalize()
        this.v.push(c.x + d.x * r.x, c.y + d.y * r.y, c.z + d.z * r.z, nrm.x, nrm.y, nrm.z, 0, 0)
      }
    }
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < lon; j++) {
        const a = start + i * (lon + 1) + j, b = a + lon + 1
        this.idx.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
    this.n += (seg + 1) * (lon + 1)
  }

  mesh(): RenderMesh {
    const mb = new MeshBuilder([{name: "position", components: 3}, {name: "normal", components: 3, normalized: true}, {name: "texture0", components: 2}])
    mb.topology = MeshTopology.Triangles
    mb.indexType = MeshIndexType.UInt16   // callers keep each sculpt well under 65k vertices
    mb.appendVerticesInterleaved(this.v)
    mb.appendIndices(this.idx)
    mb.updateMesh()
    return mb.getMesh()
  }
}

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
  @input
  @allowUndefined
  @hint("Lit (PBR) material for solid parts, so bodies get light and shade and read as 3D. Empty = all unlit")
  litMaterial: Material
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("How many neuron towers surround the user (first 4 are the step towers)")
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
  @input('vec4', '{1,0.18,0.22,1}')
  @widget(new ColorWidget())
  @hint("Neuron color during the alarm (activity above 1)")
  alarmColor: vec4
  @ui.group_end

  // Six steps (approved plan + mock): 1 purple thalamus box, right-front · 2 shortcut cable thalamus → amygdala
  // tower (front) · 3 two towers + glutamate across the synapse, front · 4 alarm tower BEHIND-right (red lamp +
  // body labels; the user must turn, guided by the cue arrow + spatial sound) · 5 purple prefrontal tower,
  // right-front and taller, sends blue calming waves · 6 everything calm, front.
  // Step towers: amygdala (front), synapse partner (just behind it, right), alarm (behind-right), prefrontal (right-front).
  private static TOWER_DIRS = [new vec3(0, 0, -1), new vec3(0.14, 0, -1), new vec3(0.7, 0, 1), new vec3(0.5, 0, -1)]
  private static TOWER_SIZES = [1.3, 1.3, 1.3, 1.6]
  private static TOWER_DIST_CM = [220, 330, 220, 240]   // a whole tower fits the Specs FOV at ~2.2 m
  private static THALAMUS_DIR = new vec3(0.24, 0, -1)
  private static STREAM_STEPS = [2, 3, 5]   // shortcut beads · glutamate beads · calming waves
  private static PULSE_SPEED_CM_S = 140
  private static CUE_LEN = 12
  private static FOG = new vec4(0.86, 0.82, 0.96, 1)   // = dome colour: far things fade into it, so depth reads
  private static HAZE_COUNT = 24                        // small far neurons filling the dome at every height

  private activity = 0
  private time = 0
  private neurons: SceneObject[] = []
  private synapses: {a: vec3; b: vec3; len: number}[] = []
  private pulses: {so: SceneObject; syn: number; t: number}[] = []
  private crowns: vec3[] = []
  private thalamusTop = vec3.zero()
  private synapseAt = vec3.zero()
  private streams: {a: vec3; b: vec3; arc: number; beads: SceneObject[]; jit: vec3[]}[] = []
  private sphere = 1
  private box = new vec3(1, 1, 1)
  private mat!: Material
  private shineMat!: Material
  private fogged: {mat: Material; k: number}[] = []   // per-neuron clones of `mat`, k = how far into the fog
  private domeR = 0
  private windowMat!: Material
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
    const solid = this.litMaterial || this.neuronMaterial
    this.mat = solid.clone()
    this.shineMat = solid.clone()
    this.windowMat = this.tint(1, 0.93, 0.62)
    this.cableMat = this.tint(1, 0.96, 0.88)
    this.pulseMat = this.tint(1, 0.75, 0.25, false)   // glowing things stay unlit
    this.build()
    this.setActivity(0)
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  /** 0 = calm (pulses stop, cool blue) … 1 = firing (orange) … 2 = alarm (red, fastest pulses). */
  setActivity(level: number): void {
    this.activity = Math.max(0, Math.min(2, level))
    const ss = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
    const c = vec4.lerp(vec4.lerp(this.calmColor, this.activeColor, ss((this.activity - 0.3) / 0.7)), this.alarmColor, ss(this.activity - 1))   // ≤0.3 stays calm blue (no muddy grey)
    this.mat.mainPass.baseColor = c
    for (const f of this.fogged) f.mat.mainPass.baseColor = vec4.lerp(c, InsideFearInterior.FOG, f.k)
    this.shineMat.mainPass.baseColor = vec4.lerp(c, new vec4(1, 1, 1, 1), 0.45)
    const showPulses = this.activity > 0.05
    for (const p of this.pulses) p.so.enabled = showPulses
  }

  getActivity(): number { return this.activity }

  /** World position a step happens at (step 1..6). */
  focusPointWorld(step: number): vec3 {
    const c = this.crowns, at = [this.thalamusTop, vec3.lerp(this.thalamusTop, c[0], 0.5), this.synapseAt, c[2], c[3], c[0]]
    return this.sceneObject.getTransform().getWorldTransform().multiplyPoint(at[Math.max(0, Math.min(at.length - 1, step - 1))])
  }

  /** Per-step props: shortcut beads (2), glutamate beads (3), alarm lamp + labels (4), calming waves (5). 0 = none. */
  stage(step: number): void {
    this.streams.forEach((st, i) => st.beads.forEach((b) => (b.enabled = step === InsideFearInterior.STREAM_STEPS[i])))
    this.showOrgan(step === 4)
  }

  // Neural tissue around the user, styled after 3D science animations (Del 2026-10-25, option A):
  // organic somata with thin many-branched dendrites, no outlines (light and shade carry the 3D),
  // far cells fading into the dome colour, white segmented cables = myelinated axons.
  // Built from the two authored meshes only: stretched spheres for everything round, boxes for the thalamus.
  private build(): void {
    const root = this.sceneObject
    this.sphere = this.meshSize(this.neuronMesh).x
    this.box = this.meshSize(this.synapseMesh)
    const rnd = this.rng(7)
    const fy = -this.floorDropCm
    this.buildRoom(root, fy, rnd)
    const bases: vec3[] = []
    const n = InsideFearInterior.TOWER_DIRS.length
    const purple = this.tint(0.62, 0.45, 0.98)   // prefrontal cortex tower keeps its own colour
    for (let i = 0; i < this.neuronCount; i++) {
      let dir: vec3, radius: number, size: number
      if (i < n) {
        dir = InsideFearInterior.TOWER_DIRS[i].normalize()
        radius = InsideFearInterior.TOWER_DIST_CM[i]
        size = InsideFearInterior.TOWER_SIZES[i]
      } else {   // background towers spread evenly round the user, jittered
        const a = ((i - n) / (this.neuronCount - n)) * Math.PI * 2 + rnd() * 0.4
        dir = new vec3(Math.sin(a), 0, -Math.cos(a))
        radius = this.maxRadiusCm + rnd() * 80   // behind the focus towers, never between them and the user
        size = 0.9 + rnd() * 0.4
      }
      const base = dir.uniformScale(radius).add(new vec3(0, fy, 0))
      bases.push(base)
      const mat = i === 3 ? purple : this.foggedMat(radius)
      this.neurons.push(this.buildNeuron(root, "Neuron" + i, base, size, i < n ? 3 : 2, rnd, mat))
      this.crowns.push(base.add(new vec3(0, 95 * size, 0)))
    }
    this.buildHaze(root, fy, rnd)
    // Step props: thalamus + shortcut cable into the amygdala tower, synapse cable to its partner, prefrontal waves
    const c = this.crowns, thalamusSide = this.buildThalamus(root, fy)
    this.myelin(root, thalamusSide, c[0])
    this.myelin(root, c[0], c[1])
    this.addStream(root, thalamusSide, c[0], this.pulseMat)
    const side = bases[0].add(new vec3(-200, 0, 0)), partner = bases.slice(n).sort((x, y) => x.distance(side) - y.distance(side))[0] || bases[1]
    this.buildSynapse(root, bases[0], partner)   // adds the glutamate stream (stream 1); partner ~2 m left so its dendrite shows side-on
    this.addStream(root, this.crowns[3], this.crowns[0], this.tint(0.45, 0.8, 1, false), 20, 90)   // arc clears the thalamus box
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
    this.buildGlia(root, bases, rnd)
    this.buildCue(root, this.sphere, this.box)
    this.buildOrgan(root, this.sphere)
    print("[InsideFearInterior] built towers=" + this.neurons.length + " cables=" + this.synapses.length)
  }

  // Plain tissue floor + tall lavender dome (seen from inside → two-sided). Specs' additive display
  // makes the dome a light wash on device; in preview / recordings it reads as "inside".
  private buildRoom(root: SceneObject, fy: number, rnd: () => number): void {
    const R = this.maxRadiusCm + 260
    this.domeR = R
    this.part(root, "Floor", this.neuronMesh, this.tint(0.93, 0.66, 0.74), new vec3(0, fy - 2, 0), new vec3(R * 2, 2, R * 2))
    const dome = this.tint(InsideFearInterior.FOG.x, InsideFearInterior.FOG.y, InsideFearInterior.FOG.z, false)   // lavender (Del 2026-10-24); labels below are dark so they read on it
    dome.mainPass.twoSided = true
    this.part(root, "Dome", this.neuronMesh, dome, new vec3(0, fy, 0), new vec3(R * 2, R * 2, R * 2))
  }

  /** Clone of `mat` that setActivity() colours, pushed toward the fog by distance (150 cm clear … 500 cm 75 % fog). */
  private foggedMat(distCm: number): Material {
    const m = this.mat.clone()
    this.fogged.push({mat: m, k: Math.max(0, Math.min(0.75, (distCm - 150) / 470))})
    return m
  }

  // One neuron hanging in the tissue: teardrop soma high up (just under the step's "crown"), dendrites
  // radiating every way, a short apical tuft on top, and an axon down to the myelin cable on the floor.
  // Soma-high + radiating keeps it from reading as a tree (trunk up from the ground, crown on top).
  // `size` 1 ≈ 20 cm soma, 95 cm to the crown. One mesh per cell.
  private buildNeuron(root: SceneObject, name: string, base: vec3, size: number, levels: number, rnd: () => number, mat: Material): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(root)
    so.getTransform().setLocalPosition(base)
    const sc = new Sculpt(), w = this.neuronSizeCm * size * 0.55, soma = new vec3(0, 76 * size, 0)
    sc.ball(soma, new vec3(w / 2, w * 0.62, w / 2), 12)
    const foot = new vec3(rnd() * 16 - 8, 8, rnd() * 16 - 8)
    sc.tube([soma.add(new vec3(0, -w * 0.45, 0)), soma.add(new vec3(0, -w * 0.85, 0)), vec3.lerp(soma, foot, 0.6).add(new vec3(4, 0, -3)), foot],
      [w * 0.16, 1.3, 1.1, 1.0])   // hillock + axon → floor cable
    const top = soma.add(new vec3(0, 19 * size, 0))
    sc.tube([soma.add(new vec3(0, w * 0.5, 0)), top], [w * 0.18, 1.5 * size])   // short apical trunk
    sc.ball(top, vec3.one().uniformScale(1.2 * size), 5)
    this.dendrite(sc, top, vec3.up(), 12 * size, 1.3 * size, levels - 1, rnd, 1.0, 0)
    const nb = 6, phase = rnd() * Math.PI * 2
    for (let k = 0; k < nb; k++) {   // radiating dendrites, out and up/down alike
      const a = phase + (k / nb) * Math.PI * 2
      const d = new vec3(Math.cos(a), (k % 2 ? -0.55 : 0.35) + rnd() * 0.3, Math.sin(a)).normalize()
      this.dendrite(sc, soma.add(d.uniformScale(w * 0.42)), d, 22 * size, 1.5 * size, levels - 1, rnd, 0.55, 0)
    }
    this.addVisual(so, sc.mesh(), mat)
    return so
  }

  // Far, small, simplified neurons floating at all heights inside the dome: they make the tissue dense and deep.
  private buildHaze(root: SceneObject, fy: number, rnd: () => number): void {
    const R = this.domeR
    for (let i = 0; i < InsideFearInterior.HAZE_COUNT; i++) {
      const a = (i / InsideFearInterior.HAZE_COUNT) * Math.PI * 2 + rnd() * 0.25
      const r = this.maxRadiusCm + 110 + rnd() * 90
      const ceil = fy + R * Math.sqrt(Math.max(0, 1 - (r / R) * (r / R))) - 40   // stay under the dome
      const y = Math.min(ceil, -120 + rnd() * 320)
      const so = global.scene.createSceneObject("Haze" + i)
      so.setParent(root)
      so.getTransform().setLocalPosition(new vec3(Math.sin(a) * r, y, -Math.cos(a) * r))
      const sc = new Sculpt(), s = 12 + rnd() * 6
      sc.ball(vec3.zero(), new vec3(s / 2, s * 0.65, s / 2), 8)
      for (let k = 0; k < 5; k++) {
        const d = new vec3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize()
        this.dendrite(sc, d.uniformScale(s * 0.35), d, 30 + rnd() * 20, 1.6, 1, rnd, 0.5, 0)
      }
      this.addVisual(so, sc.mesh(), this.foggedMat(r + 60))
    }
  }

  // A dendrite: a slightly bent tapering tube, then 3 (deep) or 2 children from a small fork ball.
  // No ball tips: they read as fruit on a tree. `thick` is the diameter at its start.
  private dendrite(sc: Sculpt, from: vec3, dir: vec3, len: number, thick: number, depth: number, rnd: () => number,
                   spread: number, lift: number): void {
    const to = from.add(dir.uniformScale(len))
    const mid = vec3.lerp(from, to, 0.5).add(new vec3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).uniformScale(len * 0.16))
    const r = thick / 2
    sc.tube([from, mid, to], [r, r * 0.85, r * 0.72], 6)
    if (depth === 0) return
    sc.ball(to, vec3.one().uniformScale(r * 0.75), 4)
    const kids = depth >= 2 ? 3 : 2, phase = rnd() * Math.PI * 2
    for (let k = 0; k < kids; k++) {
      const phi = phase + (k / kids) * Math.PI * 2, tilt = spread + rnd() * 0.3
      const side = new vec3(Math.cos(phi), 0, Math.sin(phi))
      const nd = dir.uniformScale(Math.cos(tilt)).add(side.uniformScale(Math.sin(tilt))).add(new vec3(0, lift, 0)).normalize()
      this.dendrite(sc, to, nd, len * (0.65 + rnd() * 0.3), thick * 0.7, depth - 1, rnd, spread, lift)
    }
  }

  // Myelinated axon: chain of white capsules with small gaps (nodes of Ranvier); pulses ride it.
  private addCable(root: SceneObject, a: vec3, b: vec3): void {
    this.myelin(root, a, b)
    this.synapses.push({a, b, len: b.distance(a)})
  }

  private myelin(root: SceneObject, a: vec3, b: vec3): void {
    const len = b.distance(a), seg = 22, n = Math.max(1, Math.floor(len / seg))
    const rot = quat.rotationFromTo(vec3.forward(), b.sub(a).normalize())
    for (let k = 0; k < n; k++) {
      this.part(root, "Myelin", this.neuronMesh, this.cableMat, vec3.lerp(a, b, (k + 0.5) / n), new vec3(5, 5, (len / n) * 0.82), rot)
    }
  }

  /** Beads that run a → b only during their step (see stage()); `spread` scatters them sideways into a cloud. */
  private addStream(root: SceneObject, a: vec3, b: vec3, mat: Material, sizeCm = 9, arc = 0, count = 3, spread = 0): void {
    const beads: SceneObject[] = [], jit: vec3[] = []
    for (let k = 0; k < count; k++) {
      beads.push(this.part(root, "StreamBead" + k, this.neuronMesh, mat, a, vec3.one().uniformScale(sizeCm)))
      const ang = (k / count) * Math.PI * 2
      jit.push(new vec3(0, Math.sin(ang) * spread, Math.cos(ang) * spread))
    }
    beads.forEach((o) => (o.enabled = false))
    this.streams.push({a, b, arc, beads, jit})
  }

  // ── Step 3 synapse, beside the amygdala neuron at the same depth so sizes compare directly ──
  // Del 2026-10-24: not the real ~1000× gap, but the volume difference must show:
  // soma (~26 cm) > axon terminal (16) > vesicles (2.2) > glutamate (1.2), across a 4 cm cleft.
  // The terminal is a see-through membrane with its vesicles inside, like the cut-away terminals in science animations.
  private buildSynapse(root: SceneObject, towerA: vec3, towerB: vec3): void {
    const S = towerA.add(new vec3(-80, 70, -5))   // left of neuron 0 at its depth, in the open gap between the background neurons
    this.synapseAt = S
    const gap = 4, termR = 8, headR = 5
    const term = S.add(new vec3(gap / 2 + termR, 0, 0)), head = S.add(new vec3(-gap / 2 - headR * 0.8, 0, 0))
    // presynaptic: neuron 0's myelinated axon rises from its foot to the terminal bouton
    const axonFrom = towerA.add(new vec3(-30, 10, 8)), axonTo = term.add(new vec3(-4, -14, 4))
    this.myelin(root, axonFrom, axonTo)
    this.rod(root, axonTo, term.add(new vec3(0, -termR * 0.8, 0)), 2.4, this.mat)
    const rnd = this.rng(11), ves = this.tint(1, 0.9, 0.55)   // lit, so each vesicle reads as a ball
    for (let k = 0; k < 30;) {   // vesicles fill the bouton, a little denser toward the cleft side
      const d = new vec3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1)
      if (d.length > 1 || (d.x > 0.3 && rnd() < 0.5)) continue
      this.part(root, "Vesicle", this.neuronMesh, ves, term.add(d.uniformScale(termR * 0.72)), new vec3(1.8, 1.8, 1.8))
      k++
    }
    for (let k = 0; k < 4; k++) {   // docked at the membrane facing the cleft
      const b = (k / 4) * Math.PI * 2
      this.part(root, "DockedVesicle", this.neuronMesh, ves, term.add(new vec3(-termR * 0.85, Math.cos(b) * 2.6, Math.sin(b) * 2.6)), new vec3(1.8, 1.8, 1.8))
    }
    const membrane = this.neuronMaterial.clone()   // drawn after the vesicles so they show through
    membrane.mainPass.baseColor = new vec4(1, 0.72, 0.45, 0.3)
    membrane.mainPass.blendMode = BlendMode.Normal
    membrane.mainPass.depthWrite = false
    membrane.mainPass.twoSided = true
    this.part(root, "AxonTerminal", this.neuronMesh, membrane, term, new vec3(termR * 2, termR * 2, termR * 2))
    // postsynaptic: a dendrite from the partner neuron ends in a mushroom spine with receptors facing the cleft
    const neck = head.add(new vec3(-headR - 5, 0, 0))
    const dendFrom = towerB.add(new vec3(0, 85, 0))
    this.rod(root, dendFrom, neck, 2.6, this.mat)
    this.rod(root, neck, head, 1.8, this.mat)
    this.part(root, "SpineHead", this.neuronMesh, this.shineMat, head, new vec3(headR * 1.6, headR * 2, headR * 2))
    const rec = this.tint(0.2, 0.55, 0.6)
    for (let k = 0; k < 5; k++) {
      const b = (k / 5) * Math.PI * 2
      this.block(root, "Receptor", rec, head.add(new vec3(headR * 0.78, Math.cos(b) * 2.4, Math.sin(b) * 2.4)), new vec3(1.2, 1.2, 1.2))
    }
    this.addStream(root, term.add(new vec3(-termR, 0, 0)), head.add(new vec3(headR * 0.8, 0, 0)), this.tint(0.55, 1, 0.3, false), 1.2, 0, 8, 1.6)
    this.label(root, "synapse", S.add(new vec3(0, 18, 0)), 110)
  }

  // ── Glia, schematic: a few astrocytes (star body, many fine processes ending in feet on the towers)
  // and oligodendrocytes (small body whose arms reach the white myelin it wraps). ──
  private buildGlia(root: SceneObject, bases: vec3[], rnd: () => number): void {
    const astro = this.tint(0.55, 0.88, 0.7), oligo = this.tint(0.93, 0.85, 1)
    const n = InsideFearInterior.TOWER_DIRS.length
    // astrocytes between a background tower and its nearest neighbour, at mid-body height
    for (let k = 0; k < 3; k++) {
      const i = n + k * 3
      if (i >= bases.length) break
      const j = bases.map((p, m) => ({m, d: m === i ? 1e9 : p.distance(bases[i])})).sort((x, y) => x.d - y.d)[0].m
      const c = vec3.lerp(bases[i], bases[j], 0.5).add(new vec3(0, 55, 0))
      this.part(root, "Astrocyte", this.neuronMesh, astro, c, new vec3(16, 14, 16))
      const ends = [bases[i], bases[j]].map((b) => b.add(c.sub(b).normalize().uniformScale(20)).add(new vec3(0, 45, 0)))
      for (let p = 0; p < 6; p++) {
        const ang = rnd() * Math.PI * 2
        ends.push(c.add(new vec3(Math.cos(ang) * 28, -10 + rnd() * 30, Math.sin(ang) * 28)))
      }
      for (const e of ends) {
        this.rod(root, c, e, 1.6, astro)
        this.part(root, "EndFoot", this.neuronMesh, astro, e, new vec3(3.5, 3.5, 3.5))
      }
      if (k === 0) this.label(root, "astrocyte (glia)", c.add(new vec3(0, 28, 0)), 100)
    }
    // oligodendrocytes above the two nearest floor cables in front of the user
    const front = this.synapses.map((s, i) => ({i, m: vec3.lerp(s.a, s.b, 0.5)})).filter((o) => o.m.z < -100)
      .sort((x, y) => x.m.length - y.m.length).slice(0, 2)
    front.forEach((o, k) => {
      const s = this.synapses[o.i], c = o.m.add(new vec3(0, 32, 0))
      this.part(root, "Oligodendrocyte", this.neuronMesh, oligo, c, new vec3(12, 12, 12))
      for (const f of [0.3, 0.5, 0.7]) this.rod(root, c, vec3.lerp(s.a, s.b, f).add(new vec3(0, 3, 0)), 1.6, oligo)
      if (k === 0) this.label(root, "oligodendrocyte (glia)\nmakes the myelin", c.add(new vec3(0, 22, 0)), 100)
    })
  }

  private label(root: SceneObject, text: string, pos: vec3, size: number): void {
    const so = global.scene.createSceneObject("Label")
    so.setParent(root)
    so.getTransform().setLocalPosition(pos)
    const txt = so.createComponent("Component.Text") as Text
    txt.text = text
    txt.size = size
    txt.textFill.color = new vec4(0.3, 0.2, 0.5, 1)
    txt.horizontalAlignment = HorizontalAlignment.Center
    so.createComponent(Billboard.getTypeName())
  }

  // Thalamus (cell scale): a small cluster of purple relay neurons whose bundled axons leave toward the
  // amygdala neuron. Only the step anchors stay where the old relay box was. Returns where the bundle leaves.
  private buildThalamus(root: SceneObject, fy: number): vec3 {
    const dir = InsideFearInterior.THALAMUS_DIR.normalize()
    const base = dir.uniformScale(205).add(new vec3(0, fy, 0))
    const purple = this.tint(0.62, 0.45, 0.98), rnd = this.rng(23)
    const cells = [new vec3(0, 142, 0), new vec3(-16, 128, 6), new vec3(14, 152, -8), new vec3(8, 122, 10)]
    for (let k = 0; k < cells.length; k++) {
      const so = global.scene.createSceneObject("ThalamusCell" + k)
      so.setParent(root)
      so.getTransform().setLocalPosition(base.add(cells[k]))
      const sc = new Sculpt(), s = 13 - k * 1.5
      sc.ball(vec3.zero(), new vec3(s / 2, s * 0.6, s / 2), 10)
      for (let j = 0; j < 4; j++) {
        const d = new vec3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize()
        this.dendrite(sc, d.uniformScale(s * 0.4), d, 18 + rnd() * 10, 1.4, 1, rnd, 0.5, 0)
      }
      this.addVisual(so, sc.mesh(), purple)
    }
    const label = global.scene.createSceneObject("ThalamusLabel")
    label.setParent(root)
    label.getTransform().setLocalPosition(base.add(new vec3(0, 172, 0)))
    const txt = label.createComponent("Component.Text") as Text
    txt.text = "THALAMUS\nsensory relay"
    txt.size = 150
    txt.textFill.color = new vec4(0.3, 0.2, 0.5, 1)
    txt.horizontalAlignment = HorizontalAlignment.Center
    label.createComponent(Billboard.getTypeName())
    this.thalamusTop = base.add(new vec3(0, 159, 0))
    const toUser = new vec3(-dir.x, 0, -dir.z), left = new vec3(toUser.z, 0, -toUser.x)   // box side facing the amygdala tower
    return base.add(new vec3(0, 138, 0)).add(left.uniformScale(-23))
  }

  /** Box-mesh part sized in cm. */
  private block(parent: SceneObject, name: string, mat: Material, pos: vec3, sizeCm: vec3): void {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    so.getTransform().setLocalPosition(pos)
    so.getTransform().setLocalScale(new vec3(sizeCm.x / this.box.x, sizeCm.y / this.box.y, sizeCm.z / this.box.z))
    this.addVisual(so, this.synapseMesh, mat)
  }

  /** Round tube a → b of diameter `thick`, its own small mesh. */
  private rod(parent: SceneObject, a: vec3, b: vec3, thick: number, mat: Material): void {
    const so = global.scene.createSceneObject("Branch")
    so.setParent(parent)
    const sc = new Sculpt()
    sc.tube([a, b], [thick / 2, thick / 2], 8)
    sc.ball(a, vec3.one().uniformScale(thick / 2), 4)
    sc.ball(b, vec3.one().uniformScale(thick / 2), 4)
    this.addVisual(so, sc.mesh(), mat)
  }

  /** Sphere-mesh part sized in cm (x, y, z diameters). */
  private part(parent: SceneObject, name: string, mesh: RenderMesh, mat: Material, pos: vec3, sizeCm: vec3, rot?: quat): SceneObject {
    // ponytail: one SceneObject per part (~1.6k total); merge meshes if Specs fps drops
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    const t = so.getTransform()
    t.setLocalPosition(pos)
    if (rot) t.setLocalRotation(rot)
    t.setLocalScale(sizeCm.uniformScale(1 / this.sphere))
    this.addVisual(so, mesh, mat)
    return so
  }

  private tint(r: number, g: number, b: number, lit = true): Material {
    const m = (lit && this.litMaterial ? this.litMaterial : this.neuronMaterial).clone()
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

  // ── Step 4 alarm: a red pulsing lamp above the alarm tower, with what the body does ──
  private buildOrgan(root: SceneObject, sphereSize: number): void {
    this.organ = global.scene.createSceneObject("OrganPulse")
    this.organ.setParent(root)
    const m = this.neuronMaterial.clone()
    m.mainPass.baseColor = new vec4(1, 0.25, 0.3, 1)
    this.addVisual(this.organ, this.neuronMesh, m)
    this.organLabel = global.scene.createSceneObject("OrganLabel")
    this.organLabel.setParent(root)
    const txt = this.organLabel.createComponent("Component.Text") as Text
    txt.text = "HEART ↑\nBREATH ↑\nFREEZE"
    txt.size = 200   // plain world Text at ~160 cm: ~8 cm cap height
    txt.textFill.color = new vec4(1, 0.9, 0.9, 1)
    txt.horizontalAlignment = HorizontalAlignment.Center
    this.organLabel.createComponent(Billboard.getTypeName())
    this.organ.enabled = false
    this.organLabel.enabled = false
  }

  showOrgan(on: boolean): void {
    if (on) {
      const p = this.focusPointWorld(4)
      this.organ.getTransform().setWorldPosition(p.add(new vec3(0, 72, 0)))   // lamp just above the tree top
      this.organLabel.getTransform().setWorldPosition(p.add(new vec3(0, 125, 0)))   // above the lamp: lower, the step card hides it
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
      const s = (16 / this.sphere) * (1 + 0.25 * Math.max(0, Math.sin(this.time * 9.4)))
      this.organ.getTransform().setLocalScale(new vec3(s, s, s))
    }
    if (this.cueRod.enabled) {  // gentle bob so the arrow catches the eye
      const t = this.cueTip.getTransform()
      const base = this.cueTip.getTransform().getLocalScale()
      const k = 1 + 0.15 * Math.sin(this.time * 6)
      t.setLocalScale(base.uniformScale(k / (1 + 0.15 * Math.sin((this.time - dt) * 6))))
    }
    for (const st of this.streams) {
      if (!st.beads[0].enabled) continue
      st.beads.forEach((b, k) => {
        const f = (this.time * 0.6 + k / st.beads.length) % 1
        b.getTransform().setLocalPosition(vec3.lerp(st.a, st.b, f).add(new vec3(0, st.arc * Math.sin(Math.PI * f), 0)).add(st.jit[k]))
      })
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
