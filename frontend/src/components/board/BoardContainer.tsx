import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { produce } from "immer"

import Board from "@/components/board/Board"
import ToolBar from "@/components/board/Toolbar"
import { setNotification } from "@/state/notification"
import { store } from "@/state/store"
import { Action, Task, User, Board as BoardType } from "@/types"

import {
  boardsApi,
  useDeleteUserFromActionMutation,
  useDeleteUserFromTicketMutation,
  usePostUserToActionMutation,
  usePostUserToTicketMutation,
  useUpdateActionListMutation,
  useUpdateColumnOrderMutation,
  useUpdateTaskListByColumnIdMutation
} from "../../state/apiSlice"

import BoardNotes from "./BoardNotes"

type BoardProps = {
  board: BoardType
}

const BoardContainer: React.FC<BoardProps> = ({ board }) => {
  const [updateTaskList] = useUpdateTaskListByColumnIdMutation()
  const [updateColumns] = useUpdateColumnOrderMutation()
  const [postUserToTask] = usePostUserToTicketMutation()
  const [postUserToAction] = usePostUserToActionMutation()
  const [updateActions] = useUpdateActionListMutation()
  const [deleteUserFromTicket] = useDeleteUserFromTicketMutation()
  const [deleteUserFromAction] = useDeleteUserFromActionMutation()

  const boardId = board.boardid

  const selectTasksByColumnId = boardsApi.endpoints.getTaskListByColumnId.select
  const selectActions = boardsApi.endpoints.getActionsByColumnId.select
  const selectColumns = boardsApi.endpoints.getColumnsByBoardId.select(boardId)

  const handleOnDragEnd = async (result: DropResult) => {
    const { source, destination, type, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const state = store.getState()

    if (type === "task") {
      const selectDestinationTasks = selectTasksByColumnId({ boardId, columnId: destination.droppableId })
      const destinationTasks = selectDestinationTasks(state).data || []

      const selectSourceTasks = selectTasksByColumnId({ boardId, columnId: source.droppableId })
      const sourceTasks = selectSourceTasks(state).data || []

      //dragging tasks in the same column
      if (destination.droppableId === source.droppableId) {
        const dataCopy = [...(destinationTasks ?? [])]
        const newOrdered = reorder<Task>(dataCopy, source.index, destination.index)
        await updateTaskList({ boardId, columnId: source.droppableId, tasks: newOrdered })
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
          updateTaskList({ boardId, columnId: destination.droppableId, tasks: nextDestinationTasks ?? [] }),
          updateTaskList({ boardId, columnId: source.droppableId, tasks: nextSourceTasks ?? [] })
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

      const allUsers = boardsApi.endpoints.getUsersByBoardId.select(boardId)(state).data || []

      if (destinationType === "ticket") {
        destinationUsers = allUsers.filter((user) => user.tickets.includes(destinationId))
        if (destinationUsers.length >= 3) {
          store.dispatch(
            setNotification({
              text: "Destination card already has 3 or more user magnets. Move not allowed.",
              type: "info"
            })
          )
          return
        }
      }

      if (destinationType === "action") {
        destinationUsers = allUsers.filter((user) => user.actions.includes(destinationId))
        if (destinationUsers.length >= 2) {
          store.dispatch(
            setNotification({
              text: "Destination action already has 2 or more user magnets. Move not allowed.",
              type: "info"
            })
          )
          return
        }
      }

      const isUnique = !destinationUsers.some((user) => user.userid === draggedUserId)

      if (!isUnique && destinationId !== "user-list") {
        store.dispatch(setNotification({ text: "This member is already on the card. Move not allowed.", type: "info" }))
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
      await updateColumns({ boardId, columns: newOrdered })
    }
  }

  const taskTemplateValues = {
    title: board?.default_ticket_title || "",
    description: board?.default_ticket_description || "",
    cornernote: board?.default_ticket_cornernote || "",
    color: board?.default_ticket_color || "",
    size: board?.default_ticket_size || undefined
  }

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <ToolBar
        boardId={boardId}
        title={board.title}
        taskTemplate={taskTemplateValues}
        boardBackgroundColor={board.background_color}
      />
      <Board />
      <BoardNotes content={board.notes} boardId={board.boardid} />
    </DragDropContext>
  )
}

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list) as T[]
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

export default BoardContainer
