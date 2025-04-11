import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export const getToken = (boardId: string) => {
  const token = localStorage.getItem(`board-${boardId}-token`)
  return token
}

export const setToken = ({ token, boardId }: { token: string; boardId: string }) => {
  localStorage.setItem(`board-${boardId}-token`, token)
}

export const logOutOfBoard = (boardId: string) => {
  setToken({ token: "", boardId })
}

export const getAuth = (boardId: string) => {
  const token = getToken(boardId)
  return token ? `Bearer ${token}` : null
}

type AuthState = {
  boardId: string | null
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    boardId: ""
  },
  reducers: {
    setBoardId: (state: AuthState, action: PayloadAction<string>) => {
      state.boardId = action.payload
    }
  }
})

export const getAdminPassword = () => {
  return localStorage.getItem("admin-password")
}

export const setAdminPassword = (password: string) => {
  localStorage.setItem("admin-password", password)
}

export const authReducer = authSlice.reducer

export const { setBoardId } = authSlice.actions
