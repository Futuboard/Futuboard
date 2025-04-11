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

export const getIsInReadMode = (boardId: string | null | undefined) => {
  if (!boardId) return false
  const token = localStorage.getItem(`board-${boardId}-readmode`)
  return token === "true"
}

export const setIsInReadMode = (boardId: string, isInReadMode: boolean) => {
  localStorage.setItem(`board-${boardId}-readmode`, String(isInReadMode))
}

export const getAdminPassword = () => {
  return localStorage.getItem("admin-password")
}

export const setAdminPassword = (password: string) => {
  localStorage.setItem("admin-password", password)
}

export const authReducer = authSlice.reducer

export const { setBoardId } = authSlice.actions
