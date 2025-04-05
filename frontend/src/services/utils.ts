import { v4 as uuidv4 } from "uuid"

import { Board, BoardWithOnlyIdAndTitle } from "../types"

export const getId = (): string => {
  //might switch later to redux-toolkit nanoId
  return uuidv4()
}

export const getBoardLinks = () => {
  const boardLinks = localStorage.getItem("visited-boards")
  return boardLinks ? JSON.parse(boardLinks) : []
}

export const addBoardLink = (board: Board) => {
  const oldVisitedBoards: BoardWithOnlyIdAndTitle[] = JSON.parse(localStorage.getItem("visited-boards") || "[]")
    .filter((visitedBoard: BoardWithOnlyIdAndTitle) => visitedBoard.boardid !== board.boardid) // updates board name if changed
  const newVisitedBoards: BoardWithOnlyIdAndTitle[] = [{ boardid: board.boardid, title: board.title }]
    .concat(oldVisitedBoards) // puts the last visited board first
  localStorage.setItem("visited-boards", JSON.stringify(newVisitedBoards))
}


//unused
export const getBoardData = (id: string) => {
  const item = localStorage.getItem(id)
  return item ? JSON.parse(item) : null // Return null or a default value if item is null
}

export const addBoard = (board: Board, id: string) => {
  localStorage.setItem(id, JSON.stringify(board))
}
