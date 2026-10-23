import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {Criterion1StartScenario} from "./Criterion1StartScenario"
import {Criterion2EnterScenario} from "./Criterion2EnterScenario"
import {Criterion3NextScenario} from "./Criterion3NextScenario"
import {Criterion4FadeScenario} from "./Criterion4FadeScenario"
import {Criterion5ExitScenario} from "./Criterion5ExitScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "criterion-1-start", typename: Criterion1StartScenario.getTypeName()},
    {id: "criterion-2-enter", typename: Criterion2EnterScenario.getTypeName()},
    {id: "criterion-3-next", typename: Criterion3NextScenario.getTypeName()},
    {id: "criterion-4-fade", typename: Criterion4FadeScenario.getTypeName()},
    {id: "criterion-5-exit", typename: Criterion5ExitScenario.getTypeName()},
  ]
}
