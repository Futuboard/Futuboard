import { TagDescription, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

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
  ChartData
} from "@/types"

import { getAdminPassword, getAuth, setToken } from "./auth"
import { RootState } from "./store"
import { webSocketContainer } from "./websocket"

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

//TODO: refactor
export const boardsApi = createApi({
  reducerPath: "boardsApi",
  baseQuery: fetchBaseQuery({
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
  }),

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

    getColumnsByBoardId: builder.query<Column[], string>({
      query: (boardid) => `boards/${boardid}/columns/`,
      providesTags: [{ type: "Columns", id: "LIST" }]
    }),

    getTaskListByColumnId: builder.query<Task[], { boardId: string; columnId: string }>({
      query: ({ boardId, columnId }) => {
        return `boards/${boardId}/columns/${columnId}/tickets`
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
      invalidatesTags: () => invalidateRemoteCache(["Columns"])
    }),

    addTask: builder.mutation<Task, { boardId: string; columnId: string; task: NewTask }>({
      query: ({ boardId, columnId, task }) => ({
        url: `boards/${boardId}/columns/${columnId}/tickets`,
        method: "POST",
        body: task
      }),
      invalidatesTags: (_result, _error, { columnId }) => invalidateRemoteCache([{ type: "Columns", id: columnId }])
    }),

    updateTask: builder.mutation<Task, { task: NewTask }>({
      query: ({ task }) => ({
        url: `columns/${task.columnid}/tickets/${task.ticketid}/`,
        method: "PUT",
        body: task
      }),
      invalidatesTags: (_result, _error, { task }) => invalidateRemoteCache([{ type: "Ticket", id: task.ticketid }])
    }),

    deleteTask: builder.mutation<Task, { task: Task }>({
      query: ({ task }) => ({
        url: `columns/${task.columnid}/tickets/${task.ticketid}/`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, { task }) => invalidateRemoteCache([{ type: "Ticket", id: task.ticketid }])
    }),

    updateColumn: builder.mutation<Column, { column: Column; ticketIds?: string[] }>({
      query: ({ column, ticketIds }) => ({
        url: `boards/${column.boardid}/columns/${column.columnid}/`,
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
        url: `boards/${column.boardid}/columns/${column.columnid}/`,
        method: "DELETE"
      }),
      invalidatesTags: () => invalidateRemoteCache(["Columns"])
    }),

    updateTaskListByColumnId: builder.mutation<Task[], { boardId: string; columnId: string; tasks: Task[] }>({
      query: ({ boardId, columnId, tasks }) => ({
        url: `boards/${boardId}/columns/${columnId}/tickets`,
        method: "PUT",
        body: tasks
      }),
      //update optimistically
      onQueryStarted({ columnId, tasks }, apiActions) {
        const tagsToInvalidate: CacheInvalidationTag[] = [{ type: "Columns", id: columnId }]

        updateCache(
          "getTaskListByColumnId",
          tagsToInvalidate,
          () => {
            const updatedTasks = tasks.map((task) => ({
              ...task,
              columnid: columnId
            }))
            return updatedTasks
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(tagsToInvalidate)
          boardsApi.util.invalidateTags(tagsToInvalidate)
        })
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
      }),
      invalidatesTags: (result) => {
        if (result?.success) {
          return ["Boards"]
        }
        return []
      }
    }),

    postUserToTicket: builder.mutation<User, { ticketId: string; userid: string }>({
      query: ({ ticketId, userid }) => ({
        url: `tickets/${ticketId}/users/`,
        method: "POST",
        body: { userid }
      }),
      //update optimistically
      onQueryStarted({ ticketId, userid }, apiActions) {
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
          boardsApi.util.invalidateTags(tagsToInvalidate)
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
          boardsApi.util.invalidateTags(tagsToInvalidate)
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
          boardsApi.util.invalidateTags(tagsToInvalidate)
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
          boardsApi.util.invalidateTags(tagsToInvalidate)
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
          boardsApi.util.invalidateTags(invalidationTags)
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
      onQueryStarted({ columnid, swimlaneColumnId, actions: newActions }, apiActions) {
        const invalidationTags: CacheInvalidationTag[] = [{ type: "Action", id: columnid }]
        updateCache(
          "getActionsByColumnId",
          invalidationTags,
          (draft) => {
            const oldActions = draft as Action[]

            const oldActionsWithoutNewActions = oldActions.filter(
              (oldAction) => !newActions.some((newAction) => newAction.actionid === oldAction.actionid)
            )

            const newActionsWithCorrectIds = newActions.map((newAction) => ({
              ...newAction,
              swimlanecolumnid: swimlaneColumnId
            }))

            return [...oldActionsWithoutNewActions, ...newActionsWithCorrectIds]
          },
          apiActions
        )

        apiActions.queryFulfilled.finally(() => {
          invalidateRemoteCache(invalidationTags)
          boardsApi.util.invalidateTags(invalidationTags)
        })
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
      { boardId: string; timeUnit: string; start: string; end: string }
    >({
      query: ({ boardId, timeUnit = "day", start, end }) => ({
        url: `charts/${boardId}/cumulativeflow`,
        method: "GET",
        params: { time_unit: timeUnit, start_time: start, end_time: end }
      })
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
  useGetCumulativeFlowDiagramDataQuery
} = boardsApi
