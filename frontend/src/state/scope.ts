import { createSlice, PayloadAction } from "@reduxjs/toolkit"

//import { getId } from "@/services/Utils"

type ScopeState = string

const initialState: ScopeState = ""

const scopeSlice = createSlice({
  name: "scope",
  initialState,
  reducers: {
    setScope: (_state: ScopeState, action: PayloadAction<string>) => {
      return action.payload
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    disableScope: (_state: ScopeState) => {
      return ""
    }
  }
})

export const scopeReducer = scopeSlice.reducer

export const { setScope, disableScope } = scopeSlice.actions
