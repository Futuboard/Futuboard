import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type ScopeState = string

const initialState: ScopeState = ""

const scopeSlice = createSlice({
  name: "scope",
  initialState,
  reducers: {
    setScope: (_state: ScopeState, action: PayloadAction<string>) => {
      return action.payload
    },
    disableScope: () => {
      return ""
    }
  }
})

export const scopeReducer = scopeSlice.reducer

export const { setScope, disableScope } = scopeSlice.actions
