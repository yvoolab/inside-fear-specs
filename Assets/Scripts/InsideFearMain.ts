// InsideFearMain — the experience state machine (single source of truth for state + step).
// Owns: state ("outside" | "triggered" | "entering" | "inside" | "exiting"), step (0..6), amygdala glow,
// the grow/shrink envelope transition, audio playback, and what each UI module shows.
// Expects: @inputs wired by the bootstrap (brain, amygdala, interior, 4 UI modules, camera).
// Must not: build UI or author scene roots — those are authored SceneObjects / UI modules.
//
// Observability for LEAF / logs: public `state`, `step`, `amygdalaLit`; every transition prints
// "[InsideFear] state=<s> step=<n> lit=<bool>".
import {InsideFearBigButtonUI} from "./InsideFearBigButtonUI"
import {InsideFearNavUI} from "./InsideFearNavUI"
import {InsideFearStepCardUI} from "./InsideFearStepCardUI"
import {InsideFearInterior} from "./InsideFearInterior"
import {InsideFearNeuriCard} from "./InsideFearNeuriCard"

const SFX_BLAME = requireAsset("../GeneratedSFX/BlameVoice.wav") as AudioTrackAsset
const SFX_CLICK = requireAsset("../GeneratedSFX/Click.wav") as AudioTrackAsset
const SFX_STEPS = [
  requireAsset("../GeneratedSFX/Step1.wav") as AudioTrackAsset,
  requireAsset("../GeneratedSFX/Step2.wav") as AudioTrackAsset,
  requireAsset("../GeneratedSFX/Step3.wav") as AudioTrackAsset,
  requireAsset("../GeneratedSFX/Step4.wav") as AudioTrackAsset,
]
const SFX_FOR_STEP = [0, 1, 1, 2, 3, 3]   // stimulus · firing · firing · alarm · calming · calming
const NARRATION = [   // Neuri's lines (tools/neuri_voice.py), spoken from her card
  requireAsset("../Narration/Neuri1.mp3") as AudioTrackAsset,
  requireAsset("../Narration/Neuri2.mp3") as AudioTrackAsset,
  requireAsset("../Narration/Neuri3.mp3") as AudioTrackAsset,
  requireAsset("../Narration/Neuri4.mp3") as AudioTrackAsset,
  requireAsset("../Narration/Neuri5.mp3") as AudioTrackAsset,
  requireAsset("../Narration/Neuri6.mp3") as AudioTrackAsset,
]

export type InsideFearState = "outside" | "triggered" | "entering" | "inside" | "exiting"

// Neuri's six storyboard steps (tools/concept_diagrams.py STEPS5): title, her line, neuron activity
// (0 calm blue · 1 firing orange · 2 alarm red). Overridable per step via the `stepTexts` input.
const DEFAULT_STEPS: {title: string; body: string; activity: number}[] = [
  {title: "1 · Sound arrives", body: "I just heard Mom scold me: “How could you?!” I jumped! Right now the sound is going from my ears to my thalamus, the relay station in my brain.", activity: 0.35},
  {title: "2 · The fast shortcut", body: "I'm scared, and I don't even know why yet. A shortcut has already carried the sound straight into my amygdala, faster than I can understand the words.", activity: 1.0},
  {title: "3 · Neurons fire", body: "My whole body tenses up. Inside my amygdala, neurons are firing: glutamate jumps across the synapses and the signal races to the central nucleus.", activity: 1.0},
  {title: "4 · Alarm goes out", body: "My heart is pounding, I can't move... I just want to run away! My amygdala's alarm told my hypothalamus and brainstem: adrenaline, fast breathing, freeze!", activity: 1.8},
  {title: "5 · The slow road checks", body: "Wait... it's only words. Mom isn't dangerous. My prefrontal cortex checks the details and tells my amygdala to calm down. Phew.", activity: 0.35},
  {title: "6 · Fear fades", body: "My breathing slows down and I feel calm again. My neurons have settled, but stress hormones take a while to fade, so I still feel a bit shaky.", activity: 0.0},
]

@component
export class InsideFearMain extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">InsideFearMain – state machine for the Inside Fear tour</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input @hint("Camera Object — the interior is centered on it when entering") cameraObject!: SceneObject
  @input @hint("Translucent 1 m brain sphere") brain!: SceneObject
  @input @hint("Amygdala lump inside the brain; glows and grows to envelop the user") amygdala!: SceneObject
  @input @hint("Interior controller (neurons / synapses)") interior!: InsideFearInterior
  @input @hint("Start button UI") startButton!: InsideFearBigButtonUI
  @input @hint("Enter button UI (appears next to the lit amygdala)") enterButton!: InsideFearBigButtonUI
  @input @hint("Next / Exit panel shown inside") nav!: InsideFearNavUI
  @input @hint("Narration text card") stepCard!: InsideFearStepCardUI
  @input @hint("Neuri's floating storyboard card (the caption sits under it)") neuriCard!: InsideFearNeuriCard
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input('vec4', '{1,0.12,0.1,1}')
  @widget(new ColorWidget())
  @hint("Amygdala color while fear is active (alarm red; the resting amygdala is orange)")
  glowColor: vec4
  @input
  @hint("Seconds for the amygdala to grow around the user / shrink back (brief: 1–2 s)")
  @widget(new SliderWidget(0.5, 4, 0.1))
  growDurationSec: number = 1.5
  @input
  @hint("Scale multiplier of the amygdala when it envelops the user (14 cm × 30 ≈ 4 m)")
  @widget(new SliderWidget(10, 60, 1))
  envelopeScale: number = 30
  @input
  @hint("Optional narration override, one entry per step as 'Title|Body'. Leave empty for the textbook defaults.")
  stepTexts: string[] = []
  @input
  @hint("Master volume of every cue; 0 = silent (dev runs on a shared machine — set back to 1 before recording)")
  @widget(new SliderWidget(0, 1, 0.05))
  volume: number = 1
  @input
  @hint("Recording only: plays the whole tour on timers (Start, Enter, six steps, Exit). Leave off.")
  autoDemo: boolean = false
  @ui.group_end

  // ── Public, readable state (LEAF asserts on these) ──
  state: InsideFearState = "outside"
  step: number = 0
  amygdalaLit: boolean = false

  private brainMat!: Material
  private amygMat!: Material
  private amygNormalColor!: vec4
  private brainAlpha = 0.35
  private amygBaseScale!: vec3
  private tween: {t: number; dur: number; from: number; to: number; done: () => void} | null = null
  private audioByTrack = new Map<AudioTrackAsset, AudioComponent>()
  private glowTime = 0

  onAwake() {
    if (!this.cameraObject || !this.brain || !this.amygdala || !this.interior || !this.startButton || !this.enterButton || !this.nav || !this.stepCard || !this.neuriCard) {
      print("[InsideFear] required @input not wired — check bootstrap Phase B")
      return
    }
    // Clone materials so runtime color/fade edits never touch the asset files.
    const brainRmv = this.brain.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const amygRmv = this.amygdala.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    this.brainMat = brainRmv.mainMaterial.clone()
    brainRmv.mainMaterial = this.brainMat
    this.brainMat.mainPass.blendMode = BlendMode.Normal
    this.brainMat.mainPass.depthWrite = false
    this.brainAlpha = this.brainMat.mainPass.baseColor.a
    this.amygMat = amygRmv.mainMaterial.clone()
    amygRmv.mainMaterial = this.amygMat
    this.amygMat.mainPass.twoSided = true   // visible from inside while it envelops the user
    this.amygNormalColor = this.amygMat.mainPass.baseColor
    this.amygBaseScale = this.amygdala.getTransform().getLocalScale()

    // Other scripts are not awake yet during our onAwake (hierarchy order) — wire them in OnStart.
    this.createEvent("OnStartEvent").bind(() => {
      this.startButton.onPressed.add(() => this.onStartPressed())
      this.enterButton.onPressed.add(() => this.onEnterPressed())
      this.nav.onNext.add(() => this.onNextPressed())
      this.nav.onExit.add(() => this.onExitPressed())
      this.interior.sceneObject.enabled = false
      this.applyOutside()
      if (this.autoDemo) this.runDemo()
    })
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  /** Demo-video autopilot: [seconds before, action]. Step times = narration + ~1 s; step 4 longer (turn around). */
  private runDemo(): void {
    const next = () => this.onNextPressed()
    const plan: [number, () => void][] = [[2.5, () => this.onStartPressed()], [4, () => this.onEnterPressed()], [3, next],
      [12.8, next], [12.4, next], [13.1, next], [17, next], [13.7, next], [12.4, () => this.onExitPressed()]]
    let i = 0
    const ev = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
    ev.bind(() => { plan[i++][1](); if (i < plan.length) ev.reset(plan[i][0]) })
    ev.reset(plan[0][0])
  }

  // ── Transitions ─────────────────────────────────────────────────────────
  private onStartPressed(): void {
    if (this.state !== "outside") return
    this.play(SFX_CLICK)
    this.play(SFX_BLAME)
    this.setLit(true)
    this.startButton.setVisible(false)
    this.enterButton.setVisible(true)
    this.setState("triggered")
  }

  private onEnterPressed(): void {
    if (this.state !== "triggered") return
    this.play(SFX_CLICK)
    this.enterButton.setVisible(false)
    this.setState("entering")
    this.tween = {t: 0, dur: this.growDurationSec, from: 1, to: this.envelopeScale, done: () => {
      this.brain.enabled = false
      this.amygdala.enabled = false
      this.interior.sceneObject.getTransform().setWorldPosition(this.cameraObject.getTransform().getWorldPosition())
      this.interior.sceneObject.enabled = true
      this.interior.setActivity(0.3)
      this.interior.hideCue()
      this.interior.stage(0)
      this.nav.setVisible(true)
      this.step = 0
      this.setState("inside")
    }}
  }

  private onNextPressed(): void {
    if (this.state !== "inside") return
    this.play(SFX_CLICK)
    const last = DEFAULT_STEPS.length
    if (this.step >= last) { this.stepCard.hide(); return }   // tour over: label disappears
    this.step += 1
    const s = this.stepFor(this.step)
    this.interior.setActivity(s.activity)
    if (this.step === last) this.setLit(false)              // fear fades → amygdala back to normal
    const focus = this.interior.focusPointWorld(this.step)
    this.neuriCard.showStep(this.step)
    this.stepCard.showStep(s.title, s.body)
    this.play(SFX_STEPS[SFX_FOR_STEP[this.step - 1]], focus)   // event cue comes from the event (spatial)
    this.speak(NARRATION[this.step - 1], this.neuriCard.getSceneObject().getTransform().getWorldPosition())
    this.cueIfOutOfView(focus)
    this.interior.stage(this.step)
    print("[InsideFear] state=" + this.state + " step=" + this.step + " lit=" + this.amygdalaLit)
  }

  private onExitPressed(): void {
    if (this.state !== "inside") return
    this.play(SFX_CLICK)
    if (this.voice?.isPlaying()) this.voice.stop(false)
    this.nav.setVisible(false)
    this.stepCard.hide()
    this.neuriCard.hide()
    this.interior.sceneObject.enabled = false
    this.setLit(false)
    this.amygdala.enabled = true
    this.brain.enabled = true
    this.setState("exiting")
    this.tween = {t: 0, dur: this.growDurationSec, from: this.envelopeScale, to: 1, done: () => {
      this.step = 0
      this.applyOutside()
    }}
  }

  private applyOutside(): void {
    this.brain.enabled = true
    this.amygdala.enabled = true
    this.setAmygScale(1)
    this.setBrainAlpha(1)
    this.setLit(false)
    this.startButton.setVisible(true)
    this.enterButton.setVisible(false)
    this.nav.setVisible(false)
    this.stepCard.hide()
    this.neuriCard.hide()
    this.setState("outside")
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  private setState(s: InsideFearState): void {
    this.state = s
    print("[InsideFear] state=" + s + " step=" + this.step + " lit=" + this.amygdalaLit)
  }

  private setLit(lit: boolean): void {
    this.amygdalaLit = lit
    this.amygMat.mainPass.baseColor = lit ? this.glowColor : this.amygNormalColor
  }

  private stepFor(n: number) {
    const d = DEFAULT_STEPS[n - 1]
    const o = this.stepTexts[n - 1]
    if (!o) return d
    const i = o.indexOf("|")
    return {title: i >= 0 ? o.substring(0, i) : d.title, body: i >= 0 ? o.substring(i + 1) : o, activity: d.activity}
  }

  /** Brief: if the event is out of view, a small arrow (plus the spatial sound) points to it. */
  private cueIfOutOfView(focus: vec3): void {
    const cam = this.cameraObject.getTransform()
    const d = focus.sub(cam.getWorldPosition()).normalize()
    const look = cam.back                                 // camera looks down its local -Z
    if (d.dot(look) > Math.cos(30 * Math.PI / 180)) this.interior.hideCue()
    else this.interior.showCue(focus, cam.getWorldPosition(), look)
  }

  private setAmygScale(k: number): void {
    this.amygdala.getTransform().setLocalScale(this.amygBaseScale.uniformScale(k))
  }

  private setBrainAlpha(k: number): void {
    const c = this.brainMat.mainPass.baseColor
    this.brainMat.mainPass.baseColor = new vec4(c.x, c.y, c.z, this.brainAlpha * k)
  }

  /** Plays a cue; with `at`, it is emitted spatially from that world position (narration from the event). */
  private play(track: AudioTrackAsset, at?: vec3): void {
    let a = this.audioByTrack.get(track)
    if (!a) {
      const host = at ? this.emitter() : this.sceneObject
      a = host.createComponent("Component.AudioComponent") as AudioComponent
      a.audioTrack = track
      a.playbackMode = Audio.PlaybackMode.LowLatency   // all cues here are input-reactive
      if (at) a.spatialAudio.enabled = true
      this.audioByTrack.set(track, a)
    }
    if (at) this.emitter().getTransform().setWorldPosition(at)
    a.volume = this.volume
    a.play(1)
  }

  private voice: AudioComponent | null = null
  /** Neuri's line, from where her card floats; a new line cuts the previous one. */
  private speak(track: AudioTrackAsset, at: vec3): void {
    if (!this.voice) {
      const so = global.scene.createSceneObject("NeuriVoice")
      so.setParent(this.sceneObject)
      this.voice = so.createComponent("Component.AudioComponent") as AudioComponent
      this.voice.spatialAudio.enabled = true
    }
    if (this.voice.isPlaying()) this.voice.stop(false)
    this.voice.audioTrack = track
    this.voice.volume = this.volume
    this.voice.getSceneObject().getTransform().setWorldPosition(at)
    this.voice.play(1)
  }

  private emitterObj: SceneObject | null = null
  private emitter(): SceneObject {
    if (!this.emitterObj) {
      this.emitterObj = global.scene.createSceneObject("NarrationEmitter")
      this.emitterObj.setParent(this.sceneObject)
    }
    return this.emitterObj
  }

  private tick(): void {
    const dt = getDeltaTime()
    if (this.tween) {
      const tw = this.tween
      tw.t = Math.min(1, tw.t + dt / tw.dur)
      const e = tw.t * tw.t * (3 - 2 * tw.t)   // smoothstep
      this.setAmygScale(tw.from + (tw.to - tw.from) * e)
      this.setBrainAlpha(tw.to > tw.from ? 1 - e : e)   // brain fades out while growing, back in while shrinking
      if (tw.t >= 1) { this.tween = null; tw.done() }
    }
    if (this.amygdalaLit && this.state === "triggered") {   // visible pulse while lit outside
      this.glowTime += dt
      this.setAmygScale(1 + 0.06 * Math.sin(this.glowTime * 5))
    }
  }
}
