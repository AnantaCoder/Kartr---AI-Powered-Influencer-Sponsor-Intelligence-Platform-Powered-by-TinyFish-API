export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  created_at?: string
}

export type SendMessageResponse = {
  success: boolean
  user_message: ChatMessage
  assistant_message: ChatMessage
}
