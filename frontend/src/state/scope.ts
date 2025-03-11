import { createSlice, PayloadAction } from "@reduxjs/toolkit"

//import { getId } from "@/services/Utils"

type ScopeState = { scopeId: string | null } // | { scopeId: null }

const initialState: ScopeState = { scopeId: "hello" } //{ scopeId: null }

const scopeSlice = createSlice({
  name: "scope",
  initialState,
  reducers: {
    setScope: (state: ScopeState, action: PayloadAction<{ scopeId: string }>) => {
      state.scopeId = action.payload.scopeId
    },
    disableScope: (state: ScopeState) => {
      state.scopeId = null
    }
  }
})

export const scopeReducer = scopeSlice.reducer

export const { setScope /* disableScope */ } = scopeSlice.actions
