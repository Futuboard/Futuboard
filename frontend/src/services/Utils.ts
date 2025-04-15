import { v4 as uuidv4 } from "uuid"

export const getId = (): string => {
  //might switch later to redux-toolkit nanoId
  return uuidv4()
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
