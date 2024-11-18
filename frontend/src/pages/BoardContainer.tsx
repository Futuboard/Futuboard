import ToolBar from "@components/board/Toolbar"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { Box } from "@mui/material"
import { produce } from "immer"
import { createContext, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"
import useWebSocket, { SendMessage } from "react-use-websocket"

import { getId } from "@/services/Utils"
import { setBoardId } from "@/state/auth"
import { store } from "@/state/store"
import { Action, Task } from "@/types"

import AccessBoardForm from "../components/board/AccessBoardForm"
import Board from "../components/board/Board"
import {
  boardsApi,
  useDeleteUserMutation,
  useGetBoardQuery,
  useLoginMutation,
  usePostUserToActionMutation,
  usePostUserToTicketMutation,
  useUpdateActionListMutation,
  useUpdateColumnOrderMutation,
  useUpdateTaskListByColumnIdMutation,
  useUpdateUserListByActionIdMutation,
  useUpdateUserListByTicketIdMutation
} from "../state/apiSlice"

export const WebsocketContext = createContext<SendMessage | null>(null)

const clientId = getId()

const BoardContainer: React.FC = () => {
  const dispatch = useDispatch()
  const [isLoggedIn, setLogin] = useState(false)
  const { id = "default-id" } = useParams()
  const [deleteUser] = useDeleteUserMutation()
  // websocket object
  const { sendMessage: originalSendMessage } = useWebSocket(import.meta.env.VITE_WEBSOCKET_ADDRESS + id, {
    //`wss://futuboardbackend.azurewebsites.net/board/${id}`
    onOpen: () => {},
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: () => true,
    onMessage: (event) => {
      const data = JSON.parse(event.data)
      if (data.message !== clientId) {
        dispatch(
          boardsApi.util.invalidateTags([
            "Boards",
            "Columns",
            "Ticket",
            "Users",
            "Action",
            "ActionList",
            "SwimlaneColumn"
          ])
        )
      }
    },
    share: true
  })

  useEffect(() => {
    dispatch(setBoardId(id))
  }, [id, dispatch])

  //wrap the original sendMessage function to include the clientId with every message, so that client can ignore its own messages
  const updatedSendMessage = () => {
    originalSendMessage(clientId)
  }

  const [updateTaskList] = useUpdateTaskListByColumnIdMutation()
  const [updateColumns] = useUpdateColumnOrderMutation()
  const [postUserToTask] = usePostUserToTicketMutation()
  const [postUserToAction] = usePostUserToActionMutation()
  const [updateTaskUsers] = useUpdateUserListByTicketIdMutation()
  const [updateActionUsers] = useUpdateUserListByActionIdMutation()
  const [updateActions] = useUpdateActionListMutation()
  const [tryLogin] = useLoginMutation()

  const selectTasksByColumnId = boardsApi.endpoints.getTaskListByColumnId.select
  const selectUsersByBoardId = boardsApi.endpoints.getUsersByBoardId.select
  const selectUsersByTaskId = boardsApi.endpoints.getUsersByTicketId.select
  const selectUsersByActionId = boardsApi.endpoints.getUsersByActionId.select
  const selectActions = boardsApi.endpoints.getActionListByTaskIdAndSwimlaneColumnId.select
  const selectColumns = boardsApi.endpoints.getColumnsByBoardId.select(id)

  const handleOnDragEnd = async (result: DropResult) => {
    const { source, destination, type, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const state = store.getState()

    const userList = selectUsersByBoardId(id)(state).data || []

    //task logic:

    const selectDestinationTasks = selectTasksByColumnId({ boardId: id, columnId: destination.droppableId })
    const destinationTasks = selectDestinationTasks(state).data || []

    const selectSourceTasks = selectTasksByColumnId({ boardId: id, columnId: source.droppableId })
    const sourceTasks = selectSourceTasks(state).data || []

    //action logic:

    const selectDestionationActions = selectActions({
      taskId: destination.droppableId.split("/")[1],
      swimlaneColumnId: destination.droppableId.split("/")[0]
    })
    const destinationActions = selectDestionationActions(state).data || []

    const selectSourceActions = selectActions({
      taskId: source.droppableId.split("/")[1],
      swimlaneColumnId: source.droppableId.split("/")[0]
    })
    const sourceActions = selectSourceActions(state).data || []

    if (type === "task") {
      //dragging tasks in the same column
      if (destination.droppableId === source.droppableId) {
        const dataCopy = [...(destinationTasks ?? [])]
        const newOrdered = reorder<Task>(dataCopy, source.index, destination.index)
        await updateTaskList({ boardId: id, columnId: source.droppableId, tasks: newOrdered })
        updatedSendMessage()
      }
      //dragging tasks to different columns
      if (destination.droppableId !== source.droppableId) {
        //remove task from source column
        const nextSourceTasks = produce(sourceTasks, (draft) => {
          draft?.splice(source.index, 1)
        })

        //TODO: source tasks, dont need to be sent to server, just updated in cache

        //add task to destination column
        const nextDestinationTasks = produce(destinationTasks, (draft) => {
          draft?.splice(destination!.index, 0, sourceTasks![source.index])
        })
        await Promise.all([
          updateTaskList({ boardId: id, columnId: destination.droppableId, tasks: nextDestinationTasks ?? [] }),
          updateTaskList({ boardId: id, columnId: source.droppableId, tasks: nextSourceTasks ?? [] })
        ])
        updatedSendMessage()
      }
    }
    if (type === "user") {
      const destinationType = destination.droppableId.split("/")[1]
      const sourceType = source.droppableId.split("/")[1]

      const destinationId = destination.droppableId.split("/")[0]
      const sourceId = source.droppableId.split("/")[0]

      const selectDestinationTaskUsers = selectUsersByTaskId(destinationId)
      const destinationTaskUsers = selectDestinationTaskUsers(state).data || []

      const selectSourceTaskUsers = selectUsersByTaskId(sourceId)
      const sourceTaskUsers = selectSourceTaskUsers(state).data || []

      const selectDestinationActionUsers = selectUsersByActionId(destinationId)
      const destinationActionUsers = selectDestinationActionUsers(state).data || []

      const selectSourceActionUsers = selectUsersByActionId(sourceId)
      const sourceActionUsers = selectSourceActionUsers(state).data || []

      if (destinationTaskUsers.length >= 3 && destinationId != "user-list") {
        alert("Destination task already has 3 or more user magnets. Move not allowed.")
        return
      }
      if (destinationActionUsers.length >= 2 && destinationId != "user-list") {
        alert("Destination action already has 2 or more user magnets. Move not allowed.")
        return
      }
      let sourceUserList
      if (sourceType === "action") {
        sourceUserList = sourceActionUsers
      } else if (sourceType === "ticket") {
        sourceUserList = sourceTaskUsers
      } else {
        sourceUserList = userList
      }
      const movingUserName = sourceUserList.find((user) => user.userid === draggableId)?.name

      const isUnique =
        destinationType === "action"
          ? !destinationActionUsers.some((user) => user.name === movingUserName)
          : !destinationTaskUsers.some((user) => user.name === movingUserName)

      if (!isUnique && destinationId !== "user-list") {
        alert("This member is already working on the task. Move not allowed.")
        return
      }
      //dragging user from user list to a task
      if (sourceId == "user-list" && destinationId !== "user-list") {
        //when dragging from user list send POST to create a new instance of the user
        if (destinationType === "ticket") {
          //drag user from userlist to task
          await postUserToTask({ ticketId: destinationId, user: userList[source.index] })
          updatedSendMessage()
        }
        if (destinationType === "action") {
          //drag user from userlist to action
          await postUserToAction({ actionId: destinationId, user: userList[source.index] })
          updatedSendMessage()
        }
      }

      if (destinationId !== sourceId && sourceId !== "user-list") {
        //when dragging from a task to another task
        const nextDestinationTaskUsers = produce(destinationTaskUsers, (draft) => {
          draft?.splice(destination!.index, 0, sourceTaskUsers![source.index])
        })

        const nextSourceTaskUsers = produce(sourceTaskUsers, (draft) => {
          draft?.splice(source.index, 1)
        })

        const nextDestinationActionUsers = produce(destinationActionUsers, (draft) => {
          draft?.splice(destination!.index, 0, sourceActionUsers![source.index])
        })

        const nextSourceActionUsers = produce(sourceActionUsers, (draft) => {
          draft?.splice(source.index, 1)
        })

        if (destinationId !== "user-list") {
          //dragging from task to task
          if (destinationType === "ticket" && sourceType === "ticket") {
            await Promise.all([
              updateTaskUsers({ ticketId: destinationId, users: nextDestinationTaskUsers ?? [] }),
              updateTaskUsers({ ticketId: sourceId, users: nextSourceTaskUsers ?? [] })
            ]) //update destination task users
          }
          if (destinationType === "action" && sourceType === "action") {
            await Promise.all([
              updateActionUsers({ actionId: destinationId, users: nextDestinationActionUsers ?? [] }),
              updateActionUsers({ actionId: sourceId, users: nextSourceActionUsers ?? [] })
            ]) //update destination task users
          }

          //dragging from task to action and vice versa requires updating the destinationusers because they depend on the sourceusers
          if (destinationType === "ticket" && sourceType === "action") {
            const nextDestinationTaskUsers = produce(destinationTaskUsers, (draft) => {
              draft?.splice(destination!.index, 0, sourceActionUsers![source.index])
            })
            await Promise.all([
              updateTaskUsers({ ticketId: destinationId, users: nextDestinationTaskUsers ?? [] }),
              updateActionUsers({ actionId: sourceId, users: nextSourceActionUsers ?? [] })
            ]) //update destination task users
          }
          if (destinationType === "action" && sourceType === "ticket") {
            const nextDestinationActionUsers = produce(destinationActionUsers, (draft) => {
              draft?.splice(destination!.index, 0, sourceTaskUsers![source.index])
            })
            await Promise.all([
              updateActionUsers({ actionId: destinationId, users: nextDestinationActionUsers ?? [] }),
              updateTaskUsers({ ticketId: sourceId, users: nextSourceTaskUsers ?? [] })
            ]) //update destination task users
          }
        }
        if (destinationId === "user-list") {
          //dragging users back to userlist deletes them
          if (sourceType === "ticket") {
            const user = sourceTaskUsers![source.index]
            await updateTaskUsers({ ticketId: sourceId, users: nextSourceTaskUsers ?? [] })
            await deleteUser({ userId: user.userid })
          }
          if (sourceType === "action") {
            const user = sourceActionUsers![source.index]
            await updateActionUsers({ actionId: sourceId, users: nextSourceActionUsers ?? [] })
            await deleteUser({ userId: user.userid })
          }
        }
        updatedSendMessage()
      }
    }
    if (type.split("/")[0] === "SWIMLANE") {
      if (destination.droppableId === source.droppableId && destination.index === source.index) return
      if (destination.droppableId === source.droppableId) {
        const dataCopy = [...(destinationActions ?? [])]
        const newOrdered = reorder<Action>(dataCopy, source.index, destination.index)
        await updateActions({
          taskId: destination.droppableId.split("/")[1],
          swimlaneColumnId: destination.droppableId.split("/")[0],
          actions: newOrdered
        })
        updatedSendMessage()
      }
      if (destination.droppableId !== source.droppableId) {
        const nextSourceActions = produce(sourceActions, (draft) => {
          draft?.splice(source.index, 1)
        })

        const nextDestinationActions = produce(destinationActions, (draft) => {
          draft?.splice(destination!.index, 0, sourceActions![source.index])
        })
        await Promise.all([
          updateActions({
            taskId: destination.droppableId.split("/")[1],
            swimlaneColumnId: destination.droppableId.split("/")[0],
            actions: nextDestinationActions ?? []
          }),
          updateActions({
            taskId: source.droppableId.split("/")[1],
            swimlaneColumnId: source.droppableId.split("/")[0],
            actions: nextSourceActions ?? []
          })
        ])
        updatedSendMessage()
      }
    }
    //reordering columns
    if (type === "COLUMN") {
      if (destination.index === source.index) return
      //select columns from state
      const columns = selectColumns(state).data || []
      const dataCopy = [...columns]
      const newOrdered = reorder(dataCopy, source.index, destination.index) //reorder column list
      await updateColumns({ boardId: id, columns: newOrdered })
      updatedSendMessage()
    }
  }

  const { data: board, isSuccess } = useGetBoardQuery(id)

  useEffect(() => {
    tryLogin({ boardId: id, password: "" })
  }, [id, tryLogin])

  useEffect(() => {
    if (isSuccess) {
      setLogin(true)
    }
  }, [isSuccess])

  if (isLoggedIn) {
    return (
      <WebsocketContext.Provider value={updatedSendMessage}>
        <>
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <ToolBar boardId={id} title={board?.title || ""} />
            <Board />
          </DragDropContext>
        </>
      </WebsocketContext.Provider>
    )
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}
      >
        <AccessBoardForm id={id} />
      </Box>
    </>
  )
}

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list) as T[]
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

export default BoardContainer
