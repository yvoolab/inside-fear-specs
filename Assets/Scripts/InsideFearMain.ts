// InsideFearMain — the experience state machine (single source of truth for state + step).
// Owns: state ("outside" | "triggered" | "entering" | "inside" | "exiting"), step (0..4), amygdala glow,
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

const SFX_BLAME = requireAsset("../GeneratedSFX/BlameVoice.wav") as AudioTrackAsset
const SFX_CLICK = requireAsset("../GeneratedSFX/Click.wav") as AudioTrackAsset
const SFX_STEPS = [
  requireAsset("../GeneratedSFX/Step1.wav") as AudioTrackAsset,
  requireAsset("../GeneratedSFX/Step2.wav") as AudioTrackAsset,
  requireAsset("../GeneratedSFX/Step3.wav") as AudioTrackAsset,
  requireAsset("../GeneratedSFX/Step4.wav") as AudioTrackAsset,
]

export type InsideFearState = "outside" | "triggered" | "entering" | "inside" | "exiting"

// Textbook fear pathway, introductory level. Overridable per step via the `stepTexts` input.
const DEFAULT_STEPS: {title: string; body: string; activity: number}[] = [
  {title: "1 · Stimulus", body: "The voice of blame arrives as a signal from the auditory pathway into the amygdala.", activity: 0.5},
  {title: "2 · Neurons fire", body: "Amygdala neurons activate; glutamate is released across the synapses.", activity: 1.0},
  {title: "3 · Alarm goes out", body: "A signal reaches the hypothalamus; adrenaline and cortisol are released, heart and breathing speed up.", activity: 0.9},
  {title: "4 · Fear fades", body: "The threat passes. Neurons calm down and the amygdala returns to normal.", activity: 0.0},
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
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input('vec4', '{1,0.45,0.1,1}')
  @widget(new ColorWidget())
  @hint("Amygdala color while fear is active (warm, bright — additive display)")
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
    if (!this.cameraObject || !this.brain || !this.amygdala || !this.interior || !this.startButton || !this.enterButton || !this.nav || !this.stepCard) {
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
    })
    this.createEvent("UpdateEvent").bind(() => this.tick())
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
      this.interior.showOrgan(false)
      this.nav.setVisible(true)
      this.step = 0
      this.setState("inside")
    }}
  }

  private onNextPressed(): void {
    if (this.state !== "inside") return
    this.play(SFX_CLICK)
    if (this.step >= 4) { this.stepCard.hide(); return }   // tour over: label disappears
    this.step += 1
    const s = this.stepFor(this.step)
    this.interior.setActivity(s.activity)
    if (this.step === 4) this.setLit(false)                 // fear fades → amygdala back to normal
    const focus = this.interior.focusPointWorld(this.step)
    this.placeCardNear(focus)
    this.stepCard.showStep(s.title, s.body)
    this.play(SFX_STEPS[this.step - 1], focus)          // narration cue comes from the event (spatial)
    this.cueIfOutOfView(focus)
    this.interior.showOrgan(this.step === 3)
    print("[InsideFear] state=" + this.state + " step=" + this.step + " lit=" + this.amygdalaLit)
  }

  private onExitPressed(): void {
    if (this.state !== "inside") return
    this.play(SFX_CLICK)
    this.nav.setVisible(false)
    this.stepCard.hide()
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

  /** Card sits 100 cm from the user, offset toward the focus neuron (horizontal offset halved so a
   *  40 cm card stays inside the ~19° half-width view), a little below eye level and above the nav. */
  private placeCardNear(focus: vec3): void {
    const cam = this.cameraObject.getTransform().getWorldPosition()
    const d = focus.sub(cam)
    const dir = new vec3(d.x * 0.4, 0, d.z).normalize()
    this.stepCard.sceneObject.getTransform().setWorldPosition(cam.add(dir.uniformScale(100)).add(new vec3(0, -5, 0)))
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
    a.play(1)
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
