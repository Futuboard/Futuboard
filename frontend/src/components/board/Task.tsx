import {
  Draggable,
  DraggableStateSnapshot,
  DraggableStyle,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot
} from "@hello-pangea/dnd"
import { EditNote } from "@mui/icons-material"
import { IconButton, Paper, Popover, Tooltip, Typography } from "@mui/material"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react"

import { WebsocketContext } from "@/pages/BoardContainer"

import { useGetUsersByTicketIdQuery, useUpdateTaskMutation } from "../../state/apiSlice"
import { Task as TaskType, User } from "../../types"

import TaskEditForm from "./TaskEditForm"
import UserMagnet from "./UserMagnet"

const CaretakerComponent: React.FC<{ caretaker: User }> = ({ caretaker }) => {
  return (
    <div>
      <Paper variant="outlined" sx={{ backgroundColor: caretaker.color || "lightgrey", padding: "0px 12px" }}>
        <Typography>{caretaker.name}</Typography>
      </Paper>
    </div>
  )
}

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

const TaskUserList: React.FC<{ users: User[]; taskid: string }> = ({ users, taskid }) => {
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
  corners?: User[]
  cornerNote?: string
  description?: string
  color?: string
}

const EditTaskButton: React.FC<{ task: TaskType; setTaskSelected: Dispatch<SetStateAction<boolean>> }> = ({
  task,
  setTaskSelected
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [updateTask] = useUpdateTaskMutation()
  const sendMessage = useContext(WebsocketContext)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setTaskSelected(true)
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setTaskSelected(false)
    setAnchorEl(null)
  }

  const handleOnSubmit = async (data: FormData) => {
    setTaskSelected(false)
    setAnchorEl(null)
    const taskObject = {
      ticketid: task.ticketid,
      title: data.taskTitle,
      description: data.description,
      cornernote: data.cornerNote,
      caretakers: data.corners,
      size: data.size,
      color: data.color,
      columnid: task.columnid
    }
    await updateTask({ task: taskObject })
    if (sendMessage !== null) {
      sendMessage("Task updated")
    }
  }
  const open = Boolean(anchorEl)
  const popOverid = open ? "popover" : undefined
  return (
    <div>
      <Tooltip title="Edit card">
        <IconButton size="small" onClick={handleClick}>
          <EditNote />
        </IconButton>
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
          <TaskEditForm onSubmit={handleOnSubmit} onCancel={handleClose} task={task} />
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
  const { data: users } = useGetUsersByTicketIdQuery(task.ticketid)

  const [updateTask] = useUpdateTaskMutation()
  const sendMessage = useContext(WebsocketContext)
  const [selected, setSelected] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [cornernote, setCornernote] = useState(task.cornernote)

  useEffect(() => {
    setCornernote(task.cornernote)
  }, [task.cornernote])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = async () => {
    const updatedTaskObject = {
      ...task,
      cornernote: cornernote
    }
    setIsEditing(false)
    if (cornernote === task.cornernote) return
    await updateTask({ task: updatedTaskObject })
    if (sendMessage !== null) {
      sendMessage("cornernote updated")
    }
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
          <div ref={provided.innerRef}>
            <Paper
              elevation={selected ? 24 : 4}
              sx={{
                padding: "4px",
                backgroundColor: snapshot.isDraggingOver ? "rgba(22, 95, 199, 0.2)" : "white",
                height: "100px",
                marginBottom: "5px",
                borderColor: task.color,
                borderBottomWidth: "7px",
                borderBottomStyle: "solid",
                borderLeftWidth: "2px",
                borderLeftStyle: "solid",
                borderRightWidth: "2px",
                borderRightStyle: "solid",
                borderTopWidth: "2px",
                borderTopStyle: "solid"
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", flexDirection: "column", height: "100%" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", overflow: "hidden" }}>
                  <div style={{ overflow: "hidden", flexGrow: 1 }} onDoubleClick={handleDoubleClick}>
                    {isEditing ? (
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
                        width={"70%"}
                        style={{ paddingTop: "6px", paddingLeft: "7px", color: "#2D3748" }}
                      >
                        {cornernote}
                      </Typography>
                    )}
                  </div>
                  <div>
                    <EditTaskButton task={task} setTaskSelected={setSelected} />
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      overflow: "hidden",
                      textAlign: "center",
                      alignItems: "center"
                    }}
                  >
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "85%",
                        padding: "0px 20px 0px 10px"
                      }}
                    >
                      <Typography variant={"body2"} gutterBottom style={{ color: "#2D3748" }}>
                        <strong>{task.title}</strong>
                      </Typography>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ overflow: "hidden" }}>
                    {task.caretakers &&
                      task.caretakers.map((caretaker, index) => (
                        <CaretakerComponent key={index} caretaker={caretaker} />
                      ))}
                  </div>
                  <div style={{ overflow: "hidden", width: "90%" }}>
                    {users && <TaskUserList users={users} taskid={task.ticketid} />}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "flex-end",
                      paddingRight: "15px",
                      paddingLeft: "7px",
                      paddingBottom: "3px"
                    }}
                  >
                    <div>
                      <Typography sx={{ fontWeight: "bold", fontSize: "17px", color: "#2D3748" }}>
                        {task.size}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
              {provided.placeholder}
            </Paper>
          </div>
        )
      }}
    </Droppable>
  )
}

export default Task
