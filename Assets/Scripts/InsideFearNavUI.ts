// InsideFearNavUI — lazily head-following Frame (below the gaze, so it never covers the scene) with the two interior buttons: Next and "退 / Exit".
// Owns: the Frame, both buttons, its visibility. Shown only while inside the amygdala.
// Expects: nothing wired; icons are fixed assets. Main subscribes to onNext / onExit.
// Must not: track the step or decide when the tour ends.
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {Frame} from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {ElementContent} from "SpectaclesUIKit.lspkg/Scripts/Components/Content/ElementContent"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"

const ICON_NEXT = requireAsset("../Icons/skip_next.png") as Texture
const ICON_EXIT = requireAsset("../Icons/logout.png") as Texture
const PAD = 0.8
const GAP = 2.0

const FONT_SIZE_SCALE = 1.0
type TextRole = "HeadlineXL" | "Headline1"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  HeadlineXL: {size: 62, weight: 700}, Headline1: {size: 54, weight: 700},
}
function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}

@component
export class InsideFearNavUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">InsideFearNavUI – Next / Exit buttons that follow the user</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Label of the advance button")
  nextLabel: string = "Next"
  @input
  @hint("Label of the leave button (brief: 退 / Exit)")
  exitLabel: string = "Exit"
  @input
  @hint("Width of each button in cm (small: the panel must not hide the scene)")
  @widget(new SliderWidget(8, 25, 1))
  buttonWidthCm: number = 9
  @input
  @hint("Distance in cm at which the panel re-centers in front of the user")
  @widget(new SliderWidget(20, 200, 1))
  followDistanceCm: number = 80
  @input
  @hint("How far below the gaze the panel sits, cm at followDistanceCm (~22 at 80 cm ≈ 15° down: under the action, still in view)")
  @widget(new SliderWidget(0, 50, 1))
  dropCm: number = 22
  @input
  @hint("Visible when the Lens launches (normally off — shown by Main when inside)")
  startVisible: boolean = false
  @ui.group_end

  private wantVisible = false
  private ready = false
  private moving = true
  private _onNext = new Event<void>()
  private _onExit = new Event<void>()

  get onNext(): PublicApi<void> { return this._onNext.publicApi() }
  get onExit(): PublicApi<void> { return this._onExit.publicApi() }
  get visible(): boolean { return this.wantVisible }

  onAwake() {
    this.wantVisible = this.startVisible
    this.sceneObject.createComponent("Component.Canvas")
    const frame = this.sceneObject.createComponent(Frame.getTypeName()) as Frame
    frame.autoShowHide = false
    frame.autoScaleContent = false
    frame.allowScaling = false

    frame.onInitialized.add(() => {
      const btnH = this.buttonWidthCm * 0.5
      const w = this.buttonWidthCm * 2 + GAP + PAD * 2
      const h = btnH + PAD * 2
      frame.innerSize = new vec2(w, h)
      frame.padding = new vec2(PAD, PAD)
      frame.margin = 1   // default 4 cm glass margin made the panel hide the scene
      frame.showCloseButton = false
      frame.showFollowButton = false
      frame.setUseFollow(false)   // own lazy follow below the gaze (Frame's tag-along re-centres it on the scene)

      const content = global.scene.createSceneObject("Content")
      content.setParent(frame.contentTransform.getSceneObject())
      content.getTransform().setLocalPosition(new vec3(0, 0, 0.6))
      const row = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
      row.width = w
      row.height = -1
      row.direction = FlexDirection.Row
      row.justifyContent = FlexJustify.Center
      row.alignItems = FlexAlign.Center
      row.columnGap = GAP
      row.paddingTop = PAD; row.paddingBottom = PAD; row.paddingLeft = PAD; row.paddingRight = PAD

      const items = [
        this.makeButton(content, this.nextLabel, ICON_NEXT, btnH, () => this._onNext.invoke()),
        this.makeButton(content, this.exitLabel, ICON_EXIT, btnH, () => this._onExit.invoke()),
      ]
      row.onInitialized.add(() => row.addItems(items))   // rows built lazily need explicit registration, after layout init

      this.ready = true
      this.sceneObject.enabled = this.wantVisible   // LAST line (G3)
    })
    this.createEvent("UpdateEvent").bind(() => this.follow())
  }

  // Lazy follow: stay put until the slot drifts > 12° away, then glide there (~0.5 s); always face the user.
  private follow(): void {
    if (!this.ready || !this.wantVisible) return
    const cam = WorldCameraFinderProvider.getInstance().getTransform()
    const eye = cam.getWorldPosition()
    // slot = below the gaze in the head's own frame, so looking down at something never puts the panel on it
    const dir = cam.back.sub(cam.up.uniformScale(this.dropCm / this.followDistanceCm)).normalize()
    const goal = eye.add(dir.uniformScale(this.followDistanceCm))
    const t = this.sceneObject.getTransform()
    const a = t.getWorldPosition().sub(eye)
    const off = Math.acos(Math.max(-1, Math.min(1, a.normalize().dot(dir))))
    if (off > 12 * Math.PI / 180) this.moving = true
    if (this.moving) {
      t.setWorldPosition(vec3.lerp(t.getWorldPosition(), goal, 1 - Math.exp(-getDeltaTime() * 6)))
      if (t.getWorldPosition().distance(goal) < 1) this.moving = false
    }
    t.setWorldRotation(quat.lookAt(eye.sub(t.getWorldPosition()).normalize(), vec3.up()))
  }

  private makeButton(parent: SceneObject, label: string, icon: Texture, h: number, onClick: () => void): FlexItem {
    const so = global.scene.createSceneObject(label)
    so.setParent(parent)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(this.buttonWidthCm, h, 1)
    const ec = so.createComponent(ElementContent.getTypeName()) as ElementContent
    ec.text = label
    ec.textSize = roleSize("HeadlineXL")
    ec.leadingIcon = icon
    ec.iconLayout = "left"
    ec.leadingIconSize = 2.6
    ec.spacing = 0.8
    btn.onTriggerUp.add(onClick)
    return so.createComponent(FlexItem.getTypeName()) as FlexItem
  }

  setVisible(visible: boolean): void {
    if (visible && !this.wantVisible) this.moving = true
    this.wantVisible = visible
    if (this.ready) this.sceneObject.enabled = visible
  }
}
