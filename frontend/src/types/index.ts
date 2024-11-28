export type Board = {
  id: string
  title: string
  password: string
  columns: Column[]
  users: User[]
}

export type Column = {
  columnid: string
  title: string
  boardid: string
  swimlane?: boolean
  wip_limit?: number | null
  wip_limit_story?: number | null
}

export type ColumnData = {
  columnTitle: string
  swimlane: boolean
}

export type Task = {
  ticketid: string
  title: string
  description?: string
  cornernote?: string
  color?: string
  caretakers?: User[]
  size?: number
  columnid: string
  users: UserWithoutTicketsOrActions[]
}

export type NewTask = Omit<Task, "users">

export type User = {
  userid: string
  name: string
  tickets: string[]
  actions: string[]
}

export type UserWithoutTicketsOrActions = Omit<User, "tickets" | "actions">

export type NewBoardFormData = {
  title: string
  password: string
}

export type NewBoardFormImport = {
  title: string
  password: string
  file: FileList
}

export type NewBoardPassword = {
  old_password: string
  new_password: string
  confirm_password: string
}

export type Action = {
  columnid: string
  actionid: string
  ticketid: string
  swimlanecolumnid: string
  title: string
  order: number
  creation_date: string
  users: UserWithoutTicketsOrActions[]
}

export type NewAction = Omit<Action, "users" | "creation_date">

export type SwimlaneColumn = {
  swimlanecolumnid: string
  title: string
  columnid: string
  order: number
}

type Tag = "Boards" | "Columns" | "Ticket" | "Users" | "Action" | "ActionList" | "SwimlaneColumn"

export type CacheInvalidationTag =
  | {
      type: Tag
      id?: string
    }
  | Tag
