import { v4 as uuidv4 } from "uuid"

import { Board } from "../types"

export const getId = (): string => {
  //might switch later to redux-toolkit nanoId
  return uuidv4()
}

//unused
export const getBoardData = (id: string) => {
  const item = localStorage.getItem(id)
  return item ? JSON.parse(item) : null // Return null or a default value if item is null
}

export const addBoard = (board: Board, id: string) => {
  localStorage.setItem(id, JSON.stringify(board))
}
