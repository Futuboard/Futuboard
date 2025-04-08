import {
  Draggable,
  DraggableStateSnapshot,
  DraggableStyle,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot
} from "@hello-pangea/dnd"
import { Subject } from "@mui/icons-material"
import { Box, CircularProgress, Divider, Paper, Popover, Typography } from "@mui/material"
import React, { useEffect, useState } from "react"
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

const AcceptanceCriteria: React.FC<{ description: string }> = ({ description }) => {
  let done = 0
  let all = 0
  description.split("\n").forEach((line) => {
    if (line.charAt(2) == "[" && line.charAt(4) == "]") {
      all += 1
      if (line.charAt(3) == "x") done += 1
    }
  })

  if (all <= 0) return null

  const progress = Math.round((done / all) * 100)

  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        variant="determinate"
        value={progress}
        size={30}
        color={progress == 100 ? "success" : "primary"}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Typography sx={{ fontSize: 9, fontWeight: 700 }}>{`${progress}%`}</Typography>
      </Box>
    </Box>
  )
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

interface TaskProps {
  task: TaskType
  index: number
}

const Task: React.FC<TaskProps> = ({ task }) => {
  const selectedScope = useSelector((state: RootState) => state.scope)
  const isScopeSelected = Boolean(selectedScope)

  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null)

  const [updateTask] = useUpdateTaskMutation()
  const [addTaskToScope] = useAddTaskToScopeMutation()
  const [deleteTaskFromScope] = useDeleteTaskFromScopeMutation()

  const [selected, setSelected] = useState(false)
  const [cornernote, setCornernote] = useState(task.cornernote)
  const [isTaskInSelectedScope, setIsTaskInSelectedScope] = useState(false)

  const handleCancel = () => {
    setSelected(false)
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
    setSelected(false)
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

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isScopeSelected) {
      if (!isTaskInSelectedScope) {
        addTaskToScope({ scope: selectedScope as SimpleScope, ticketid: task.ticketid })
      } else {
        deleteTaskFromScope({ scope: selectedScope as SimpleScope, ticketid: task.ticketid })
      }
    } else {
      setSelected(true)
      setAnchorEl(e.currentTarget)
    }
  }

  return (
    <Droppable droppableId={task.ticketid + "/ticket"} type="user">
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
        return (
          <Box ref={provided.innerRef}>
            <Paper
              className="task"
              elevation={selected ? 24 : 4}
              onClick={(e) => handleClick(e)}
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
                cursor: "pointer",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                ":hover": {
                  filter: "brightness(0.97)"
                }
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  flexDirection: "column",
                  height: "100%",
                  width: "202px",
                  marginBottom: 0.5
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    height: "27px",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Typography
                    noWrap
                    variant={"body2"}
                    gutterBottom
                    sx={{
                      color: "#2D3748",
                      width: "80%",
                      textOverflow: "ellipsis",
                      marginLeft: "2px",
                      marginTop: "2px"
                    }}
                  >
                    {cornernote}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "50px"
                  }}
                >
                  <Typography
                    variant={"body2"}
                    gutterBottom
                    sx={{
                      color: "#2D3748",
                      wordBreak: "break-word",
                      width: "195px",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      textAlign: "center",
                      display: "-webkit-box",
                      WebkitLineClamp: "2",
                      WebkitBoxOrient: "vertical"
                    }}
                  >
                    <strong>{task.title}</strong>
                  </Typography>
                </Box>
                <Box sx={{ width: "100%", height: "24px" }}>
                  <TaskUserList users={task.users} taskid={task.ticketid} />
                </Box>
              </Box>
              <Divider orientation="vertical" />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column-reverse",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "35px",
                  height: "100%",
                  marginLeft: 0.25,
                  marginRight: -0.25,
                  textAlign: "center"
                }}
              >
                <Typography sx={{ fontWeight: "bold", fontSize: "16px", color: "#2D3748", width: "100%" }}>
                  {task.size}
                </Typography>
                <AcceptanceCriteria description={task.description || ""} />
                {task.description != "" && <Subject fontSize="small" color="disabled" />}
              </Box>

              {provided.placeholder}
            </Paper>
            <Popover
              disableRestoreFocus
              id={popOverid}
              open={open}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right"
              }}
              transformOrigin={{
                vertical: 100,
                horizontal: -40
              }}
            >
              <Paper sx={{ height: "fit-content", padding: "20px", maxWidth: "400px" }}>
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
          </Box>
        )
      }}
    </Droppable>
  )
}

export default Task
