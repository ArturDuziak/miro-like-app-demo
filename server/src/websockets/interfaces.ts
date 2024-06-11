export enum WebSocketActions {
  UPDATE_CURSOR = 'update_cursor',
  CHAT_MESSAGE = 'chat_message',
}

type UpdateCursor = {
  action: WebSocketActions.UPDATE_CURSOR
  payload: UpdateCursorPayload
}

export type UpdateCursorPayload = {
  x: number
  y: number
}

type ChatMessage = {
  action: WebSocketActions.CHAT_MESSAGE
  payload: ChatMessagePayload
}

export type ChatMessagePayload = {
  message: string
}

export type WebSocketMessage =
  | UpdateCursor
  | ChatMessage
