/**
 * @flow
 */

type GoogleAssistantUser = {
  user_id: string,
  profile: {
    given_name: string,
    family_name: string,
    display_name: string
  },
  access_token: string
}

type GoogleAssistantDevice = {
  location?: {
    coordinates: {
      latitude: number,
      longitude: number
    },
    formated_address?: string,
    city?: string,
    zip_code?: string
  }
}

type GoogleAssistantConversation = {
  conversation_id: string,
  type: 'TYPE_UNSPECIFIED' | 'NEW' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED' | 'ACTIVE',
  conversation_token: string
}

type GoogleAssistantRawInput = {
  query: string,
  create_time?: {
    seconds: number,
    nanos: number
  }
}

type GoogleAssistantInputArgument = {
  name: string,
  raw_text: string
  // todo missing some other things here
}

type GoogleAssistantInput = {
  intent: string,
  raw_inputs: GoogleAssistantRawInput[],
  arguments: GoogleAssistantInputArgument[]
}

export type GoogleAssistantRequest = {
  user: GoogleAssistantUser,
  device: GoogleAssistantDevice,
  conversation: GoogleAssistantConversation,
  inputs: GoogleAssistantInput[]
}

// note that must specify either ssml or test_to_speech
// can only contain ascii chars
type GoogleAssistantSpeechResponse = {
  text_to_speech?: string,
  ssml?: string
}

type GoogleAssistantInputPrompt = {
  initial_prompts?: GoogleAssistantSpeechResponse[],
  no_input_prompts?: GoogleAssistantSpeechResponse[]
}

type GoogleAssistantPermission = 'NAME' | 'DEVICE_PRECISE_LOCATION' | 'DEVICE_COARSE_LOCATION'

type GoogleAssistantExpectedIntent = {
  intent?: string,
  input_value_spec?: {
    permission_value_spec: {
      opt_context: string,
      permissions: GoogleAssistantPermission[]
    }
  }
}

type GoogleAssistantExpectedInput = {
  input_prompt: GoogleAssistantInputPrompt,
  possible_intents?: GoogleAssistantExpectedIntent[]
}

export type GoogleAssistantResponse = {
  conversation_token?: string,
  expect_user_response: boolean,
  expected_inputs?: GoogleAssistantExpectedInput[],
  final_response?: GoogleAssistantSpeechResponse
}
