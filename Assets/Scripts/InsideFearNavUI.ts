// InsideFearNavUI — head-following Frame with the two interior buttons: Next and "退 / Exit".
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

const ICON_NEXT = requireAsset("../Icons/skip_next.png") as Texture
const ICON_EXIT = requireAsset("../Icons/logout.png") as Texture
const PAD = 1.5
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
  exitLabel: string = "退 / Exit"
  @input
  @hint("Width of each button in cm (brief: about 15 cm)")
  @widget(new SliderWidget(8, 25, 1))
  buttonWidthCm: number = 15
  @input
  @hint("Distance in cm at which the panel re-centers in front of the user")
  @widget(new SliderWidget(20, 200, 1))
  followDistanceCm: number = 60
  @input
  @hint("Visible when the Lens launches (normally off — shown by Main when inside)")
  startVisible: boolean = false
  @ui.group_end

  private wantVisible = false
  private ready = false
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
      frame.showCloseButton = false
      frame.showFollowButton = false
      frame.tagAlongDistance = this.followDistanceCm
      frame.setUseFollow(true)
      frame.setFollowing(true)

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
    this.wantVisible = visible
    if (this.ready) this.sceneObject.enabled = visible
  }
}
