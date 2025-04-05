import { AlertColor } from "@mui/material/Alert"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import { getId } from "@/services/utils"

type NotificationState = {
  text: string
  type: string // actually AlertColor
  id: string
}

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    text: "",
    type: "info",
    id: ""
  },
  reducers: {
    setNotification: (state: NotificationState, action: PayloadAction<{ text: string; type: AlertColor }>) => {
      state.text = action.payload.text
      state.type = action.payload.type
      state.id = getId()
    }
  }
})

export const notificationReducer = notificationSlice.reducer

export const { setNotification } = notificationSlice.actions
