import { PatchCollection } from "@reduxjs/toolkit/dist/query/core/buildThunks"
import { TagDescription, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

import { Action, Board, Column, SwimlaneColumn, Task, User } from "../types"

import { getAuth, setToken } from "./auth"
import { RootState } from "./store"

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

  tagTypes: ["Boards", "Columns", "Ticket", "Users", "Action", "ActionList", "SwimlaneColumn"],

  endpoints: (builder) => ({
    getBoard: builder.query<Board, string>({
      query: (boardId) => `boards/${boardId}/`,
      providesTags: ["Boards"]
    }),
    addBoard: builder.mutation<Board, Board>({
      query: (board) => {
        return {
          url: "boards/",
          method: "POST",
          body: board
        }
      },
      invalidatesTags: ["Boards"]
    }),
    deleteBoard: builder.mutation<Board, string>({
      query: (boardId) => ({
        url: `boards/${boardId}/`,
        method: "DELETE"
      }),
      invalidatesTags: ["Boards"]
    }),
    updateBoardTitle: builder.mutation<Board, { boardId: string; newName: string }>({
      query: ({ boardId, newName }) => ({
        url: `boards/${boardId}/title/`,
        method: "PUT",
        body: { title: newName }
      }),
      invalidatesTags: ["Boards"]
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
        const tags: TagDescription<"Ticket">[] = []
        if (result) {
          const tasks: Task[] = result
          tasks.forEach((task) => {
            tags.push({ type: "Ticket", id: task.ticketid })
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
      invalidatesTags: ["Columns"]
    }),

    addTask: builder.mutation<Task, { boardId: string; columnId: string; task: Task }>({
      query: ({ boardId, columnId, task }) => ({
        url: `boards/${boardId}/columns/${columnId}/tickets`,
        method: "POST",
        body: task
      }),
      invalidatesTags: (_result, _error, { columnId }) => [{ type: "Columns", id: columnId }]
    }),

    updateTask: builder.mutation<Task, { task: Task }>({
      query: ({ task }) => ({
        url: `columns/${task.columnid}/tickets/${task.ticketid}/`,
        method: "PUT",
        body: task
      }),
      invalidatesTags: (_result, _error, { task }) => [{ type: "Ticket", id: task.ticketid }]
    }),
    deleteTask: builder.mutation<Task, { task: Task }>({
      query: ({ task }) => ({
        url: `columns/${task.columnid}/tickets/${task.ticketid}/`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, { task }) => [{ type: "Ticket", id: task.ticketid }]
    }),

    updateColumn: builder.mutation<Column, { column: Column; ticketIds?: string[] }>({
      query: ({ column, ticketIds }) => ({
        url: `boards/${column.boardid}/columns/${column.columnid}/`,
        method: "PUT",
        body: { ...column, ticket_ids: ticketIds }
      }),
      invalidatesTags: ["Columns"]
    }),
    //optimistclly updates column order
    updateColumnOrder: builder.mutation<Column[], { boardId: string; columns: Column[] }>({
      query: ({ boardId, columns }) => ({
        url: `boards/${boardId}/columns/`,
        method: "PUT",
        body: columns
      }),
      async onQueryStarted(patchArgs: { boardId: string; columns: Column[] }, apiActions) {
        const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), [{ type: "Columns", id: "LIST" }])
        const patchResults: PatchCollection[] = []
        cacheList.forEach((cache) => {
          if (cache.endpointName === "getColumnsByBoardId") {
            const patchResult = apiActions.dispatch(
              boardsApi.util.updateQueryData("getColumnsByBoardId", cache.originalArgs, () => {
                return patchArgs.columns
              })
            )
            patchResults.push(patchResult)
          }
        })

        try {
          await apiActions.queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo()
          })
          apiActions.dispatch(boardsApi.util.invalidateTags([{ type: "Columns", id: "LIST" }]))
        }
      }
    }),
    deleteColumn: builder.mutation<Column, { column: Column }>({
      query: ({ column }) => ({
        url: `boards/${column.boardid}/columns/${column.columnid}/`,
        method: "DELETE"
      }),
      invalidatesTags: ["Columns"]
    }),
    //optimistclly updates task list
    updateTaskListByColumnId: builder.mutation<Task[], { boardId: string; columnId: string; tasks: Task[] }>({
      query: ({ boardId, columnId, tasks }) => ({
        url: `boards/${boardId}/columns/${columnId}/tickets`,
        method: "PUT",
        body: tasks
      }),

      async onQueryStarted(patchArgs: { boardId: string; columnId: string; tasks: Task[] }, apiActions) {
        const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), [
          { type: "Columns", id: patchArgs.columnId }
        ])
        const patchResults: PatchCollection[] = []
        cacheList.forEach((cache) => {
          if (cache.endpointName === "getTaskListByColumnId") {
            const patchResult = apiActions.dispatch(
              boardsApi.util.updateQueryData("getTaskListByColumnId", cache.originalArgs, () => {
                const updatedTasks = patchArgs.tasks.map((task) => ({
                  ...task,
                  columnid: patchArgs.columnId
                }))
                return updatedTasks
              })
            )
            patchResults.push(patchResult)
          }
        })

        try {
          await apiActions.queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo()
          })
          apiActions.dispatch(boardsApi.util.invalidateTags([{ type: "Columns", id: patchArgs.columnId }]))
        }
      }
    }),
    getUsersByBoardId: builder.query<User[], string>({
      query: (boardId) => `boards/${boardId}/users/`,
      providesTags: [{ type: "Users", id: "USERLIST" }]
    }),
    postUserToBoard: builder.mutation<User, { boardId: string; user: Omit<User, "userid"> }>({
      query: ({ boardId, user }) => ({
        url: `boards/${boardId}/users/`,
        method: "POST",
        body: user
      }),
      invalidatesTags: [{ type: "Users", id: "USERLIST" }]
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
      invalidatesTags: ["Boards"]
    }),
    getUsersByTicketId: builder.query<User[], string>({
      query: (ticketId) => `tickets/${ticketId}/users/`,
      providesTags: (result, _error, args) => {
        const tags: TagDescription<"Users">[] = []
        if (result) {
          const users: User[] = result
          users.forEach((user) => {
            tags.push({ type: "Users", id: user.userid })
          })
        }
        return [{ type: "Users", id: args }, ...tags]
      }
    }),
    getUsersByActionId: builder.query<User[], string>({
      query: (actionId) => `actions/${actionId}/users/`,
      providesTags: (result, _error, args) => {
        const tags: TagDescription<"Users">[] = []
        if (result) {
          const users: User[] = result
          users.forEach((user) => {
            tags.push({ type: "Users", id: user.userid })
          })
        }
        return [{ type: "Users", id: args }, ...tags]
      }
    }),
    postUserToTicket: builder.mutation<User, { ticketId: string; user: User }>({
      query: ({ ticketId, user }) => ({
        url: `tickets/${ticketId}/users/`,
        method: "POST",
        body: user
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [{ type: "Users", id: ticketId }],
      async onQueryStarted(patchArgs: { ticketId: string; user: User }, apiActions) {
        const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), [
          { type: "Users", id: patchArgs.ticketId }
        ])
        const patchResults: PatchCollection[] = []
        cacheList.forEach((cache) => {
          if (cache.endpointName === "getUsersByTicketId") {
            const patchResult = apiActions.dispatch(
              boardsApi.util.updateQueryData("getUsersByTicketId", cache.originalArgs, (oldData) => {
                return [...oldData, { userid: "temp", name: patchArgs.user.name, color: patchArgs.user.color }]
              })
            )
            patchResults.push(patchResult)
          }
        })

        try {
          await apiActions.queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo()
          })
          apiActions.dispatch(boardsApi.util.invalidateTags([{ type: "Users", id: patchArgs.ticketId }]))
        }
      }
    }),
    postUserToAction: builder.mutation<User, { actionId: string; user: User }>({
      query: ({ actionId, user }) => ({
        url: `actions/${actionId}/users/`,
        method: "POST",
        body: user
      }),
      //optimistically updates the user list, however since the new instance of the user gets its id from the server, the optimistically
      //updated user will have a temporary id, which will be replaced by the server id when the query is fulfilled
      //this can lead to problems if one tries to drag the user before the query is fulfilled
      async onQueryStarted(patchArgs: { actionId: string; user: User }, apiActions) {
        const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), [
          { type: "Users", id: patchArgs.actionId }
        ])
        const patchResults: PatchCollection[] = []
        cacheList.forEach((cache) => {
          if (cache.endpointName === "getUsersByActionId") {
            const patchResult = apiActions.dispatch(
              boardsApi.util.updateQueryData("getUsersByActionId", cache.originalArgs, (oldData) => {
                return [...oldData, { userid: "temp", name: patchArgs.user.name, color: patchArgs.user.color }]
              })
            )
            patchResults.push(patchResult)
          }
        })

        try {
          await apiActions.queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo()
          })
          apiActions.dispatch(boardsApi.util.invalidateTags([{ type: "Users", id: patchArgs.actionId }]))
        }
      },
      invalidatesTags: (_result, _error, { actionId }) => [{ type: "Users", id: actionId }]
    }),
    deleteUser: builder.mutation<User, { userId: string }>({
      query: ({ userId }) => ({
        url: `users/${userId}`,
        method: "DELETE"
      }),
      invalidatesTags: [{ type: "Users", id: "USERLIST" }]
    }),
    deleteUserRecursive: builder.mutation<User, { userId: string }>({
      query: ({ userId }) => ({
        url: `users/${userId}/delete_recursive/`,
        method: "DELETE"
      }),
      invalidatesTags: ["Users"]
    }),
    updateUserListByTicketId: builder.mutation<User[], { ticketId: string; users: User[] }>({
      query: ({ ticketId, users }) => ({
        url: `tickets/${ticketId}/users/`,
        method: "PUT",
        body: users
      }),
      async onQueryStarted(patchArgs: { ticketId: string; users: User[] }, apiActions) {
        const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), [
          { type: "Users", id: patchArgs.ticketId }
        ])
        const patchResults: PatchCollection[] = []
        cacheList.forEach((cache) => {
          if (cache.endpointName === "getUsersByTicketId") {
            const patchResult = apiActions.dispatch(
              boardsApi.util.updateQueryData("getUsersByTicketId", cache.originalArgs, () => {
                const updatedUsers = patchArgs.users.map((user) => ({
                  ...user
                }))
                return updatedUsers
              })
            )
            patchResults.push(patchResult)
          }
        })

        try {
          await apiActions.queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo()
          })
          apiActions.dispatch(boardsApi.util.invalidateTags([{ type: "Users", id: patchArgs.ticketId }]))
        }
      }
    }),
    updateUserListByActionId: builder.mutation<User[], { actionId: string; users: User[] }>({
      query: ({ actionId, users }) => ({
        url: `actions/${actionId}/users/`,
        method: "PUT",
        body: users
      }),
      async onQueryStarted(patchArgs: { actionId: string; users: User[] }, apiActions) {
        const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), [
          { type: "Users", id: patchArgs.actionId }
        ])
        const patchResults: PatchCollection[] = []
        cacheList.forEach((cache) => {
          if (cache.endpointName === "getUsersByActionId") {
            const patchResult = apiActions.dispatch(
              boardsApi.util.updateQueryData("getUsersByActionId", cache.originalArgs, () => {
                const updatedUsers = patchArgs.users.map((user) => ({
                  ...user
                }))
                return updatedUsers
              })
            )
            patchResults.push(patchResult)
          }
        })

        try {
          await apiActions.queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo()
          })
          apiActions.dispatch(boardsApi.util.invalidateTags([{ type: "Users", id: patchArgs.actionId }]))
        }
      }
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
      invalidatesTags: [{ type: "SwimlaneColumn", id: "LIST" }]
    }),

    getActionListByTaskIdAndSwimlaneColumnId: builder.query<Action[], { taskId: string; swimlaneColumnId: string }>({
      query: ({ taskId, swimlaneColumnId }) => `${swimlaneColumnId}/${taskId}/actions/`,
      providesTags: (result, _error, args) => {
        const tags: TagDescription<"Action">[] = []
        if (result) {
          const actions: Action[] = result
          actions.forEach((action) => {
            tags.push({ type: "Action", id: action.actionid })
          })
        }
        return [
          { type: "ActionList", id: args.swimlaneColumnId + args.taskId },
          { type: "Action", id: "LIST" },
          ...tags
        ]
      }
    }),
    postAction: builder.mutation<Action, { taskId: string; swimlaneColumnId: string; action: Action }>({
      query: ({ taskId, swimlaneColumnId, action }) => ({
        url: `${swimlaneColumnId}/${taskId}/actions/`,
        method: "POST",
        body: action
      }),
      invalidatesTags: [{ type: "Action", id: "LIST" }]
    }),
    //update single action
    updateAction: builder.mutation<Action, { action: Action }>({
      query: ({ action }) => ({
        url: `actions/${action.actionid}/`,
        method: "PUT",
        body: action
      }),
      invalidatesTags: (_result, _error, { action }) => [{ type: "Action", id: action.actionid }]
    }),
    //optimistclly updates swimlane action list
    updateActionList: builder.mutation<Action[], { taskId: string; swimlaneColumnId: string; actions: Action[] }>({
      query: ({ taskId, swimlaneColumnId, actions }) => ({
        url: `${swimlaneColumnId}/${taskId}/actions/`,
        method: "PUT",
        body: actions
      }),
      async onQueryStarted(patchArgs: { taskId: string; swimlaneColumnId: string; actions: Action[] }, apiActions) {
        const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), [
          { type: "ActionList", id: patchArgs.swimlaneColumnId + patchArgs.taskId }
        ])
        const patchResults: PatchCollection[] = []
        cacheList.forEach((cache) => {
          if (cache.endpointName === "getActionListByTaskIdAndSwimlaneColumnId") {
            const patchResult = apiActions.dispatch(
              boardsApi.util.updateQueryData("getActionListByTaskIdAndSwimlaneColumnId", cache.originalArgs, () => {
                const updatedActions = patchArgs.actions.map((action) => ({
                  ...action,
                  swimlanecolumnid: patchArgs.swimlaneColumnId,
                  ticketid: patchArgs.taskId
                }))
                return updatedActions
              })
            )
            patchResults.push(patchResult)
          }
        })

        try {
          await apiActions.queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo()
          })
          apiActions.dispatch(boardsApi.util.invalidateTags([{ type: "Action", id: "LIST" }]))
        }
      }
    })
  })
})

export const {
  useGetUsersByBoardIdQuery,
  useGetBoardQuery,
  useAddBoardMutation,
  useDeleteBoardMutation,
  useUpdateBoardTitleMutation,
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
  useGetUsersByTicketIdQuery,
  usePostUserToTicketMutation,
  useUpdateUserListByTicketIdMutation,
  useDeleteUserMutation,
  useDeleteUserRecursiveMutation,
  useGetSwimlaneColumnsByColumnIdQuery,
  useUpdateSwimlaneColumnMutation,
  useGetActionListByTaskIdAndSwimlaneColumnIdQuery,
  usePostActionMutation,
  useUpdateActionMutation,
  useUpdateActionListMutation,
  useGetUsersByActionIdQuery,
  usePostUserToActionMutation,
  useUpdateUserListByActionIdMutation
} = boardsApi
