import { createSlice, PayloadAction } from "@reduxjs/toolkit"

//import { getId } from "@/services/Utils"

type ScopeState = { scopeId: string | null }// | { scopeId: null }

const initialState: ScopeState = { scopeId: null }

const scopeSlice = createSlice({
  name: "scope",
  initialState,
  reducers: {
    setScope: (_state: ScopeState, action: PayloadAction<{ scopeId: string }>) => {
      return action.payload
    },
    disableScope: (_state: ScopeState) => {
      return { scopeId: null }
    }
  }
})

export const scopeReducer = scopeSlice.reducer

export const { setScope, disableScope } = scopeSlice.actions
