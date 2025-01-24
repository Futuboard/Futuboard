import { AlertColor } from "@mui/material/Alert"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type NotificationState = {
  text: string
  type: string // actually AlertColor
}

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    text: "",
    type: "info"
  },
  reducers: {
    setNotification: (state: NotificationState, action: PayloadAction<{ text: string; type: AlertColor }>) => {
      state.text = action.payload.text
      state.type = action.payload.type
    }
  }
})

export const notificationReducer = notificationSlice.reducer

export const { setNotification } = notificationSlice.actions
