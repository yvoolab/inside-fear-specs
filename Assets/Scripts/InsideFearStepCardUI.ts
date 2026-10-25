// InsideFearStepCardUI — the one-at-a-time narration text card (light text on a translucent plate).
// Owns: outlined title + body text (subtitle style, no plate), its visibility. Main positions the SceneObject and calls showStep/hide.
// Must not: know the step content or order — it renders whatever it is told.
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexAlignSelf, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {Billboard} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard"

const PAD = 1.5
const GAP = 0.6
const TITLE_H = 4.0

const FONT_SIZE_SCALE = 1.3   // step text read too small in the demo video (Del 2026-10-25)
type TextRole = "HeadlineXL" | "Headline2"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  HeadlineXL: {size: 62, weight: 700}, Headline2: {size: 48, weight: 500},
}
function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}
function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = roleSize(role, distanceCm)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

@component
export class InsideFearStepCardUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">InsideFearStepCardUI – narration text card</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Card width in cm")
  @widget(new SliderWidget(20, 70, 1))
  widthCm: number = 40
  @input
  @hint("Card height in cm")
  @widget(new SliderWidget(8, 30, 1))
  heightCm: number = 14
  @input('vec4', '{1,1,1,1}')
  @widget(new ColorWidget())
  @hint("Title text color (keep light — additive display)")
  titleColor: vec4
  @input('vec4', '{1,1,1,0.85}')
  @widget(new ColorWidget())
  @hint("Body text color")
  bodyColor: vec4
  @ui.group_end

  private titleText!: Text
  private bodyText!: Text
  private wantVisible = false
  private ready = false

  get visible(): boolean { return this.wantVisible }

  onAwake() {
    this.sceneObject.createComponent("Component.Canvas")
    this.sceneObject.createComponent(Billboard.getTypeName())
    // No backplate: the text reads like a subtitle, outlined, placed in the empty band above the scene (Del 2026-10-24)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.sceneObject)
    content.getTransform().setLocalPosition(new vec3(0, 0, 0.6))
    const flex = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.width = this.widthCm
    flex.height = this.heightCm
    flex.direction = FlexDirection.Column
    flex.alignItems = FlexAlign.Stretch
    flex.justifyContent = FlexJustify.Center
    flex.rowGap = GAP
    flex.paddingTop = PAD; flex.paddingBottom = PAD; flex.paddingLeft = PAD; flex.paddingRight = PAD

    const innerW = this.widthCm - PAD * 2
    const bodyH = this.heightCm - PAD * 2 - GAP - TITLE_H
    const title = this.makeText(content, "Title", "HeadlineXL", innerW, TITLE_H, this.titleColor, false)
    const body = this.makeText(content, "Body", "Headline2", innerW, bodyH, this.bodyColor, true)
    this.titleText = title.text
    this.bodyText = body.text
    flex.onInitialized.add(() => flex.addItems([title.item, body.item]))

    this.ready = true
    this.sceneObject.enabled = this.wantVisible   // LAST (G3)
  }

  private makeText(parent: SceneObject, name: string, role: TextRole, w: number, h: number, color: vec4, wrap: boolean) {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    const t = so.createComponent("Component.Text") as Text
    t.depthTest = true
    applyTextRole(t, role)
    t.textFill.color = color
    t.outlineSettings.enabled = true
    t.outlineSettings.size = 0.45
    t.outlineSettings.fill.color = new vec4(0.22, 0.12, 0.36, 1)   // keeps white text legible over the lavender dome
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = wrap ? HorizontalOverflow.Wrap : HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-w / 2, w / 2, -h / 2, h / 2)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideHeight = h
    return {text: t, item}
  }

  /** Replace whatever card is showing with this step's text and show it. */
  showStep(title: string, body: string): void {
    this.titleText.text = title
    this.bodyText.text = body
    this.setVisible(true)
  }

  hide(): void { this.setVisible(false) }

  private setVisible(visible: boolean): void {
    this.wantVisible = visible
    if (this.ready) this.sceneObject.enabled = visible
  }
}
