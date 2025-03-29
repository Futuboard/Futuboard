import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import { SimpleScope } from "@/types"

type ScopeState = SimpleScope | null

const scopeSlice = createSlice({
  name: "scope",
  initialState: null as ScopeState,
  reducers: {
    setScope: (_state: ScopeState, action: PayloadAction<SimpleScope>) => {
      return action.payload
    },
    disableScope: () => {
      return null
    }
  }
})

export const scopeReducer = scopeSlice.reducer

export const { setScope, disableScope } = scopeSlice.actions
