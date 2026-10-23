// InsideFearBigButtonUI — one large, billboarded UIKit Button (used for both Start and Enter).
// Owns: the button visual, its label/icon, and its own visibility.
// Expects: @input label / icon / size; Main wires `onPressed` and calls setVisible().
// Must not: hold experience state or decide what a press means.
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {ElementContent} from "SpectaclesUIKit.lspkg/Scripts/Components/Content/ElementContent"
import {Billboard} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"

// ── Typography (Specs type scale, em-square sizes calibrated at z=-110) ─────
const FONT_SIZE_SCALE = 1.0
type TextRole = "Title1" | "HeadlineXL"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700}, HeadlineXL: {size: 62, weight: 700},
}
function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}

@component
export class InsideFearBigButtonUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">InsideFearBigButtonUI – one large pinchable button</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Text shown on the button face")
  label: string = "Start"
  @input
  @allowUndefined
  @hint("Optional leading icon texture (Assets/Icons/*.png)")
  icon: Texture | null = null
  @input
  @hint("Button width in cm (brief: about 20 cm)")
  @widget(new SliderWidget(10, 40, 1))
  widthCm: number = 20
  @input
  @hint("Button height in cm")
  @widget(new SliderWidget(4, 16, 0.5))
  heightCm: number = 7
  @input
  @hint("Visible when the Lens launches")
  startVisible: boolean = true
  @ui.group_end

  private btn!: Button
  private wantVisible = true
  private ready = false
  private _onPressed = new Event<void>()

  /** Fires on pinch/click release. */
  get onPressed(): PublicApi<void> { return this._onPressed.publicApi() }
  get visible(): boolean { return this.wantVisible }

  onAwake() {
    this.wantVisible = this.startVisible
    this.sceneObject.createComponent("Component.Canvas")
    this.sceneObject.createComponent(Billboard.getTypeName())
    this.btn = this.sceneObject.createComponent(Button.getTypeName()) as Button
    this.btn.size = new vec3(this.widthCm, this.heightCm, 1)
    // Companion-mode ElementContent: the button face has nothing else, so text+icon in one is safe (R1).
    const ec = this.sceneObject.createComponent(ElementContent.getTypeName()) as ElementContent
    ec.text = this.label
    ec.textSize = roleSize("Title1")   // big buttons read from 1 m; Title1 = 2.4 cm em-square
    if (this.icon) {
      ec.leadingIcon = this.icon
      ec.iconLayout = "left"
      ec.leadingIconSize = 3.2
      ec.spacing = 1.0
    }
    this.btn.onTriggerUp.add(() => this._onPressed.invoke())
    // Start-hidden rule (G3): apply visibility only after the Element initialized, as the LAST step.
    this.btn.onInitialized.add(() => {
      this.ready = true
      this.sceneObject.enabled = this.wantVisible
    })
  }

  setVisible(visible: boolean): void {
    this.wantVisible = visible
    if (this.ready) this.sceneObject.enabled = visible
  }
}
