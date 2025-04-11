import { AlertColor } from "@mui/material/Alert"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import { getId } from "@/services/Utils"

type NotificationState = {
  text: string
  type: string // actually AlertColor
  id: string
  duration: number
}

const defaultDuration = 5000 // 5 seconds

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    text: "",
    type: "info",
    id: "",
    duration: defaultDuration
  },
  reducers: {
    setNotification: (
      state: NotificationState,
      action: PayloadAction<{ text: string; type: AlertColor; duration?: number }>
    ) => {
      state.text = action.payload.text
      state.type = action.payload.type
      state.duration = action.payload.duration || defaultDuration
      state.id = getId()
    }
  }
})

export const notificationReducer = notificationSlice.reducer

export const { setNotification } = notificationSlice.actions
