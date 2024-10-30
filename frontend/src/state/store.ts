import { configureStore } from "@reduxjs/toolkit"

import { boardsApi } from "./apiSlice"

export const store = configureStore({
  reducer: {
    [boardsApi.reducerPath]: boardsApi.reducer
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(boardsApi.middleware)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
