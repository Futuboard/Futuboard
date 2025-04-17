import { Draggable, Droppable, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd"
import { Edit } from "@mui/icons-material"
import AddIcon from "@mui/icons-material/Add"
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos"
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"
import { Box, Dialog, DialogContent, Divider, IconButton, List, Popover, Tooltip, Typography } from "@mui/material"
import Paper from "@mui/material/Paper"
import { useMemo, useState } from "react"
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
import SwimlaneContainer from "./SwimlaneContainer"
import Task from "./Task"
import TaskForm from "./TaskForm"

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
}

const CreateTaskButton: React.FC<CreateTaskButtonProps> = ({ columnid, board }) => {
  const [defaultValues, setDefaultValues] = useState<TaskTemplate | null>(null)
  const [taskTemplate, setTaskTemplate] = useState<TaskTemplate | null>(null)

  const [addTask] = useAddTaskMutation()
  const { data: swimlaneColumns, isSuccess } = useGetSwimlaneColumnsByColumnIdQuery(columnid)
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
    await addTask({ boardId: board.boardid, columnId: columnid, task: taskObject })

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

    setOpen(false)
    setDefaultValues(null)
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
}

const TaskList: React.FC<TaskListProps> = ({ column, templateDescription }) => {
  //get task list from server
  const { data: taskList, isLoading } = useGetTaskListByColumnIdQuery({
    boardId: column.boardid,
    columnId: column.columnid
  })

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
              tasks.map((task: TaskType, index) => (
                <Draggable key={task.ticketid} draggableId={task.ticketid} index={index}>
                  {(provided) => {
                    return (
                      <List ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <Task key={task.ticketid} task={task} index={index} templateDescription={templateDescription} />
                      </List>
                    )
                  }}
                </Draggable>
              ))
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

interface ColumnProps {
  column: Column
  index: number
}

const defaultTasks: TaskType[] = []

const Column: React.FC<ColumnProps> = ({ column, index }) => {
  const [addTaskToScope] = useAddTaskToScopeMutation()
  const [deleteTaskFromScope] = useDeleteTaskFromScopeMutation()

  const [showSwimlanes, setShowSwimlanes] = useState(false)

  const isSwimlaneColumn = column.swimlane || false // change this to column.swimlane boolean
  const { id = "default-id" } = useParams()

  const selectTasksByColumnId = boardsApi.endpoints.getTaskListByColumnId.select

  const tasks = useSelector(
    (state: RootState) => selectTasksByColumnId({ boardId: id, columnId: column.columnid })(state).data || defaultTasks
  )
  const { data: board } = useGetBoardQuery(id)

  const selectedScope = useSelector((state: RootState) => state.scope)
  const isScopeSelected = Boolean(selectedScope)

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
          addTaskToScope({ scope: selectedScope as SimpleScope, ticketid: task.ticketid })
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
                  onClick={() => setShowSwimlanes(!showSwimlanes)}
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
              <CreateTaskButton columnid={column.columnid} board={board} />
              <Typography title={"Number of tasks"} sx={{ fontSize: "17px", color: "#2D3748" }}>
                {column.wip_limit ? `${taskNum} / ${column.wip_limit}` : taskNum}
              </Typography>
              <Typography title={"Total size of tasks"} sx={{ fontSize: "17px", color: "#2D3748" }}>
                {column.wip_limit_story ? `${sizeSum} / ${column.wip_limit_story}` : sizeSum}
              </Typography>
            </div>
            <Divider />
            <div>
              <TaskList column={column} templateDescription={board?.default_ticket_description || ""} />
            </div>
          </Paper>
          <Box sx={{ overflowX: "hidden", height: "fit-content" }}>
            <Box sx={{ width: showSwimlanes ? "900px" : "0px", transition: "width 300ms" }}>
              {showSwimlanes && <SwimlaneContainer column={column} />}
            </Box>
          </Box>
        </Box>
      )}
    </Draggable>
  )
}

export default Column
