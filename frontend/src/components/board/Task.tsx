import {
  Draggable,
  DraggableStateSnapshot,
  DraggableStyle,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot
} from "@hello-pangea/dnd"
import { EditNote } from "@mui/icons-material"
import { Box, IconButton, Paper, Popover, Tooltip, Typography } from "@mui/material"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { RootState } from "@/state/store"
import { SimpleScope, Task as TaskType, UserWithoutTicketsOrActions } from "@/types"

import { useAddTaskToScopeMutation, useDeleteTaskFromScopeMutation, useUpdateTaskMutation } from "../../state/apiSlice"

import TaskForm from "./TaskForm"
import UserMagnet from "./UserMagnet"

const dropStyle = (style: DraggableStyle | undefined, snapshot: DraggableStateSnapshot) => {
  if (!snapshot.isDropAnimating) {
    return style
  }

  return {
    ...style,
    transform: "scale(0)",
    transition: `all  ${0.01}s`
  }
}

const TaskUserList: React.FC<{ users: UserWithoutTicketsOrActions[]; taskid: string }> = ({ users, taskid }) => {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      {users.map((user, index) => (
        <Draggable key={user.userid + "/ticket"} draggableId={user.userid + "/" + taskid} index={index}>
          {(provided, snapshot) => {
            return (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                style={dropStyle(provided.draggableProps.style, snapshot)}
              >
                <UserMagnet user={user} editable={false} />
              </div>
            )
          }}
        </Draggable>
      ))}
    </div>
  )
}

interface FormData {
  taskTitle: string
  size?: number
  cornerNote?: string
  description?: string
  color?: string
}

const EditTaskButton: React.FC<{
  task: TaskType
  setTaskSelected: Dispatch<SetStateAction<boolean>>
  disabled?: boolean
}> = ({ task, setTaskSelected, disabled }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [updateTask] = useUpdateTaskMutation()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setTaskSelected(true)
    setAnchorEl(event.currentTarget)
  }

  const handleCancel = () => {
    setTaskSelected(false)
    setAnchorEl(null)
  }

  const handleClose = async (data: FormData | null) => {
    if (data) {
      handleSubmit(data)
    } else {
      handleCancel()
    }
  }

  const handleSubmit = async (data: FormData) => {
    setTaskSelected(false)
    setAnchorEl(null)
    const taskObject = {
      ticketid: task.ticketid,
      title: data.taskTitle,
      description: data.description,
      cornernote: data.cornerNote,
      size: data.size,
      color: data.color,
      columnid: task.columnid
    }
    await updateTask({ task: taskObject })
  }

  const open = Boolean(anchorEl)
  const popOverid = open ? "popover" : undefined
  return (
    <div>
      <Tooltip title="Edit card">
        <span>
          <IconButton size="small" onClick={handleClick} disabled={disabled}>
            <EditNote />
          </IconButton>
        </span>
      </Tooltip>
      <Popover
        disableRestoreFocus
        id={popOverid}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: 100,
          horizontal: -50
        }}
      >
        <Paper sx={{ height: "fit-content", padding: "20px", width: "400px" }}>
          <TaskForm
            formTitle={task.title}
            formType={"TaskEdit"}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onClose={handleClose}
            defaultValues={task}
          />
        </Paper>
      </Popover>
    </div>
  )
}

interface TaskProps {
  task: TaskType
  index: number
}

const Task: React.FC<TaskProps> = ({ task }) => {
  const selectedScope = useSelector((state: RootState) => state.scope)
  const isScopeSelected = Boolean(selectedScope)

  const [updateTask] = useUpdateTaskMutation()
  const [addTaskToScope] = useAddTaskToScopeMutation()
  const [deleteTaskFromScope] = useDeleteTaskFromScopeMutation()

  const [selected, setSelected] = useState(false)
  const [isEditingCornerNote, setIsEditingCornerNote] = useState(false)
  const [cornernote, setCornernote] = useState(task.cornernote)
  const [isTaskInSelectedScope, setIsTaskInSelectedScope] = useState(false)

  useEffect(() => {
    setCornernote(task.cornernote)
  }, [task.cornernote])

  useEffect(() => {
    if (task.scopes.some((scope) => scope.scopeid === selectedScope?.scopeid)) {
      setIsTaskInSelectedScope(true)
    } else {
      setIsTaskInSelectedScope(false)
    }
  }, [task.scopes, selectedScope])

  const handleDoubleClick = () => {
    if (!isScopeSelected) {
      setIsEditingCornerNote(true)
    }
  }

  const handleClick = () => {
    if (isScopeSelected) {
      if (!isTaskInSelectedScope) {
        addTaskToScope({ scope: selectedScope as SimpleScope, ticketid: task.ticketid })
      } else {
        deleteTaskFromScope({ scope: selectedScope as SimpleScope, ticketid: task.ticketid })
      }
    }
  }

  const handleBlur = async () => {
    const updatedTaskObject = {
      ...task,
      cornernote: cornernote
    }
    setIsEditingCornerNote(false)
    if (cornernote === task.cornernote) return
    await updateTask({ task: updatedTaskObject })

    //todo: send message to websocket
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    setCornernote(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleBlur()
    }
  }

  return (
    <Droppable droppableId={task.ticketid + "/ticket"} type="user" direction="vertical">
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
        return (
          <Box ref={provided.innerRef}>
            <Paper
              elevation={selected ? 24 : 4}
              onClick={handleClick}
              sx={{
                padding: "4px",
                backgroundColor: snapshot.isDraggingOver
                  ? "rgba(22, 95, 199, 0.2)"
                  : isTaskInSelectedScope
                    ? "#C0EE90"
                    : "white",
                height: "100px",
                marginBottom: "5px",
                borderColor:
                  (task.color === "white" || task.color === "#ffffff") && isTaskInSelectedScope
                    ? "#C0EE90"
                    : task.color,
                borderBottomWidth: "7px",
                borderBottomStyle: "solid",
                borderLeftWidth: "2px",
                borderLeftStyle: "solid",
                borderRightWidth: "2px",
                borderRightStyle: "solid",
                borderTopWidth: "2px",
                borderTopStyle: "solid",
                cursor: isScopeSelected ? "pointer" : "auto"
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", flexDirection: "column", height: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", overflow: "visible" }}>
                  <Box sx={{ overflow: "hidden", flexGrow: 1 }} onDoubleClick={handleDoubleClick}>
                    {isEditingCornerNote ? (
                      <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleBlur}>
                        <input
                          autoFocus
                          type="text"
                          value={cornernote}
                          onBlur={handleBlur}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                        />
                      </ClickAwayListener>
                    ) : (
                      <Typography
                        noWrap
                        variant={"body2"}
                        gutterBottom
                        width={"90%"}
                        sx={{ paddingTop: "6px", paddingLeft: "7px", color: "#2D3748" }}
                      >
                        {cornernote}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <EditTaskButton task={task} setTaskSelected={setSelected} disabled={isScopeSelected} />
                  </Box>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      overflow: "hidden",
                      textAlign: "center",
                      alignItems: "center"
                    }}
                  >
                    <Box
                      sx={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "85%",
                        padding: "0px 20px 0px 10px"
                      }}
                    >
                      <Typography variant={"body2"} gutterBottom sx={{ color: "#2D3748", wordWrap: "break-word" }}>
                        <strong>{task.title}</strong>
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ overflow: "hidden", width: "90%" }}>
                    <TaskUserList users={task.users} taskid={task.ticketid} />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "flex-end",
                      paddingRight: "15px",
                      paddingLeft: "7px",
                      paddingBottom: "3px"
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: "bold", fontSize: "17px", color: "#2D3748" }}>
                        {task.size}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              {provided.placeholder}
            </Paper>
          </Box>
        )
      }}
    </Droppable>
  )
}

export default Task
