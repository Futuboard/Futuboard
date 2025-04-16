import { v4 as uuidv4 } from "uuid"

import { BoardWithOnlyId, BoardWithOnlyIdAndTitle } from "../types"

export const getId = (): string => {
  //might switch later to redux-toolkit nanoId
  return uuidv4()
}

export const getVisitedBoards = (): BoardWithOnlyIdAndTitle[] => {
  const boardLinks = localStorage.getItem("visited-boards")
  return boardLinks ? JSON.parse(boardLinks) : []
}

export const addVisitedBoard = ({ boardid, title }: BoardWithOnlyIdAndTitle) => {
  const oldVisitedBoards: BoardWithOnlyIdAndTitle[] = JSON.parse(localStorage.getItem("visited-boards") || "[]").filter(
    (visitedBoard: BoardWithOnlyIdAndTitle) => visitedBoard.boardid !== boardid
  )
  const newVisitedBoards: BoardWithOnlyIdAndTitle[] = [{ boardid, title }].concat(oldVisitedBoards)
  localStorage.setItem("visited-boards", JSON.stringify(newVisitedBoards))
}

export const deleteVisitedBoard = ({ boardid }: BoardWithOnlyId) => {
  const visitedBoard: BoardWithOnlyIdAndTitle[] = JSON.parse(localStorage.getItem("visited-boards") || "[]").filter(
    (visitedBoard: BoardWithOnlyIdAndTitle) => visitedBoard.boardid !== boardid
  )
  localStorage.setItem("visited-boards", JSON.stringify(visitedBoard))
}

export const parseAcceptanceCriteriaFromDescription = (description: string | undefined): string[] => {
  if (description == undefined) return []
  const all: string[] = []

  description.split("\n").forEach((line) => {
    if (line.charAt(2) == "[" && line.charAt(4) == "]") {
      all.push(line)
    }
  })
  return all
}
