import ToolBar from "@components/board/Toolbar"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { Box, GlobalStyles } from "@mui/material"
import { produce } from "immer"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import { setBoardId } from "@/state/auth"
import { store } from "@/state/store"
import { webSocketContainer } from "@/state/websocket"
import { Action, Task, User } from "@/types"

import AccessBoardForm from "../components/board/AccessBoardForm"
import Board from "../components/board/Board"
import {
  boardsApi,
  useDeleteUserFromActionMutation,
  useDeleteUserFromTicketMutation,
  useGetBoardQuery,
  useLoginMutation,
  usePostUserToActionMutation,
  usePostUserToTicketMutation,
  useUpdateActionListMutation,
  useUpdateColumnOrderMutation,
  useUpdateTaskListByColumnIdMutation
} from "../state/apiSlice"

const BoardContainer: React.FC = () => {
  const dispatch = useDispatch()
  const { id } = useParams()

  const [updateTaskList] = useUpdateTaskListByColumnIdMutation()
  const [updateColumns] = useUpdateColumnOrderMutation()
  const [postUserToTask] = usePostUserToTicketMutation()
  const [postUserToAction] = usePostUserToActionMutation()
  const [updateActions] = useUpdateActionListMutation()
  const [deleteUserFromTicket] = useDeleteUserFromTicketMutation()
  const [deleteUserFromAction] = useDeleteUserFromActionMutation()
  const [tryLogin] = useLoginMutation()
  const [isBoardIdSet, setIsBoardIdset] = useState(false)
  const [hasTriedEmptyPasswordLogin, setHasTriedEmptyPasswordLogin] = useState(false)
  const { data: board, isSuccess: isLoggedIn, isLoading } = useGetBoardQuery(id || "", { skip: !id || !isBoardIdSet })

  useEffect(() => {
    const inner = async () => {
      if (!id) return
      dispatch(setBoardId(id))
      setIsBoardIdset(true)
      await webSocketContainer.connectToBoard(id)
      webSocketContainer.setOnMessageHandler((tags) => {
        dispatch(boardsApi.util.invalidateTags(tags))
      })
      webSocketContainer.setResetHandler(() => {
        dispatch(boardsApi.util.resetApiState())
      })
    }
    inner()
  }, [id, dispatch])

  useEffect(() => {
    if (!id) return
    const inner = async () => {
      await tryLogin({ boardId: id, password: "" })
      setHasTriedEmptyPasswordLogin(true)
    }
    inner()
  }, [id, tryLogin])

  useEffect(() => {
    document.title = board?.title ? board?.title + " - Futuboard" : "Futuboard"
  }, [board])

  if (!id) {
    return null
  }

  const selectTasksByColumnId = boardsApi.endpoints.getTaskListByColumnId.select
  const selectActions = boardsApi.endpoints.getActionsByColumnId.select
  const selectColumns = boardsApi.endpoints.getColumnsByBoardId.select(id)

  const handleOnDragEnd = async (result: DropResult) => {
    const { source, destination, type, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const state = store.getState()

    if (type === "task") {
      const selectDestinationTasks = selectTasksByColumnId({ boardId: id, columnId: destination.droppableId })
      const destinationTasks = selectDestinationTasks(state).data || []

      const selectSourceTasks = selectTasksByColumnId({ boardId: id, columnId: source.droppableId })
      const sourceTasks = selectSourceTasks(state).data || []

      //dragging tasks in the same column
      if (destination.droppableId === source.droppableId) {
        const dataCopy = [...(destinationTasks ?? [])]
        const newOrdered = reorder<Task>(dataCopy, source.index, destination.index)
        await updateTaskList({ boardId: id, columnId: source.droppableId, tasks: newOrdered })
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
      }
    }

    if (type === "user") {
      const destinationType = destination.droppableId.split("/")[1]
      const sourceType = source.droppableId.split("/")[1]

      const destinationId = destination.droppableId.split("/")[0]
      const sourceId = source.droppableId.split("/")[0]

      const draggableIdParts = draggableId.split("/")
      const draggedUserId = draggableIdParts[0]

      if (sourceId === destinationId) {
        return
      }

      let destinationUsers: User[] = []

      const allUsers = boardsApi.endpoints.getUsersByBoardId.select(id)(state).data || []

      if (destinationType === "ticket") {
        destinationUsers = allUsers.filter((user) => user.tickets.includes(destinationId))
        if (destinationUsers.length >= 3) {
          alert("Destination task already has 3 or more user magnets. Move not allowed.")
          return
        }
      }

      if (destinationType === "action") {
        destinationUsers = allUsers.filter((user) => user.actions.includes(destinationId))
        if (destinationUsers.length >= 2) {
          alert("Destination action already has 2 or more user magnets. Move not allowed.")
          return
        }
      }

      const isUnique = !destinationUsers.some((user) => user.userid === draggedUserId)

      if (!isUnique && destinationId !== "user-list") {
        alert("This member is already on the card. Move not allowed.")
        return
      }

      if (sourceType === "ticket") {
        deleteUserFromTicket({ ticketId: sourceId, userid: draggedUserId })
      }

      if (sourceType === "action") {
        deleteUserFromAction({ actionId: sourceId, userid: draggedUserId })
      }

      if (destinationId === "user-list") {
        return
      }

      if (destinationType === "ticket") {
        postUserToTask({ ticketId: destinationId, userid: draggedUserId })
      }

      if (destinationType === "action") {
        postUserToAction({ actionId: destinationId, userid: draggedUserId })
      }
    }
    if (type.split("/")[0] === "SWIMLANE") {
      const [destSwimLaneColumnId, destTicketId, destColumnId] = destination.droppableId.split("/")

      const selectDestionationActions = selectActions(destColumnId)

      const destinationActions =
        selectDestionationActions(state).data?.filter(
          (a) => a.ticketid == destTicketId && a.swimlanecolumnid == destSwimLaneColumnId
        ) || []

      const [sourceSwimlaneColumnId, sourceTicketId, sourceColumnId] = source.droppableId.split("/")

      const selectSourceActions = selectActions(sourceColumnId)

      const sourceActions =
        selectSourceActions(state).data?.filter(
          (a) => a.ticketid == sourceTicketId && a.swimlanecolumnid == sourceSwimlaneColumnId
        ) || []

      if (destination.droppableId === source.droppableId && destination.index === source.index) return
      if (destination.droppableId === source.droppableId) {
        const dataCopy = [...(destinationActions ?? [])]
        const newOrdered = reorder<Action>(dataCopy, source.index, destination.index)
        await updateActions({
          taskId: destTicketId,
          swimlaneColumnId: destSwimLaneColumnId,
          actions: newOrdered,
          columnid: destColumnId
        })
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
            taskId: destTicketId,
            swimlaneColumnId: destSwimLaneColumnId,
            actions: nextDestinationActions ?? [],
            columnid: destColumnId
          }),
          updateActions({
            taskId: sourceTicketId,
            swimlaneColumnId: sourceSwimlaneColumnId,
            actions: nextSourceActions ?? [],
            columnid: sourceColumnId
          })
        ])
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
    }
  }

  if (isLoading || !hasTriedEmptyPasswordLogin) {
    return null
  }

  if (isLoggedIn) {
    return (
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <GlobalStyles styles={{ "#root": { backgroundColor: board.background_color || "white" } }} />
        <ToolBar boardId={id} title={board.title || ""} boardBackgroundColor={board.background_color || "white"} />
        <Board />
      </DragDropContext>
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
