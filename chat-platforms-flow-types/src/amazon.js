/**
 * @flow
 */

type AlexaUser = {
  userId: string,
  accessToken: ?string
}

type AlexaApplication = {
  applicationId: string
}

type AlexaSession = {
  new: boolean,
  sessionId: string,
  attributes: {
    [attr: string]: string
  },
  application: AlexaApplication,
  user: AlexaUser
}

type AlexaContext = {
  System: {
    apiAccessToken: string,
    apiEndpoint: string,
    application: AlexaApplication,
    device: {
      deviceId: string,
      // todo type up correctly
      supportedInterfaces: any
    }
  },
  AudioPlayer: {
    token: string,
    offsetInMilliseconds: number,
    playerActivity: string
  }
}

type AlexaLaunchRequest = {
  type: 'LaunchRequest',
  requestId: string,
  timestamp: string,
  locale: string
}

type AlexaConfirmationStatus = 'NONE' | 'CONFIRMED' | 'DENIED'

type AlexaResolutionValue = {
  value: {
    name: string,
    id: string
  }
}
type AlexaResolution = {
  authority: string,
  status: {
    code: 'ER_SUCCESS_MATCH' | 'ER_SUCCESS_NO_MATCH' | 'ER_ERROR_TIMEOUT' | 'ER_ERROR_EXCEPTION'
  },
  values: AlexaResolutionValue[]
}

type AlexaIntentRequest = {
  type: 'IntentRequest',
  requestId: string,
  timestamp: string,
  dialogState: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED',
  intent: {
    name: string,
    confirmationStatus: AlexaConfirmationStatus,
    slots: {
      [slot: string]: {
        name: string,
        value: string,
        confirmationStatus: AlexaConfirmationStatus,
        resolutions: {
          resolutionsPerAuthority: AlexaResolution[]
        }
      }
    }
  },
  locale: string
}

type AlexaSessionEndedRequest = {
  type: 'SessionEndedRequest',
  requestId: string,
  timestmap: string,
  reason: string,
  locale: string,
  error: {
    type: 'INVALID_RESPONSE' | 'DEVICE_COMMUNICATION_ERROR' | 'INTERNAL_ERROR',
    message: string
  }
}

export type AlexaRequest = {
  version: '1.0',
  session: AlexaSession,
  context: AlexaContext,
  request: AlexaLaunchRequest | AlexaIntentRequest | AlexaSessionEndedRequest
}

type AlexaOutputSpeech = {
  type: 'SSML' | 'PlainText',
  text?: string,
  ssml?: string
}

type AlexaCard = {
  type: 'Simple' | 'Standard' | 'LinkAccount',
  // not for LinkAccount
  title?: string,
  // for simple
  content?: string,
  // for standard
  text?: string,
  // for standard
  image?: {
    smallImageUrl?: string,
    largeImageUrl?: string
  }
}

type AlexaReprompt = {
  outputSpeech: AlexaOutputSpeech
}

// todo type up
type AlexaDirective = {

}

type AlexaResponseObject = {
  outputSeech?: AlexaOutputSpeech,
  card?: AlexaCard,
  reprompt?: AlexaReprompt,
  shouldEndSessions?: boolean,
  directives?: AlexaDirective[]
}

export type AlexaResponse = {
  version: '1.0',
  sessionAttributes?: { [key: string]: mixed },
  response: AlexaResponseObject
}
