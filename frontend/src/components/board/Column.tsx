import { Draggable, Droppable, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd"
import { Edit } from "@mui/icons-material"
import AddIcon from "@mui/icons-material/Add"
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos"
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"
import { Box, Dialog, DialogContent, Divider, IconButton, List, Popover, Tooltip, Typography } from "@mui/material"
import Paper from "@mui/material/Paper"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router"

import { RootState } from "@/state/store"
import type { Column, Task as TaskType, User, TaskTemplate, SimpleScope, NewAction, Board } from "@/types"

import { getId, parseAcceptanceCriteriaFromDescription } from "../../services/utils"
import {
  boardsApi,
  useAddTaskMutation,
  useGetTaskListByColumnIdQuery,
  useUpdateColumnMutation,
  useGetBoardQuery,
  useAddTaskToScopeMutation,
  useDeleteTaskFromScopeMutation,
  useGetSwimlaneColumnsByColumnIdQuery,
  usePostActionMutation
} from "../../state/apiSlice"

import ColumnEditForm from "./ColumnEditForm"
import SwimlaneContainer, { SwimlaneRowLayout } from "./SwimlaneContainer"
import {
  availableRowsHeight,
  balanceRowHeights,
  DEFAULT_CARD_HEIGHT,
  DEFAULT_ROW_HEIGHT,
  fitRowHeight
} from "./swimlaneRowFit"
import Task from "./Task"
import TaskForm from "./TaskForm"
import { SWIMLANE_BOARD_WIDTH, useTicketEditorDock } from "./ticketEditorDock"

interface FormData {
  taskTitle: string
  size?: number
  corners?: User[]
  description?: string
  cornerNote?: string
  color?: string
}

interface CreateTaskButtonProps {
  columnid: string
  board: Board
  hasSwimLaneColumns: boolean
}

const CreateTaskButton: React.FC<CreateTaskButtonProps> = ({ columnid, board, hasSwimLaneColumns }) => {
  const [defaultValues, setDefaultValues] = useState<TaskTemplate | null>(null)
  const [taskTemplate, setTaskTemplate] = useState<TaskTemplate | null>(null)

  const [addTask] = useAddTaskMutation()
  const { data: swimlaneColumns, isSuccess } = useGetSwimlaneColumnsByColumnIdQuery(columnid, {
    skip: !hasSwimLaneColumns
  })
  const [createAction] = usePostActionMutation()

  const [open, setOpen] = useState(false)

  const handleOpenDialog = () => {
    if ((!defaultValues && board) || JSON.stringify(defaultValues) === JSON.stringify(taskTemplate)) {
      const taskTemplate = {
        title: board?.default_ticket_title || "",
        description: board?.default_ticket_description || "",
        cornernote: board?.default_ticket_cornernote || "",
        corners: [],
        color: board?.default_ticket_color || "#ffffff",
        size: board?.default_ticket_size || undefined
      }
      setTaskTemplate(taskTemplate)
      setDefaultValues(taskTemplate)
    }
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
  }

  const handleClose = (data: FormData | null) => {
    if (data) {
      const newDefaultValues = {
        title: data.taskTitle || "",
        description: data.description || "",
        cornernote: data.cornerNote || "",
        corners: data.corners || [],
        color: data.color || "#ffffff",
        size: data.size ? data.size : undefined
      }
      if (JSON.stringify(newDefaultValues) !== JSON.stringify(taskTemplate)) {
        setDefaultValues(newDefaultValues)
      } else {
        setDefaultValues(null)
      }
    }
  }

  const handleCancel = () => {
    setDefaultValues(null)
    setOpen(false)
  }

  const handleSubmit = async (data: FormData) => {
    //task object cant be give type Task yet- problem with caretaker types
    //the object creation should be refactored to the TaskCreationForm component
    setDefaultValues(null)
    setOpen(false)
    const taskId = getId()
    const taskObject = {
      ticketid: taskId,
      title: data.taskTitle,
      description: data.description,
      caretakers: data.corners,
      size: data.size,
      columnid: columnid,
      color: data.color,
      cornernote: data.cornerNote
    }
    await addTask({ columnId: columnid, task: taskObject })

    if (isSuccess && swimlaneColumns.length) {
      const criteria: string[] = parseAcceptanceCriteriaFromDescription(data?.description)
      const cleanedCriteria = criteria.map((line) => line.slice(5).trim().replace("&#x20;", ""))

      cleanedCriteria.forEach(async (title) => {
        const action: NewAction = {
          title: title,
          columnid: columnid,
          actionid: getId(),
          ticketid: taskId,
          swimlanecolumnid: swimlaneColumns[0].swimlanecolumnid,
          order: 0
        }
        await createAction({ action })
      })
    }
  }
  return (
    <Box>
      <Tooltip title="Add Card">
        <IconButton color="primary" aria-label="add task" onClick={handleOpenDialog}>
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Dialog
        disableRestoreFocus
        open={open}
        onClose={handleCloseDialog}
        PaperProps={{ sx: { maxWidth: "600px", margin: 1 } }}
      >
        <DialogContent>
          <TaskForm
            formTitle={"Create Card"}
            formType={"TaskCreation"}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onClose={handleClose}
            defaultValues={defaultValues}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}

interface TaskListProps {
  column: Column
  templateDescription: string
  /** Rows of the swimlane view whose height differs from the default, by ticket id. */
  rowHeights?: Record<string, number>
}

const TaskList: React.FC<TaskListProps> = ({ column, templateDescription, rowHeights }) => {
  //get task list from server
  const { data: taskList, isLoading } = useGetTaskListByColumnIdQuery({ columnId: column.columnid })
  // Moving a ticket to another column remounts it, which would drop the unsaved edits of its docked editor
  const { docked } = useTicketEditorDock()

  const tasks = taskList
  if (isLoading) {
    return (
      <Typography variant={"body2"} gutterBottom>
        Loading cards...
      </Typography>
    )
  }

  return (
    <Droppable droppableId={column.columnid} type="task">
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
        return (
          <div
            ref={provided.innerRef}
            style={{
              backgroundColor: snapshot.isDraggingOver ? "rgba(22, 95, 199, 0.1)" : "transparent",
              minHeight: "74vh",
              height: "auto"
            }}
            {...provided.droppableProps}
          >
            {tasks && tasks.length ? (
              tasks.map((task: TaskType, index) => {
                // The card follows the height of its swimlane row: it stretches with expanded rows and
                // shrinks with rows fitted on screen, so both stay aligned.
                const rowHeight = rowHeights?.[task.ticketid]
                const cardHeight = rowHeight ? DEFAULT_CARD_HEIGHT + (rowHeight - DEFAULT_ROW_HEIGHT) : undefined
                return (
                  <Draggable
                    key={task.ticketid}
                    draggableId={task.ticketid}
                    index={index}
                    isDragDisabled={docked?.ticketId === task.ticketid}
                  >
                    {(provided) => {
                      return (
                        <List ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <Task
                            key={task.ticketid}
                            task={task}
                            index={index}
                            templateDescription={templateDescription}
                            cardHeight={cardHeight}
                          />
                        </List>
                      )
                    }}
                  </Draggable>
                )
              })
            ) : (
              <Typography
                variant={"body2"}
                gutterBottom
                style={{ textAlign: "center", paddingTop: "30px", color: "#2D3748" }}
              >
                No cards yet
              </Typography>
            )}
            {provided.placeholder}
          </div>
        )
      }}
    </Droppable>
  )
}

interface ColumnFormData {
  columnTitle: string
  columnWipLimit: number | null
  columnWipLimitStory: number | null
}

const EditColumnButton: React.FC<{ column: Column; disabled: boolean }> = ({ column, disabled }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [updateColumn] = useUpdateColumnMutation()
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleOnSubmit = async (data: ColumnFormData) => {
    const columnObject = {
      columnid: column.columnid,
      title: data.columnTitle,
      boardid: column.boardid,
      wip_limit: data.columnWipLimit,
      wip_limit_story: data.columnWipLimitStory
    }

    await updateColumn({ column: columnObject })
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const popOverid = open ? "popover" : undefined

  return (
    <div>
      <Tooltip title="Edit column">
        <IconButton size="small" onClick={handleClick} disabled={disabled}>
          <Edit />
        </IconButton>
      </Tooltip>
      <Popover
        disableRestoreFocus
        id={popOverid}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: 50,
          horizontal: -20
        }}
      >
        <Paper sx={{ height: "fit-content", padding: "20px", width: "220px" }}>
          <ColumnEditForm onSubmit={handleOnSubmit} onCancel={handleClose} column={column} />
        </Paper>
      </Popover>
    </div>
  )
}

/** Top of the swimlane rows (px from the viewport top) that contain, or whose header contains, this element. */
const rowsTopOf = (element: HTMLElement) => {
  const rows =
    element.closest("[data-swimlane-rows]") ??
    element.closest("[data-swimlane-container]")?.querySelector("[data-swimlane-rows]")
  return rows?.getBoundingClientRect().top ?? 0
}

/** How long an opened swimlane board takes to slide open or closed. */
const SWIMLANE_BOARD_TRANSITION_MS = 300

interface ColumnProps {
  column: Column
  index: number
}

const defaultTasks: TaskType[] = []

const Column: React.FC<ColumnProps> = ({ column, index }) => {
  const [addTaskToScope] = useAddTaskToScopeMutation()
  const [deleteTaskFromScope] = useDeleteTaskFromScopeMutation()

  const { id = "default-id" } = useParams()

  const [showSwimlanes, setShowSwimlanes] = useState(false)
  const { pushBoard } = useTicketEditorDock()

  const isSwimlaneColumn = column.swimlane || false // change this to column.swimlane boolean

  const selectTasksByColumnId = boardsApi.endpoints.getTaskListByColumnId.select

  const tasks = useSelector(
    (state: RootState) => selectTasksByColumnId({ columnId: column.columnid })(state).data || defaultTasks
  )
  const { data: board } = useGetBoardQuery(id)

  const selectedScope = useSelector((state: RootState) => state.scope)
  const isScopeSelected = Boolean(selectedScope)

  // --- swimlane row heights (see swimlaneRowFit.ts) ---
  const [neededRowHeights, setNeededRowHeights] = useState<Record<string, number>>({})
  // rows fitted by their own button (ticket id -> the cell whose button did it), or all rows fitted on
  // screen by the button in the swimlane header
  const [fittedRows, setFittedRows] = useState<Record<string, string>>({})
  const [allRowsFitted, setAllRowsFitted] = useState(false)
  // top of the rows (px from the viewport top), measured when a fit button is clicked
  const [rowsTop, setRowsTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)

  const ticketIds = useMemo(() => tasks.map((task) => task.ticketid), [tasks])
  // a fitted row ends by itself when its ticket leaves the column
  const activeFittedRows = useMemo(
    () => Object.fromEntries(Object.entries(fittedRows).filter(([ticketId]) => ticketIds.includes(ticketId))),
    [fittedRows, ticketIds]
  )
  const isFitting = allRowsFitted || Object.keys(activeFittedRows).length > 0

  useEffect(() => {
    if (!isFitting) return
    const handleResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isFitting])

  const handleNeededHeightChange = useCallback((ticketId: string, neededHeight: number) => {
    setNeededRowHeights((previous) =>
      previous[ticketId] === neededHeight ? previous : { ...previous, [ticketId]: neededHeight }
    )
  }, [])

  const handleToggleRowFit = useCallback((ticketId: string, cellKey: string, cellElement: HTMLElement) => {
    setFittedRows((previous) => {
      const next = { ...previous }
      if (next[ticketId]) delete next[ticketId]
      else next[ticketId] = cellKey
      return next
    })
    setRowsTop(rowsTopOf(cellElement))
    setViewportHeight(window.innerHeight)
  }, [])

  const handleToggleFitAll = (buttonElement: HTMLElement) => {
    if (allRowsFitted) {
      setAllRowsFitted(false)
      return
    }
    setFittedRows({})
    setRowsTop(rowsTopOf(buttonElement))
    setViewportHeight(window.innerHeight)
    setAllRowsFitted(true)
  }

  const rowHeights = useMemo((): Record<string, number> => {
    if (!showSwimlanes) return {}
    const budget = availableRowsHeight(rowsTop, viewportHeight)
    if (allRowsFitted) return balanceRowHeights(ticketIds, neededRowHeights, budget)
    return Object.fromEntries(
      Object.keys(activeFittedRows).map((ticketId) => [ticketId, fitRowHeight(neededRowHeights[ticketId], budget)])
    )
  }, [showSwimlanes, allRowsFitted, activeFittedRows, ticketIds, neededRowHeights, rowsTop, viewportHeight])

  const swimlaneRowLayout: SwimlaneRowLayout = {
    rowHeights,
    onNeededHeightChange: handleNeededHeightChange,
    fit: { allRowsFitted, fittedRows: activeFittedRows, onToggleRow: handleToggleRowFit },
    fitAll: { active: allRowsFitted, onClick: handleToggleFitAll }
  }

  const toggleSwimlanes = (event: React.MouseEvent<HTMLElement>) => {
    // Hiding the swimlanes ends fitting, so the backlog returns to its default layout
    setFittedRows({})
    setAllRowsFitted(false)
    setShowSwimlanes(!showSwimlanes)
    // A docked editor after this column moves by the width of the swimlane board
    pushBoard(
      event.currentTarget,
      showSwimlanes ? -SWIMLANE_BOARD_WIDTH : SWIMLANE_BOARD_WIDTH,
      SWIMLANE_BOARD_TRANSITION_MS
    )
  }

  const sizeSum = useMemo(() => tasks.reduce((sum, task) => sum + Number(task.size), 0), [tasks])
  const taskNum = useMemo(() => tasks.length, [tasks])

  const handleClick = () => {
    if (tasks && isScopeSelected) {
      // Check if selectedScope is in every task
      if (tasks.every((task: TaskType) => task.scopes.some((scope) => scope.scopeid === selectedScope?.scopeid))) {
        // Remove every task in column from selectedScope
        tasks.forEach((task: TaskType) => {
          deleteTaskFromScope({ scope: selectedScope as SimpleScope, ticketid: task.ticketid })
        })
      } else {
        tasks.forEach((task: TaskType) => {
          addTaskToScope({ scope: selectedScope as SimpleScope, ticket: task })
        })
      }
    }
  }

  if (!board) return null

  let bgColor = isScopeSelected ? "#beb7b5" : "#e5dbd9"
  let titleBgColor = "#e5dbd9"

  // change border color when task or size limit is exceeded
  if (
    (column.wip_limit && taskNum > column.wip_limit) ||
    (column.wip_limit_story && sizeSum > column.wip_limit_story)
  ) {
    bgColor = isScopeSelected ? "#d63838" : "#ff4747"
    titleBgColor = isScopeSelected ? "#fa9b9b" : "#ff4747"
  }

  return (
    <Draggable draggableId={column.columnid} index={index}>
      {(provided) => (
        <Box {...provided.draggableProps} ref={provided.innerRef} sx={{ display: "flex", flexDirection: "row" }}>
          <Paper
            elevation={4}
            sx={{
              marginX: "20px",
              width: "250px",
              minHeight: "74vh",
              height: "fit-content",
              backgroundColor: bgColor,
              padding: "4px",
              border: "2px solid #000",
              borderBottom: "5px solid #000",
              borderColor: "rgba(0, 0, 0, 0.12)"
            }}
          >
            <div
              {...provided.dragHandleProps}
              style={{
                display: "grid",
                gridTemplateColumns: isSwimlaneColumn ? "1fr auto auto" : "1fr auto",
                alignItems: "center",
                padding: "3px",
                marginBottom: "2px",
                backgroundColor: titleBgColor,
                cursor: isScopeSelected ? "pointer" : "grab",
                borderRadius: "3px",
                height: "40px"
              }}
              onClick={handleClick}
            >
              <Typography variant={"h5"} noWrap sx={{ paddingLeft: "3px", color: "#2D3748" }}>
                {column.title}
              </Typography>
              <EditColumnButton column={column} disabled={isScopeSelected} />
              {isSwimlaneColumn && (
                <IconButton
                  color="primary"
                  aria-label="expand swimlane"
                  onClick={toggleSwimlanes}
                  disabled={isScopeSelected}
                >
                  {showSwimlanes ? <ArrowBackIosIcon /> : <ArrowForwardIosIcon />}
                </IconButton>
              )}
            </div>
            <Divider />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingRight: "13px",
                paddingBottom: "4px",
                paddingTop: "4px"
              }}
            >
              <CreateTaskButton columnid={column.columnid} board={board} hasSwimLaneColumns={isSwimlaneColumn} />
              <Typography title={"Number of tasks"} sx={{ fontSize: "17px", color: "#2D3748" }}>
                {column.wip_limit ? `${taskNum} / ${column.wip_limit}` : taskNum}
              </Typography>
              <Typography title={"Total size of tasks"} sx={{ fontSize: "17px", color: "#2D3748" }}>
                {column.wip_limit_story ? `${sizeSum} / ${column.wip_limit_story}` : sizeSum}
              </Typography>
            </div>
            <Divider />
            <div>
              <TaskList
                column={column}
                templateDescription={board?.default_ticket_description || ""}
                rowHeights={rowHeights}
              />
            </div>
          </Paper>
          <Box sx={{ overflowX: "hidden", height: "fit-content" }}>
            <Box
              sx={{
                width: showSwimlanes ? `${SWIMLANE_BOARD_WIDTH}px` : "0px",
                transition: `width ${SWIMLANE_BOARD_TRANSITION_MS}ms ease`
              }}
            >
              {showSwimlanes && <SwimlaneContainer column={column} rowLayout={swimlaneRowLayout} />}
            </Box>
          </Box>
        </Box>
      )}
    </Draggable>
  )
}

export default Column
