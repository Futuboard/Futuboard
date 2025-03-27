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
import type { Column, Task as TaskType, User, TaskTemplate } from "@/types"

import { getId } from "../../services/Utils"
import {
  boardsApi,
  useAddTaskMutation,
  useGetTaskListByColumnIdQuery,
  useUpdateColumnMutation,
  useGetBoardQuery
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
}

const CreateTaskButton: React.FC<CreateTaskButtonProps> = ({ columnid }) => {
  const { id = "default-id" } = useParams()
  const [defaultValues, setDefaultValues] = useState<TaskTemplate | null>(null)
  const [taskTemplate, setTaskTemplate] = useState<TaskTemplate | null>(null)

  const [addTask] = useAddTaskMutation()

  const [open, setOpen] = useState(false)

  const { data: board } = useGetBoardQuery(id)

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

  const handleSubmit = (data: FormData) => {
    //task object cant be give type Task yet- problem with caretaker types
    //the object creation should be refactored to the TaskCreationForm component
    const taskObject = {
      ticketid: getId(),
      title: data.taskTitle,
      description: data.description,
      caretakers: data.corners,
      size: data.size,
      columnid: columnid,
      boardid: id,
      color: data.color,
      cornernote: data.cornerNote
    }

    const add$ = addTask({ boardId: id, columnId: columnid, task: taskObject })
    add$
      .unwrap()
      .then(() => {
        setOpen(false)
      })
      .catch((error) => {
        console.error(error)
      })
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
        PaperProps={{
          style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }
        }}
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
}

const TaskList: React.FC<TaskListProps> = ({ column }) => {
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
                        <Task key={task.ticketid} task={task} index={index} />
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

const EditColumnButton: React.FC<{ column: Column }> = ({ column }) => {
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
        <IconButton size="small" onClick={handleClick}>
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
        <Paper sx={{ height: "fit-content", padding: "20px", width: "200px" }}>
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
  const [showSwimlanes, setShowSwimlanes] = useState(false)

  const isSwimlaneColumn = column.swimlane || false // change this to column.swimlane boolean
  const { id = "default-id" } = useParams()

  const selectTasksByColumnId = boardsApi.endpoints.getTaskListByColumnId.select

  const tasks = useSelector(
    (state: RootState) => selectTasksByColumnId({ boardId: id, columnId: column.columnid })(state).data || defaultTasks
  )

  const sizeSum = useMemo(() => tasks.reduce((sum, task) => sum + Number(task.size), 0), [tasks])

  const taskNum = useMemo(() => tasks.length, [tasks])

  let bgColor = "#E5DBD9"

  // change border color when task or size limit is exceeded
  if (
    (column.wip_limit && taskNum > column.wip_limit) ||
    (column.wip_limit_story && sizeSum > column.wip_limit_story)
  ) {
    bgColor = "#FF4747"
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
            <div {...provided.dragHandleProps} style={{ display: "grid", gridTemplateColumns: isSwimlaneColumn ? "1fr auto auto" : "1fr auto", alignItems: "center",}}>
              <Typography variant={"h5"} noWrap sx={{ paddingLeft: "3px", color: "#2D3748" }}>
                {column.title}
              </Typography>
              <EditColumnButton column={column} />
              {isSwimlaneColumn && (
                <IconButton
                  color="primary"
                  aria-label="expand swimlane"
                  onClick={() => setShowSwimlanes(!showSwimlanes)}
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
              <CreateTaskButton columnid={column.columnid} />
              <Typography title={"Number of tasks"} sx={{ fontSize: "17px", color: "#2D3748" }}>
                {column.wip_limit ? `${taskNum} / ${column.wip_limit}` : taskNum}
              </Typography>
              <Typography title={"Total size of tasks"} sx={{ fontSize: "17px", color: "#2D3748" }}>
                {column.wip_limit_story ? `${sizeSum} / ${column.wip_limit_story}` : sizeSum}
              </Typography>
            </div>
            <Divider />
            <div>
              <TaskList column={column} />
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
