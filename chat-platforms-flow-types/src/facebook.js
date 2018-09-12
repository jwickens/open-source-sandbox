/**
 * @flow
 */

// Flow wont check these, but it helps for reading the type to understand
// which type of id facebook is using
export type FacebookPageScopedId = string
export type FacebookAppScopedId = string

export type FacebookPaginatedResponse<N> = {
  data: Array<N>,
  paging?: {
    cursors: {
      after: string,
      before: string
    },
    previous?: string,
    next?: string
  }
}

export type FacebookPageOutput = {
  id: string,
  name: string,
  isAdmin: boolean,
  pictureUrl: string,
  channelId: ?string
}

export type FacebookVerificationRequestQueryParams = {
  'hub.mode': 'subscribe',
  'hub.challenge': string,
  'hub.verify_token': string
}

export type FacebookPageRecord = {
  id: string,
  channelId: string,
  pageId: string,
  pageAccessToken: string,
  createdAt: Date,
  updatedAt: Date
}

export type FacebookSubscriptionRecord = {
  id: string,
  webhookId: string,
  verifyToken: string,
  domainName: string,
  createdAt: Date,
  updatedAt: Date
}

export type FacebookPicture = {
  data: {
    height: number,
    width: number,
    url: string
  }
}

export type FacebookPageRawForDisplay = {
  name: string,
  id: string,
  perms: string[],
  picture: FacebookPicture
}

export type FacebookPageInfo = {
  id: string,
  name: string,
  picture: FacebookPicture
}

export type UserToPageScopedIdEdge = {
  id: FacebookPageScopedId,
  page: {
    name: string,
    id: string
  }
}

export type FacebookPageUser = {
  id: FacebookPageScopedId,
  name: string,
  first_name: string,
  last_name: string,
  profile_pic: string,
  locale: string,
  gender: string,
  is_payment_enabled: boolean,
  timezone: string
}

export type FacebookSender = {
  id: FacebookPageScopedId
}

export type FacebookMultimedia = {
  url: string
}

export type FacebookLocation = {
  cordinates: {
    lat: number,
    long: number
  }
}

export type FacebookAttachment = {
  type: 'audio' | 'fallback' | 'file' | 'image' | 'location' | 'video',
  payload: FacebookMultimedia | FacebookLocation
}

export type FacebookMessage = {
  mid: string,
  app_id?: string,
  is_echo?: boolean,
  text?: string,
  seq: number,
  attachments?: FacebookAttachment[],
  quick_reply?: any,
  sticker_id?: number
}

export type FacebookRecipient = {
  id?: string,
  phone_number?: string,
  user_ref?: string,
  name?: { first_name: string, last_name: string }
}

export type FacebookReferral = {
  ref: string,
  source: string
}

export type FacebookPostback = {
  referral?: FacebookReferral,
  payload: string
}

export type FacebookUpdateRequest = {
  sender: FacebookSender,
  recipient: FacebookRecipient,
  message?: FacebookMessage,
  location?: FacebookLocation,
  referral?: FacebookReferral,
  postback?: FacebookPostback
}

export type FacebookUpdateNotification = {
  object: 'user' | 'page' | 'permisssions' | 'payments',
  entry: Array<{
    id: string,
    messaging?: FacebookUpdateRequest[],
    time: number
  }>
}

export type FacebookMessageInput = {
  text?: string,
  attachments?: FacebookAttachment[],
  quick_reply?: any,
  metadata?: string
}

export type FacebookMessageRequest = {
  messaging_type: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' | 'NON_PROMOTIONAL_SUBSCRIPTION',
  recipient: FacebookRecipient,
  message?: FacebookMessageInput,
  sender_action?: 'typing_on' | 'typing_off' | 'mark_seen',
  notification_type?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH',
  tag?: string
}

export type FacebookMessageResponse = {
  recipient_id: string,
  message_id: string
}

export type FacebookTestUser = {
  id: string,
  access_token: string,
  login_url: string,
  email: string,
  password: string
}

// this is from a graph request, not sub
export type FacebookMessagingUser = {
  name: string,
  email: string,
  id: FacebookAppScopedId,
  community: {}
}

// this is from a graph request, not sub
export type FacebookConversation = {
  // senders: FacebookPaginatedResponse<FacebookMessagingUser>,
  // participants: FacebookPaginatedResponse<FacebookVerificationRequestQueryParams>,
  // snippet: string,
  id: string,
  updated_time: string,
  message_count: number,
  can_reply: boolean
}

// this is from a graph request, not webhook subscription
export type FacebookGraphMessage = {
  id: string,
  message: string,
  to: FacebookMessagingUser,
  from: FacebookMessagingUser,
  created_time: string,
  tags: {
    data: Array<{ name: string }>
  }
}
