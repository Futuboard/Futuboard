import { TagDescription, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

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
  UserWithoutTicketsOrActions
} from "@/types"

import { getAuth, setToken } from "./auth"
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
  apiActions: any // eslint-disable-line @typescript-eslint/no-explicit-any
) => {
  const cacheList = boardsApi.util.selectInvalidatedBy(apiActions.getState(), tagsToInvalidate)
  const cache = cacheList.find((cache) => cache.endpointName === endpointName)

  if (cache) {
    apiActions.dispatch(boardsApi.util.updateQueryData(endpointName, cache.originalArgs, updateFunction))
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
      invalidatesTags: () => invalidateRemoteCache(["Boards"])
    }),

    deleteBoard: builder.mutation<Board, string>({
      query: (boardId) => ({
        url: `boards/${boardId}/`,
        method: "DELETE"
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
      invalidatesTags: ["Boards"]
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
          "getActionListByTaskIdAndSwimlaneColumnId",
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
          "getActionListByTaskIdAndSwimlaneColumnId",
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

    getActionListByTaskIdAndSwimlaneColumnId: builder.query<Action[], { taskId: string; swimlaneColumnId: string }>({
      query: ({ taskId, swimlaneColumnId }) => `${swimlaneColumnId}/${taskId}/actions/`,
      providesTags: (result, _error, args) => {
        const tags: TagDescription<"Action" | "Users">[] = []
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
        return [
          { type: "ActionList", id: args.swimlaneColumnId + args.taskId },
          { type: "Action", id: "LIST" },
          ...tags
        ]
      }
    }),
    getActionsByColumnId: builder.query<Action[], string>({
      query: (columnId) => `/columns/${columnId}/actions/`,
      providesTags: (result, _error, args) => {
        const tags: TagDescription<"Action">[] = []
        if (result) {
          const actions: Action[] = result
          actions.forEach((action) => {
            tags.push({ type: "Action", id: action.actionid })
          })
        }
        return [{ type: "ActionList", id: args }, { type: "Action", id: "LIST" }, ...tags]
      }
    }),
    postAction: builder.mutation<Action, { taskId: string; swimlaneColumnId: string; action: NewAction }>({
      query: ({ taskId, swimlaneColumnId, action }) => ({
        url: `${swimlaneColumnId}/${taskId}/actions/`,
        method: "POST",
        body: action
      }),
      //update optimistically
      onQueryStarted({ taskId, swimlaneColumnId, action }, apiActions) {
        const invalidationTags: CacheInvalidationTag[] = [{ type: "Action", id: "LIST" }]
        updateCache(
          "getActionListByTaskIdAndSwimlaneColumnId",
          [{ type: "ActionList", id: swimlaneColumnId + taskId }],
          (draft) => {
            const actions = draft as Action[]
            actions.push({ ...action, swimlanecolumnid: swimlaneColumnId, ticketid: taskId, users: [] })
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
      invalidatesTags: (_result, _error, { action }) => invalidateRemoteCache([{ type: "Action", id: action.actionid }])
    }),

    //optimistclly updates swimlane action list
    updateActionList: builder.mutation<
      Action[],
      { taskId: string; swimlaneColumnId: string; columnId: string; actions: Action[]; originalActions: Action[] }
    >({
      query: ({ taskId, swimlaneColumnId, actions }) => ({
        url: `${swimlaneColumnId}/${taskId}/actions/`,
        method: "PUT",
        body: actions
      }),
      invalidatesTags: (_result, _error, { columnId }) => [{ type: "ActionList", id: columnId }], //burgerfix for getting right order, proper fix later
      async onQueryStarted(
        { swimlaneColumnId, taskId, columnId, actions, originalActions },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          boardsApi.util.updateQueryData("getActionsByColumnId", columnId, (draft) => {
            actions.forEach((action) => {
              const index = originalActions.findIndex((a) => a.actionid == action.actionid)
              if (index >= 0) {
                draft[index] = { ...action, swimlanecolumnid: swimlaneColumnId, ticketid: taskId }
              } else {
                draft.push(action)
              }
            })
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
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
  useGetActionListByTaskIdAndSwimlaneColumnIdQuery,
  useGetActionsByColumnIdQuery,
  usePostActionMutation,
  useUpdateActionMutation,
  useUpdateActionListMutation,
  usePostUserToActionMutation,
  useDeleteUserFromActionMutation,
  useDeleteUserFromTicketMutation
} = boardsApi
