// InsideFearNeuriCard — Neuri herself as a floating storyboard card (the OUTSIDE panel of each step).
// Owns: the card image, its lazy follow (left-front of the user, slightly below eye level), and where
// the caption card sits (just under it).
// Expects: @input cameraObject; @input caption = the narration text card SceneObject.
// Must not: know step content or order — Main calls showStep(n) / hide().
import {Billboard} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard"
import {IMAGE_MATERIAL_ASSET} from "SpectaclesUIKit.lspkg/Scripts/Utility/Assets"

const CARDS = [   // requireAsset needs literal paths (resolved at build time)
  requireAsset("../Textures/NeuriCard1.png") as Texture,
  requireAsset("../Textures/NeuriCard2.png") as Texture,
  requireAsset("../Textures/NeuriCard3.png") as Texture,
  requireAsset("../Textures/NeuriCard4.png") as Texture,
  requireAsset("../Textures/NeuriCard5.png") as Texture,
  requireAsset("../Textures/NeuriCard6.png") as Texture,
]

@component
export class InsideFearNeuriCard extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">InsideFearNeuriCard – Neuri floating card + caption placement</span>')
  @ui.separator
  @ui.group_start("References")
  @input @hint("Camera Object (the card follows its yaw)") cameraObject!: SceneObject
  @input @hint("Narration text card; kept just under Neuri") caption!: SceneObject
  @ui.group_end
  @ui.group_start("Settings")
  @input @hint("Card width in cm (art is 8:9)") @widget(new SliderWidget(12, 40, 1)) widthCm: number = 22
  @input @hint("Distance from the user, cm") @widget(new SliderWidget(60, 160, 5)) distanceCm: number = 100
  @input @hint("Yaw to the left of where the user looks, degrees") @widget(new SliderWidget(0, 40, 1)) leftDeg: number = 24
  @input @hint("Card center below eye level, cm") @widget(new SliderWidget(-20, 30, 1)) dropCm: number = 2
  @ui.group_end

  private image!: Image
  private wantVisible = false
  private moving = true

  get visible(): boolean { return this.wantVisible }

  onAwake() {
    const pic = global.scene.createSceneObject("NeuriPic")
    pic.setParent(this.sceneObject)
    this.image = pic.createComponent("Component.Image") as Image
    this.image.mainMaterial = IMAGE_MATERIAL_ASSET.clone()
    this.image.stretchMode = StretchMode.Stretch
    pic.getTransform().setLocalScale(new vec3(this.widthCm, this.widthCm * 9 / 8, 1))
    this.sceneObject.createComponent(Billboard.getTypeName())
    this.createEvent("UpdateEvent").bind(() => this.follow())
    this.sceneObject.enabled = false
  }

  /** Show Neuri's card for step n (1-based) and snap it into place. */
  showStep(n: number): void {
    this.image.mainPass.baseTex = CARDS[Math.max(0, Math.min(CARDS.length - 1, n - 1))]
    if (!this.wantVisible) {
      this.sceneObject.getTransform().setWorldPosition(this.target())
      this.moving = false
    }
    this.wantVisible = true
    this.sceneObject.enabled = true
    this.follow()
  }

  hide(): void {
    this.wantVisible = false
    this.sceneObject.enabled = false
  }

  private target(): vec3 { return this.ahead(this.leftDeg).add(new vec3(0, -this.dropCm, 0)) }

  /** Point distanceCm in front of the user at eye height, yawed left by yawDeg (+ = left). */
  private ahead(yawDeg: number): vec3 {
    const cam = this.cameraObject.getTransform()
    const look = cam.back
    const flat = new vec3(look.x, 0, look.z).normalize()
    const dir = quat.angleAxis(yawDeg * Math.PI / 180, vec3.up()).multiplyVec3(flat)
    return cam.getWorldPosition().add(dir.uniformScale(this.distanceCm))
  }

  // Lazy follow: stay put until the card drifts > 15° from its slot, then glide back (~0.5 s).
  private follow(): void {
    if (!this.wantVisible) return
    const t = this.sceneObject.getTransform()
    const cam = this.cameraObject.getTransform().getWorldPosition()
    const goal = this.target()
    const a = t.getWorldPosition().sub(cam), b = goal.sub(cam)
    const off = Math.acos(Math.max(-1, Math.min(1, new vec3(a.x, 0, a.z).normalize().dot(new vec3(b.x, 0, b.z).normalize()))))
    if (off > 15 * Math.PI / 180) this.moving = true
    if (this.moving) {
      t.setWorldPosition(vec3.lerp(t.getWorldPosition(), goal, 1 - Math.exp(-getDeltaTime() * 6)))
      if (off < 2 * Math.PI / 180) this.moving = false
    }
    const h = this.widthCm * 9 / 8
    // Subtitle band: centered, in the empty strip above Neuri's card (Del 2026-10-24: text like subtitles, over nothing)
    this.caption.getTransform().setWorldPosition(this.ahead(0).add(new vec3(0, -this.dropCm + h / 2 + 7.5, 0)))
  }
}
