/**
 * @flow
 */

type GenericTextOutput = {
  values: Array<{text: string}>,
  response_type: 'text',
  selection_policy: 'sequential'
}

type GenericOptionOutput = {
  title: string,
  options: string[],
  description: string,
  response_type: 'option'
}

type GenericPauseOutput = {
  time: number,
  typing: boolean,
  response_type: 'pause'
}

type GenericImageOutput = {
  source: string,
  response_type: 'image',
  description: string
}

export type GenericOutput = GenericTextOutput |
  GenericOptionOutput |
  GenericPauseOutput |
  GenericImageOutput

export type NodeOutput = {
  text?: {
    values: string[],
    selection_policy: 'sequential'
  } | string,
  generic?: GenericOutput[]
}

export type NodeNextStep = {
  // (If Jump_to we insert directly, if reprompt we use next, not sure about skip_all_slots)
  behavior: 'jump_to' | 'reprompt' | 'skip_all_slots',
  // if condition we go to header otherwise body
  selector: 'conditon' | 'body',
  dialog_node: string
}

export type NodeContext = {
  [contextName: string]: string
}

export type WatsonNode = {
  type: 'standard' | 'response_condition' | 'folder' | 'frame' | 'event_handler',
  title: ?string,
  output: NodeOutput,
  parent: string,
  context?: NodeContext,
  next_step: ?NodeNextStep,
  conditions: string,
  dialog_node: string,
  digress_in?: 'does_not_return' | 'returns',
  digress_out?: 'allow_all', // todo missing enum (this is translated as a next if its anything but allow_all)
  previous_sibling: string
}

export type EntityValueSynonyms = {
  type: 'synonyms',
  value: string,
  metadata: any,
  fuzzy_match: boolean,
  synonyms: string[]
}

export type EntityValuePaterns = {
  type: 'patterns',
  value: string,
  metadata: any,
  patterns: string[]
}

export type EntityValue = EntityValuePaterns | EntityValueSynonyms

export type WatsonEntity = {
  entity: string,
  values: EntityValue[],
  metadata: any,
  description: ?string
}

export type WatsonIntent = {
  intent: string,
  description: string,
  examples: Array<{text: string}>
}

export type WatsonWorkspace = {
  name: string,
  description: string,
  language: string,
  workspace_id: string,
  counterExamples: Array<{text: string}>,
  intents: WatsonIntent[],
  entities: WatsonEntity[],
  dialog_nodes: WatsonNode[]
}
