import { MutationLifecycleApi } from "@reduxjs/toolkit/dist/query/endpointDefinitions"
import {
  BaseQueryApi,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  TagDescription,
  createApi,
  fetchBaseQuery
} from "@reduxjs/toolkit/query/react"

import { cacheTagTypes } from "@/constants"
import {
  Action,
  Board,
  CacheInvalidationTag,
  Column,
  NewAction,
  NewTask,
  SwimlaneColumn,
  Task,
  User,
  UserWithoutTicketsOrActions,
  PasswordChangeFormData,
  NewBoardFormData,
  BoardTemplate,
  NewBoardTemplate,
  TaskTemplate,
  ChartData,
  SimpleScope,
  Scope
} from "@/types"

import { getAdminPassword, getAuth, getIsInReadMode, logOutOfBoard, setToken } from "./auth"
import { setNotification } from "./notification"
import { RootState } from "./store"
import { webSocketContainer } from "./websocket"

const isLoggedInWithReadOnly = (
  api: MutationLifecycleApi<unknown, BaseQueryFn, unknown, "boardsApi"> | BaseQueryApi
) => {
  const boardId = (api.getState() as RootState)?.auth?.boardId
  if (!boardId) return false
  return getIsInReadMode(boardId)
}

const invalidateRemoteCache = (tags: CacheInvalidationTag[]) => {
  webSocketContainer.invalidateCacheOfOtherUsers(tags)
  return tags
}

// TODO: type this better
const updateCache = (
  endpointName: Parameters<typeof boardsApi.util.updateQueryData>[0],
  tagsToInvalidate: CacheInvalidationTag[],
  updateFunction: Parameters<typeof boardsApi.util.updateQueryData>[2],
  apiActions: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  onCacheMiss?: () => void
) => {
  const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), tagsToInvalidate)
  const cache = cacheList.find((cache) => cache.endpointName === endpointName)

  if (cache) {
    apiActions.dispatch(boardsApi.util.updateQueryData(endpointName, cache.originalArgs, updateFunction))
  } else if (onCacheMiss) {
    onCacheMiss()
  }
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_DB_ADDRESS,

  prepareHeaders: (headers, { getState }) => {
    const boardId = (getState() as RootState).auth.boardId
    if (boardId) {
      const auth = getAuth(boardId)
      if (auth) {
        headers.set("Authorization", auth)
      }
    }
    return headers
  }
})

const baseQueryWithErrorHandling: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await baseQuery(args, api, extraOptions)
  const tokenIsInvalid = result.error && result.error.status === 401
  const boardId = (api.getState() as RootState).auth.boardId

  const url = typeof args === "string" ? args : args.url

  const isUpdatePasswordRequest = url.includes("password") && url.includes("boards")
  const isBoardTemplateRequest = url.includes("boardtemplates")

  if (tokenIsInvalid && !isUpdatePasswordRequest && !isBoardTemplateRequest) {
    if (isLoggedInWithReadOnly(api)) {
      api.dispatch(
        setNotification({
          text: "No changes allowed in read-only mode.",
          type: "warning",
          duration: 5000
        })
      )
    } else {
      logOutOfBoard(boardId)
      api.dispatch(boardsApi.util.resetApiState())
      api.dispatch(
        setNotification({
          text: "Your login expired or was invalid, so you were logged out.",
          type: "warning",
          duration: 60000
        })
      )
    }
  }

  /*
  Django sometimes gives errors in HTML, so this cant really be used
  
  if (result.error) {
    const errorMessage = (result.error.data as string) || "An unknown error occurred"
    api.dispatch(setNotification({ text: errorMessage, type: "error", duration: 10000 }))
  }
  */

  return result
}

export const boardsApi = createApi({
  reducerPath: "boardsApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: cacheTagTypes,

  endpoints: (builder) => ({
    getBoard: builder.query<Board, string>({
      query: (boardId) => `boards/${boardId}/`,
      providesTags: ["Boards"]
    }),

    addBoard: builder.mutation<Board, { title: string; password: string }>({
      query: (boardData) => {
        return {
          url: "boards/",
          method: "POST",
          body: boardData
        }
      },
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),

    importBoard: builder.mutation<Board, FormData>({
      query: (formData) => {
        return {
          url: "import/",
          method: "POST",
          body: formData
        }
      },
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),

    getBoardTemplates: builder.query<BoardTemplate[], void>({
      query: () => "boardtemplates/",
      providesTags: ["BoardTemplate"]
    }),

    addBoardTemplate: builder.mutation<BoardTemplate, NewBoardTemplate>({
      query: (newBoardTemplate) => {
        const password = getAdminPassword()
        return {
          url: "boardtemplates/",
          method: "POST",
          body: { ...newBoardTemplate, password }
        }
      },
      invalidatesTags: ["BoardTemplate"]
    }),

    deleteBoardTemplate: builder.mutation<BoardTemplate, string>({
      query: (boardtemplateid) => {
        const password = getAdminPassword()
        return {
          url: `boardtemplates/`,
          method: "DELETE",
          body: { boardtemplateid, password }
        }
      },
      invalidatesTags: ["BoardTemplate"]
    }),

    createBoardFromTemplate: builder.mutation<Board, NewBoardFormData>({
      query: ({ title, password, boardTemplateId }) => {
        return {
          url: `boardtemplates/${boardTemplateId}/`,
          method: "POST",
          body: { title, password }
        }
      },
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),

    deleteBoard: builder.mutation<Board, string>({
      query: (boardId) => ({
        url: `boards/${boardId}/`,
        method: "DELETE"
      }),
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),

    updateBoardTitle: builder.mutation<Board, { boardId: string; newTitle: string }>({
      query: ({ boardId, newTitle }) => ({
        url: `boards/${boardId}/title/`,
        method: "PUT",
        body: { title: newTitle }
      }),
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),

    updateBoardPassword: builder.mutation<Board, { boardId: string; newPassword: PasswordChangeFormData }>({
      query: ({ boardId, newPassword }) => ({
        url: `boards/${boardId}/password/`,
        method: "PUT",
        body: newPassword
      }),
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),

    updateBoardColor: builder.mutation<Board, { boardId: string; newColor: string }>({
      query: ({ boardId, newColor }) => ({
        url: `boards/${boardId}/`,
        method: "PUT",
        body: { background_color: newColor }
      }),
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),

    updateTaskTemplate: builder.mutation<Board, { boardId: string; newTaskTemplate: TaskTemplate }>({
      query: ({ boardId, newTaskTemplate }) => ({
        url: `boards/${boardId}/ticket_template/`,
        method: "PUT",
        body: newTaskTemplate
      }),
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),
    updateBoardNotes: builder.mutation<Board, { boardId: string; notes: string }>({
      query: ({ boardId, notes }) => ({
        url: `boards/${boardId}/notes`,
        method: "PUT",
        body: { notes: notes }
      }),
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),
    getColumnsByBoardId: builder.query<Column[], string>({
      query: (boardid) => `boards/${boardid}/columns/`,
      providesTags: [{ type: "Columns", id: "LIST" }]
    }),

    getTaskListByColumnId: builder.query<Task[], { columnId: string }>({
      query: ({ columnId }) => {
        return `columns/${columnId}/tickets`
      },
      providesTags: (result, _error, args) => {
        const tags: TagDescription<"Ticket" | "Users">[] = []
        if (result) {
          const tasks: Task[] = result
          const taggedUsers: string[] = []
          tasks.forEach((task) => {
            tags.push({ type: "Ticket", id: task.ticketid })
            tags.push({ type: "Users", id: task.ticketid })
            task.users.forEach((user) => {
              if (!taggedUsers.includes(user.userid)) {
                tags.push({ type: "Users", id: user.userid })

                taggedUsers.push(user.userid)
              }
            })
          })
        }
        return [{ type: "Columns", id: args.columnId }, ...tags]
      }
    }),

    addColumn: builder.mutation<Column, { boardId: string; column: Column }>({
      query: ({ boardId, column }) => ({
        url: `boards/${boardId}/columns/`,
        method: "POST",
        body: column
      }),
      onQueryStarted({ column }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const invalidationTags: CacheInvalidationTag[] = [{ type: "Columns", id: "LIST" }]
        updateCache(
          "getColumnsByBoardId",
          invalidationTags,
          (draft) => {
            const columns = draft as Column[]
            columns.push(column)
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(invalidationTags)
          apiActions.dispatch(boardsApi.util.invalidateTags(invalidationTags))
        })
      }
    }),

    addTask: builder.mutation<Task, { columnId: string; task: NewTask }>({
      query: ({ columnId, task }) => ({
        url: `columns/${columnId}/tickets`,
        method: "POST",
        body: task
      }),
      onQueryStarted({ task }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const invalidationTags: CacheInvalidationTag[] = [
          { type: "Ticket", id: "LIST" },
          { type: "Columns", id: task.columnid }
        ]
        updateCache(
          "getTaskListByColumnId",
          invalidationTags,
          (draft) => {
            const taskList = draft as Task[]
            taskList.unshift({ ...task, users: [], scopes: [], size: task.size || 0 })
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(invalidationTags)
          apiActions.dispatch(boardsApi.util.invalidateTags(invalidationTags))
        })
      }
    }),

    updateTask: builder.mutation<Task, { task: NewTask }>({
      query: ({ task }) => ({
        url: `tickets/${task.ticketid}/`,
        method: "PUT",
        body: task
      }),
      invalidatesTags: (_result, _error, { task }) =>
        invalidateRemoteCache([
          { type: "Ticket", id: task.ticketid },
          { type: "Ticket", id: "LIST" }
        ])
    }),

    deleteTask: builder.mutation<Task, { task: Task }>({
      query: ({ task }) => ({
        url: `tickets/${task.ticketid}/`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, { task }) =>
        invalidateRemoteCache([
          { type: "Ticket", id: task.ticketid },
          { type: "Ticket", id: "LIST" }
        ])
    }),

    updateColumn: builder.mutation<Column, { column: Column; ticketIds?: string[] }>({
      query: ({ column, ticketIds }) => ({
        url: `columns/${column.columnid}/`,
        method: "PUT",
        body: { ...column, ticket_ids: ticketIds }
      }),
      invalidatesTags: () => invalidateRemoteCache(["Columns"])
    }),

    updateColumnOrder: builder.mutation<Column[], { boardId: string; columns: Column[] }>({
      query: ({ boardId, columns }) => ({
        url: `boards/${boardId}/columns/`,
        method: "PUT",
        body: columns
      }),
      //update optimistically
      onQueryStarted({ columns }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const invalidationTags: CacheInvalidationTag[] = [{ type: "Columns", id: "LIST" }]
        updateCache(
          "getColumnsByBoardId",
          invalidationTags,
          () => {
            return columns
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(invalidationTags)
          boardsApi.util.invalidateTags(invalidationTags)
        })
      }
    }),

    deleteColumn: builder.mutation<Column, { column: Column }>({
      query: ({ column }) => ({
        url: `columns/${column.columnid}/`,
        method: "DELETE"
      }),
      invalidatesTags: () => invalidateRemoteCache([{ type: "Columns", id: "LIST" }])
    }),

    updateTaskListByColumnId: builder.mutation<Task[], { columnId: string; tasks: Task[] }>({
      query: ({ columnId, tasks }) => ({
        url: `columns/${columnId}/tickets`,
        method: "PUT",
        body: tasks
      }),
      //update optimistically
      async onQueryStarted({ columnId, tasks }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [
          { type: "Columns", id: columnId },
          { type: "Ticket", id: "LIST" },
          { type: "Scopes", id: "LIST" }
        ]

        const patchResult = apiActions.dispatch(
          boardsApi.util.updateQueryData("getTaskListByColumnId", { columnId }, () => {
            return tasks.map((task) => ({
              ...task,
              columnid: columnId
            }))
          })
        )
        try {
          await apiActions.queryFulfilled
          invalidateRemoteCache([...tagsToInvalidate])
          apiActions.dispatch(boardsApi.util.invalidateTags([{ type: "Scopes", id: "LIST" }]))
        } catch {
          patchResult.undo()
          apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        }
      }
    }),

    getUsersByBoardId: builder.query<User[], string>({
      query: (boardId) => `boards/${boardId}/users/`,
      providesTags: [{ type: "Users", id: "ALL_USERS" }]
    }),

    postUserToBoard: builder.mutation<User, { boardId: string; user: Omit<UserWithoutTicketsOrActions, "userid"> }>({
      query: ({ boardId, user }) => ({
        url: `boards/${boardId}/users/`,
        method: "POST",
        body: user
      }),
      invalidatesTags: () => invalidateRemoteCache([{ type: "Users", id: "ALL_USERS" }])
    }),

    login: builder.mutation<{ success: boolean; token: string }, { boardId: string; password: string }>({
      query: ({ boardId, password }) => ({
        url: `boards/${boardId}/`,
        method: "POST",
        body: { boardId, password },
        responseHandler: async (response) => {
          const data = await response.json()
          const { token, success } = data
          if (success && token) {
            setToken({ token, boardId })
          }
          return data
        }
      })
    }),

    postUserToTicket: builder.mutation<User, { ticketId: string; userid: string }>({
      query: ({ ticketId, userid }) => ({
        url: `tickets/${ticketId}/users/`,
        method: "POST",
        body: { userid }
      }),
      //update optimistically
      onQueryStarted({ ticketId, userid }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [
          { type: "Users", id: ticketId },
          { type: "Users", id: userid },
          { type: "Users", id: "ALL_USERS" }
        ]
        let userName = ""

        updateCache(
          "getUsersByBoardId",
          tagsToInvalidate,
          (draft) => {
            const users = draft as User[]
            const user = users.find((user) => user.userid === userid)
            if (user) {
              user.tickets.push(ticketId)
              userName = user.name
            }
          },
          apiActions
        )

        updateCache(
          "getTaskListByColumnId",
          tagsToInvalidate,
          (draft) => {
            const tasks = draft as Task[]
            const task = tasks.find((task) => task.ticketid === ticketId)
            if (task) {
              task.users.push({ userid, name: userName })
            }
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)
          apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        })
      }
    }),

    deleteUserFromTicket: builder.mutation<User, { ticketId: string; userid: string }>({
      query: ({ ticketId, userid }) => ({
        url: `tickets/${ticketId}/users/`,
        method: "DELETE",
        body: { userid }
      }),
      //update optimistically
      onQueryStarted({ ticketId, userid }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [
          { type: "Users", id: ticketId },
          { type: "Users", id: userid },
          { type: "Users", id: "ALL_USERS" }
        ]

        updateCache(
          "getUsersByBoardId",
          tagsToInvalidate,
          (draft) => {
            const users = draft as User[]
            const user = users.find((user) => user.userid === userid)
            if (user) {
              user.tickets.splice(user.tickets.indexOf(ticketId), 1)
            }
          },
          apiActions
        )

        updateCache(
          "getTaskListByColumnId",
          tagsToInvalidate,
          (draft) => {
            const tasks = draft as Task[]
            const task = tasks.find((task) => task.ticketid === ticketId)
            if (task) {
              task.users = task.users.filter((user) => user.userid !== userid)
            }
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)
          apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        })
      }
    }),

    postUserToAction: builder.mutation<User, { actionId: string; userid: string }>({
      query: ({ actionId, userid }) => ({
        url: `actions/${actionId}/users/`,
        method: "POST",
        body: { userid }
      }),
      //update optimistically
      onQueryStarted({ actionId, userid }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [
          { type: "Users", id: actionId },
          { type: "Users", id: userid },
          { type: "Users", id: "ALL_USERS" }
        ]

        let userName = ""

        updateCache(
          "getUsersByBoardId",
          tagsToInvalidate,
          (draft) => {
            const users = draft as User[]
            const user = users.find((user) => user.userid === userid)
            if (user) {
              user.actions.push(actionId)
              userName = user.name
            }
          },
          apiActions
        )

        updateCache(
          "getActionsByColumnId",
          tagsToInvalidate,
          (draft) => {
            const actions = draft as Action[]
            const action = actions.find((action) => action.actionid === actionId)
            if (action) {
              action.users.push({ userid, name: userName })
            }
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)
          apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        })
      }
    }),

    deleteUserFromAction: builder.mutation<User, { actionId: string; userid: string }>({
      query: ({ actionId, userid }) => ({
        url: `actions/${actionId}/users/`,
        method: "DELETE",
        body: { userid }
      }),
      //update optimistically
      onQueryStarted({ actionId, userid }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [
          { type: "Users", id: actionId },
          { type: "Users", id: userid },
          { type: "Users", id: "ALL_USERS" }
        ]

        updateCache(
          "getUsersByBoardId",
          tagsToInvalidate,
          (draft) => {
            const users = draft as User[]
            const user = users.find((user) => user.userid === userid)
            if (user) {
              user.actions.splice(user.actions.indexOf(actionId), 1)
            }
          },
          apiActions
        )

        updateCache(
          "getActionsByColumnId",
          tagsToInvalidate,
          (draft) => {
            const actions = draft as Action[]
            const action = actions.find((action) => action.actionid === actionId)
            if (action) {
              action.users = action.users.filter((action) => action.userid !== userid)
            }
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)
          apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        })
      }
    }),

    deleteUser: builder.mutation<User, { userId: string }>({
      query: ({ userId }) => ({
        url: `users/${userId}`,
        method: "DELETE"
      }),
      invalidatesTags: () => invalidateRemoteCache(["Users"])
    }),

    getSwimlaneColumnsByColumnId: builder.query<SwimlaneColumn[], string>({
      query: (columnId) => `columns/${columnId}/swimlanecolumns/`,
      providesTags: [{ type: "SwimlaneColumn", id: "LIST" }]
    }),

    updateSwimlaneColumn: builder.mutation<SwimlaneColumn, { swimlaneColumn: SwimlaneColumn }>({
      query: ({ swimlaneColumn }) => ({
        url: `swimlanecolumns/${swimlaneColumn.swimlanecolumnid}/`,
        method: "PUT",
        body: swimlaneColumn
      }),
      invalidatesTags: () => invalidateRemoteCache([{ type: "SwimlaneColumn", id: "LIST" }])
    }),

    getActionsByColumnId: builder.query<Action[], string>({
      query: (columnId) => `/columns/${columnId}/actions/`,
      providesTags: (result, _error, columnid) => {
        const tags: CacheInvalidationTag[] = []
        tags.push({ type: "Action", id: columnid })
        if (result) {
          const actions: Action[] = result
          const taggedUsers: string[] = []
          actions.forEach((action) => {
            tags.push({ type: "Action", id: action.actionid })
            tags.push({ type: "Users", id: action.actionid })
            action.users.forEach((user) => {
              if (!taggedUsers.includes(user.userid)) {
                tags.push({ type: "Users", id: user.userid })
                taggedUsers.push(user.userid)
              }
            })
          })
        }
        return tags
      }
    }),

    postAction: builder.mutation<Action, { action: NewAction }>({
      query: ({ action }) => ({
        url: `${action.swimlanecolumnid}/${action.ticketid}/actions/`,
        method: "POST",
        body: action
      }),
      //update optimistically
      onQueryStarted({ action }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const invalidationTags: CacheInvalidationTag[] = [{ type: "Action", id: action.columnid }]
        updateCache(
          "getActionsByColumnId",
          invalidationTags,
          (draft) => {
            const actions = draft as Action[]
            actions.unshift({ ...action, creation_date: new Date().toISOString(), users: [] })
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(invalidationTags)
          apiActions.dispatch(boardsApi.util.invalidateTags(invalidationTags))
        })
      }
    }),

    //update single action
    updateAction: builder.mutation<Action, { action: NewAction }>({
      query: ({ action }) => ({
        url: `actions/${action.actionid}/`,
        method: "PUT",
        body: action
      }),
      invalidatesTags: (result) => invalidateRemoteCache([{ type: "Action", id: result?.columnid }])
    }),

    deleteAction: builder.mutation<Action, { actionid: string }>({
      query: ({ actionid }) => ({
        url: `actions/${actionid}/`,
        method: "DELETE"
      }),
      invalidatesTags: (result) => invalidateRemoteCache([{ type: "Action", id: result?.columnid }])
    }),

    // update action order
    updateActionList: builder.mutation<
      Action[],
      { columnid: string; taskId: string; swimlaneColumnId: string; actions: Action[] }
    >({
      query: ({ taskId, swimlaneColumnId, actions }) => ({
        url: `${swimlaneColumnId}/${taskId}/actions/`,
        method: "PUT",
        body: actions
      }),
      //update optimistically
      async onQueryStarted({ columnid, swimlaneColumnId, actions: newActions }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const invalidationTags: CacheInvalidationTag[] = [{ type: "Action", id: columnid }]

        const patchResult = apiActions.dispatch(
          boardsApi.util.updateQueryData("getActionsByColumnId", columnid, (draft) => {
            const oldActions = draft as Action[]

            const oldActionsWithoutNewActions = oldActions.filter(
              (oldAction) => !newActions.some((newAction) => newAction.actionid === oldAction.actionid)
            )

            const newActionsWithCorrectIds = newActions.map((newAction) => ({
              ...newAction,
              swimlanecolumnid: swimlaneColumnId
            }))

            return [...oldActionsWithoutNewActions, ...newActionsWithCorrectIds]
          })
        )
        try {
          await apiActions.queryFulfilled
          invalidateRemoteCache(invalidationTags)
        } catch {
          patchResult.undo()
          apiActions.dispatch(boardsApi.util.invalidateTags(invalidationTags))
        }
      }
    }),

    // Not really a mutation, but mutation API better fits the use case
    checkAdminPassword: builder.mutation<{ success: boolean }, string>({
      query: (password) => ({
        url: "checkadminpassword/",
        method: "POST",
        body: { password }
      })
    }),

    getCumulativeFlowDiagramData: builder.query<
      ChartData,
      { boardId: string; timeUnit?: string; start?: string; end?: string; countUnit?: string }
    >({
      query: ({ boardId, timeUnit, start, end, countUnit }) => ({
        url: `charts/${boardId}/cumulativeflow`,
        method: "GET",
        params: { time_unit: timeUnit, start_time: start, end_time: end, count_unit: countUnit }
      }),
      providesTags: [
        { type: "Columns", id: "LIST" },
        { type: "Ticket", id: "LIST" }
      ]
    }),

    getScopes: builder.query<Scope[], string>({
      query: (boardId) => ({
        url: `scopes/${boardId}/`,
        method: "GET"
      }),
      providesTags: [
        { type: "Scopes", id: "LIST" },
        { type: "Columns", id: "LIST" },
        { type: "Ticket", id: "LIST" }
      ]
    }),

    addScope: builder.mutation<Scope, { boardId: string; title: string }>({
      query: ({ boardId, title }) => ({
        url: `scopes/${boardId}/`,
        method: "POST",
        body: { title }
      }),
      invalidatesTags: () => invalidateRemoteCache(["Scopes"])
    }),

    deleteScope: builder.mutation<Scope, { boardid: string; scopeid: string }>({
      query: ({ boardid, scopeid }) => ({
        url: `scopes/${boardid}/`,
        method: "DELETE",
        body: { scopeid }
      }),
      //update optimistically
      onQueryStarted({ scopeid }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [{ type: "Scopes", id: "LIST" }]
        updateCache(
          "getScopes",
          tagsToInvalidate,
          (draft) => {
            const scopes = draft as Scope[]
            return scopes.filter((scope) => scope.scopeid !== scopeid)
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)
          apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        })
      }
    }),

    setDoneColumns: builder.mutation<Scope, { scope: Scope; columns: Column[] }>({
      query: ({ scope, columns }) => ({
        url: `scopes/${scope.scopeid}/set_done_columns`,
        method: "POST",
        body: { done_columns: columns.map((c) => c.columnid) }
      }),
      //update optimistically
      onQueryStarted({ scope, columns }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [{ type: "Scopes", id: "LIST" }]
        updateCache(
          "getScopes",
          tagsToInvalidate,
          (draft) => {
            const scopes = draft as Scope[]
            const updatedScope = scopes.find((previousScope) => previousScope.scopeid === scope.scopeid)
            if (updatedScope) {
              updatedScope.done_columns = columns
            }
            return scopes
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)

          // We don't invalidate the local cache, because the optimisitic update is already done, and doing a refetch would cause the UI to be very slow.

          // apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        })
      }
    }),

    setScopeForecast: builder.mutation<Scope, { scopeid: string }>({
      query: ({ scopeid }) => ({
        url: `scopes/${scopeid}/set_scope_forecast`,
        method: "POST"
      }),
      invalidatesTags: () => invalidateRemoteCache(["Scopes"])
    }),

    setScopeTitle: builder.mutation<{ success: boolean }, { scopeid: string; title: string }>({
      query: ({ scopeid, title }) => ({
        url: `scopes/${scopeid}/set_title`,
        method: "POST",
        body: { title: title }
      }),
      invalidatesTags: () => invalidateRemoteCache(["Ticket", "Scopes"])
    }),

    addTaskToScope: builder.mutation<{ success: boolean }, { scope: SimpleScope; ticketid: string }>({
      query: ({ scope, ticketid }) => ({
        url: `scopes/${scope.scopeid}/tickets`,
        method: "POST",
        body: { ticketid }
      }),
      //update optimistically
      onQueryStarted({ ticketid, scope }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [{ type: "Ticket", id: ticketid }]
        updateCache(
          "getTaskListByColumnId",
          tagsToInvalidate,
          (draft) => {
            const tasks = draft as Task[]
            const task = tasks.find((task) => task.ticketid === ticketid)
            if (task) {
              task.scopes.push({ scopeid: scope.scopeid, title: scope.title })
            }
          },
          apiActions
        )

        tagsToInvalidate.push("Scopes")

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)
          apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        })
      }
    }),

    deleteTaskFromScope: builder.mutation<{ success: boolean }, { scope: SimpleScope; ticketid: string }>({
      query: ({ scope, ticketid }) => ({
        url: `scopes/${scope.scopeid}/tickets`,
        method: "DELETE",
        body: { ticketid }
      }),
      //update optimistically
      onQueryStarted({ ticketid, scope }, apiActions) {
        if (isLoggedInWithReadOnly(apiActions)) return

        const tagsToInvalidate: CacheInvalidationTag[] = [{ type: "Ticket", id: ticketid }]
        updateCache(
          "getTaskListByColumnId",
          tagsToInvalidate,
          (draft) => {
            const tasks = draft as Task[]
            const task = tasks.find((task) => task.ticketid === ticketid)
            if (task) {
              task.scopes = task.scopes.filter((taskScope) => taskScope.scopeid !== scope.scopeid)
            }
          },
          apiActions
        )

        tagsToInvalidate.push("Scopes")

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)
          apiActions.dispatch(boardsApi.util.invalidateTags(tagsToInvalidate))
        })
      }
    }),

    getVelocityChartData: builder.query<ChartData, { boardId: string }>({
      query: ({ boardId }) => ({
        url: `charts/${boardId}/velocity`,
        method: "GET"
      }),
      providesTags: [
        { type: "Columns", id: "LIST" },
        { type: "Ticket", id: "LIST" },
        { type: "Scopes", id: "LIST" }
      ]
    }),
    getBurnUpChartData: builder.query<
      ChartData,
      { boardId: string; scopeId: string; timeUnit?: string; countUnit?: string }
    >({
      query: ({ boardId, scopeId, timeUnit, countUnit }) => ({
        url: `charts/${boardId}/${scopeId}/burnup`,
        method: "GET",
        params: { time_unit: timeUnit, count_unit: countUnit }
      }),
      providesTags: [
        { type: "Columns", id: "LIST" },
        { type: "Ticket", id: "LIST" },
        { type: "Scopes", id: "LIST" }
      ]
    })
  })
})

export const {
  useGetUsersByBoardIdQuery,
  useGetBoardQuery,
  useAddBoardMutation,
  useAddBoardTemplateMutation,
  useDeleteBoardTemplateMutation,
  useCreateBoardFromTemplateMutation,
  useGetBoardTemplatesQuery,
  useImportBoardMutation,
  useDeleteBoardMutation,
  useUpdateBoardTitleMutation,
  useUpdateBoardPasswordMutation,
  useUpdateBoardColorMutation,
  useUpdateBoardNotesMutation,
  useGetColumnsByBoardIdQuery,
  useGetTaskListByColumnIdQuery,
  useAddColumnMutation,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateColumnMutation,
  useUpdateColumnOrderMutation,
  useDeleteColumnMutation,
  useLoginMutation,
  useUpdateTaskListByColumnIdMutation,
  usePostUserToBoardMutation,
  usePostUserToTicketMutation,
  useDeleteUserMutation,
  useGetSwimlaneColumnsByColumnIdQuery,
  useUpdateSwimlaneColumnMutation,
  useGetActionsByColumnIdQuery,
  usePostActionMutation,
  useUpdateActionMutation,
  useDeleteActionMutation,
  useUpdateActionListMutation,
  usePostUserToActionMutation,
  useDeleteUserFromActionMutation,
  useDeleteUserFromTicketMutation,
  useCheckAdminPasswordMutation,
  useUpdateTaskTemplateMutation,
  useGetCumulativeFlowDiagramDataQuery,
  useAddTaskToScopeMutation,
  useDeleteTaskFromScopeMutation,
  useAddScopeMutation,
  useDeleteScopeMutation,
  useSetDoneColumnsMutation,
  useSetScopeForecastMutation,
  useSetScopeTitleMutation,
  useGetScopesQuery,
  useGetVelocityChartDataQuery,
  useGetBurnUpChartDataQuery
} = boardsApi
