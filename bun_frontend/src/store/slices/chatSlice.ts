import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { ChatMessage,SendMessageResponse } from "../../features/schemas/chatSchema"
import { v4 as uuid } from "uuid"

type ChatState = {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
}

const initialState: ChatState = {
  messages: [
    {
      id: uuid(),
      role: "assistant",
      content: "Hi 👋 How can I help you today?",
      created_at: new Date().toISOString()
    }
  ],
  loading: false,
  error: null
}

// ASYNC → backend call
export const sendChatMessage = createAsyncThunk<
  ChatMessage,
  string,
  { rejectValue: string }
>("chat/sendMessage", async (userMessage, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(
      "http://localhost:8000/api/chat/quick",
      {
        method: "POST",
        headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`, },
        body: JSON.stringify({ message: userMessage })
      }
    )
    if (!token) {
  return rejectWithValue("Not authenticated")
}

    if (!res.ok) {
      const errorText = await res.text()
      return rejectWithValue(errorText || "Server error")
    }

    const data = await res.json()

    // ✅ RETURN EXACT BACKEND OBJECT
    return data.assistant_message as ChatMessage
  } catch {
    return rejectWithValue("Network error")
  }
})




const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addUserMessage: (state, action: PayloadAction<string>) => {
      state.messages.push({
        id: crypto.randomUUID(),
        role: "user",
        content: action.payload,
        created_at: new Date().toISOString()
      })
    },
    resetChat: state => {
      state.messages = initialState.messages
      state.error = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(sendChatMessage.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false
        state.messages.push(action.payload)
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload|| "Failed to get response"

  state.messages.push({
    id: uuid(),
    role: "assistant",
    content: "⚠️ Sorry, something went wrong.",
    created_at: new Date().toISOString()
  }) 
      })
  }
})

export const { addUserMessage, resetChat } = chatSlice.actions
export default chatSlice.reducer
