import { configureStore } from "@reduxjs/toolkit"

import { boardsApi } from "./apiSlice"
import { authReducer } from "./auth"
import { notificationReducer } from "./notification"
import { scopeReducer } from "./scope"

export const store = configureStore({
  reducer: {
    [boardsApi.reducerPath]: boardsApi.reducer,
    auth: authReducer,
    notification: notificationReducer,
    scope: scopeReducer
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(boardsApi.middleware)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
