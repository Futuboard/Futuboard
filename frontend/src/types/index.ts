import { cacheTagTypes, timeUnitOptions } from "@/constants"

export type Board = {
  boardid: string
  title: string
  background_color: string
  password: string
  columns: Column[]
  users: User[]
  default_ticket_title?: string
  default_ticket_description?: string
  default_ticket_cornernote?: string
  default_ticket_color?: string
  default_ticket_size?: number
  notes: string
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
  scopes: SimpleScope[]
}

export type NewTask = Omit<Task, "users" | "scopes">

export type TaskTemplate = Omit<Task, "ticketid" | "columnid" | "users" | "scopes">

export type TaskSize = {
  ticketid: string
  size: number
}

export type User = {
  userid: string
  name: string
  tickets: string[]
  actions: string[]
}

export type UserWithoutTicketsOrActions = Omit<User, "tickets" | "actions">

export type NewBoardType = "empty" | "import" | "template"

export type NewBoardFormData = {
  title: string
  password: string
  boardType: NewBoardType
  boardTemplateId?: string
  file?: FileList
}

export type NewBoardFormImport = {
  title: string
  password: string
  file: FileList
}

export type BoardTitleChangeFormData = {
  title: string
}

export type PasswordChangeFormData = {
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
  ordernum: number
}

type Tag = (typeof cacheTagTypes)[number]

export type CacheInvalidationTag =
  | {
      type: Tag
      id?: string
    }
  | Tag

export type BoardTemplate = {
  boardtemplateid: string
  boardid: string
  title: string
  description: string
}

export type NewBoardTemplate = Omit<BoardTemplate, "boardtemplateid">

export type ChartData = {
  columns: string[]
  data: { [key: string]: number }[]
}

export type TimeUnit = (typeof timeUnitOptions)[number]

export type Scope = {
  scopeid: string
  boardid: string
  title: string
  creation_date: string
  forecast_set_date: string
  forecast_size: number
  forecast_tickets: TaskSize[]
  done_columns: Column[]
  tickets: TaskSize[]
}

export type SimpleScope = {
  scopeid: string
  title: string
}
