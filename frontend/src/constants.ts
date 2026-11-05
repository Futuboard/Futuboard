export const cacheTagTypes = [
  "Boards",
  "Columns",
  "Ticket",
  "Users",
  "Action",
  "ActionList",
  "SwimlaneColumn",
  "BoardTemplate",
  "Scopes"
] as const

export const timeUnitOptions = ["minute", "hour", "day", "week", "month", "year"] as const

export const countUnitOptions = ["size", "cards"] as const

/** The board notes panel slides in from the left and pushes the board right by this much. */
export const BOARD_NOTES_OFFSET = 520
/** Duration (ms, "ease") of the notes panel slide and the board's move along with it. */
export const BOARD_NOTES_TRANSITION_MS = 400
