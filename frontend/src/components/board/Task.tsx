import { Draggable, Droppable, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd"
import { Subject } from "@mui/icons-material"
import { Box, Divider, Paper, Typography } from "@mui/material"
import React, { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useSelector } from "react-redux"

import { skipDropAnimationStyle } from "@/services/dragState"
import { parseAcceptanceCriteriaFromDescription } from "@/services/utils"
import { RootState } from "@/state/store"
import { SimpleScope, Task as TaskType, UserWithoutTicketsOrActions } from "@/types"

import { useAddTaskToScopeMutation, useDeleteTaskFromScopeMutation, useUpdateTaskMutation } from "../../state/apiSlice"

import TaskForm from "./TaskForm"
import { KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE, TicketEditorPlacement, useTicketEditorDock } from "./ticketEditorDock"
import { DockedEditorFrame, FloatingEditorFrame } from "./TicketEditorFrames"
import UserMagnet from "./UserMagnet"

const TaskUserList: React.FC<{ users: UserWithoutTicketsOrActions[]; taskid: string }> = ({ users, taskid }) => {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {users.map((user, index) => (
        <Draggable key={user.userid + "/ticket"} draggableId={user.userid + "/" + taskid} index={index}>
          {(provided, snapshot) => {
            return (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                style={skipDropAnimationStyle(provided.draggableProps.style, snapshot)}
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
  templateDescription: string
  /**
   * Card height in px, set by the swimlane row fitting so the card stretches or compresses
   * with its swimlane row. Taller cards show more title lines; below the default height only the
   * title and size are shown.
   */
  cardHeight?: number
}

const DEFAULT_CARD_HEIGHT = 100

const Task: React.FC<TaskProps> = ({ task, templateDescription, cardHeight = DEFAULT_CARD_HEIGHT }) => {
  const compact = cardHeight < DEFAULT_CARD_HEIGHT
  const extraHeight = Math.max(0, cardHeight - DEFAULT_CARD_HEIGHT)
  const titleLineHeight = 20 // body2
  const titleLines = compact ? (cardHeight < 56 ? 1 : 2) : 2 + Math.floor(extraHeight / titleLineHeight)
  const selectedScope = useSelector((state: RootState) => state.scope)
  const isScopeSelected = Boolean(selectedScope)

  const [updateTask] = useUpdateTaskMutation()
  const [addTaskToScope] = useAddTaskToScopeMutation()
  const [deleteTaskFromScope] = useDeleteTaskFromScopeMutation()

  // The editor is closed, floating over the board, or docked into the board's row of columns
  const [editorPlacement, setEditorPlacement] = useState<TicketEditorPlacement | null>(null)
  // Bumped to make the editor close itself as if clicked away (it saves changes), e.g. when another
  // ticket's editor takes the dock
  const [closeEditorSignal, setCloseEditorSignal] = useState(0)
  const { docked, dock, undock, slot } = useTicketEditorDock()
  // The form renders into this node, which moves between the floating and the docked frame, so the
  // form keeps its unsaved changes when it is docked
  const [editorNode] = useState(() => document.createElement("div"))
  const hostEditor = useCallback(
    (host: HTMLElement | null) => {
      if (host && editorNode.parentElement !== host) host.appendChild(editorNode)
    },
    [editorNode]
  )
  const selected = editorPlacement !== null

  const [cornernote, setCornernote] = useState(task.cornernote)
  const [isTaskInSelectedScope, setIsTaskInSelectedScope] = useState(false)

  const closeEditor = () => {
    setEditorPlacement(null)
    undock(task.ticketid)
    // the next form mounts fresh: a leftover signal would close it right away
    setCloseEditorSignal(0)
  }

  const handleDock = () => {
    setEditorPlacement("docked")
    dock(task.ticketid, task.columnid)
  }

  // Another ticket's editor was docked: this one closes
  const isDockedHere = docked?.ticketId === task.ticketid
  useEffect(() => {
    if (editorPlacement === "docked" && !isDockedHere) setCloseEditorSignal((signal) => signal + 1)
  }, [editorPlacement, isDockedHere])

  // A ticket moved to another column remounts there: free the dock
  useEffect(() => () => undock(task.ticketid), [undock, task.ticketid])

  const handleClose = async (data: FormData | null) => {
    if (data) {
      handleSubmit(data)
    } else {
      closeEditor()
    }
  }

  const handleSubmit = async (data: FormData) => {
    closeEditor()
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

  const handleClick = () => {
    if (isScopeSelected) {
      if (!isTaskInSelectedScope) {
        addTaskToScope({ scope: selectedScope as SimpleScope, ticket: task })
      } else {
        deleteTaskFromScope({ scope: selectedScope as SimpleScope, ticketid: task.ticketid })
      }
    } else if (!editorPlacement) {
      setEditorPlacement("floating")
    }
  }

  const all = parseAcceptanceCriteriaFromDescription(task.description)
  let done = 0
  all.forEach((line) => {
    if (line.charAt(3) == "x") done += 1
  })

  return (
    <Droppable droppableId={task.ticketid + "/ticket"} type="user" direction="horizontal">
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
        return (
          <Box ref={provided.innerRef}>
            <Paper
              className="task"
              elevation={selected ? 24 : 4}
              // While its editor is open, the card doesn't count as "outside" it: a click on the card
              // would save and close the editor, then reopen it at once with the not yet saved values
              {...(selected ? { [KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE]: "" } : {})}
              onClick={handleClick}
              sx={{
                padding: "4px",
                backgroundColor: snapshot.isDraggingOver
                  ? "rgba(22, 95, 199, 0.2)"
                  : isTaskInSelectedScope
                    ? "#C0EE90"
                    : "white",
                height: `${cardHeight}px`,
                overflow: compact ? "hidden" : undefined,
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
                  width: "202px"
                }}
              >
                {!compact && (
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
                        width: "90%",
                        textOverflow: "ellipsis",
                        marginLeft: "2px",
                        marginTop: "2px"
                      }}
                    >
                      {cornernote}
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: compact ? "100%" : `${50 + extraHeight}px`
                  }}
                >
                  <Typography
                    variant={"body2"}
                    sx={{
                      color: "#2D3748",
                      wordBreak: "break-word",
                      width: "195px",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      textAlign: "center",
                      display: "-webkit-box",
                      WebkitLineClamp: String(titleLines),
                      WebkitBoxOrient: "vertical"
                    }}
                  >
                    <strong>{task.title}</strong>
                  </Typography>
                </Box>
                {!compact && (
                  <Box
                    sx={{
                      width: "210px",
                      height: "30px",
                      marginBottom: "-2px",
                      marginLeft: "-6px",
                      overflow: "hidden"
                    }}
                  >
                    <TaskUserList users={task.users} taskid={task.ticketid} />
                  </Box>
                )}
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
                  textAlign: "center",
                  marginLeft: "1px"
                }}
              >
                <Typography
                  sx={{ fontWeight: "bold", fontSize: "16px", color: "#2D3748", width: "35px", textAlign: "center" }}
                >
                  {task.size}
                </Typography>
                {!compact && all.length > 0 && (
                  <Typography sx={{ fontSize: "13px", fontWeight: "bold", marginBottom: "-4px", color: "#7f7f80" }}>
                    {`${Math.round((done / all.length) * 100)}%`}
                  </Typography>
                )}
                {!compact &&
                  ((task.description != "" && task.description != templateDescription) || all.length > 0) && (
                    <Subject fontSize="small" color="disabled" />
                  )}
              </Box>

              {provided.placeholder}
            </Paper>
            {/* fragment: the portals aren't ReactNodes to MUI's Box prop types */}
            <>
              {editorPlacement &&
                createPortal(
                  <TaskForm
                    formTitle={task.title}
                    formType={"TaskEdit"}
                    onSubmit={handleSubmit}
                    onCancel={closeEditor}
                    onClose={handleClose}
                    defaultValues={task}
                    placement={editorPlacement}
                    onDock={handleDock}
                    closeSignal={closeEditorSignal}
                  />,
                  editorNode
                )}
              {editorPlacement === "floating" && <FloatingEditorFrame hostRef={hostEditor} />}
              {editorPlacement === "docked" && isDockedHere && slot && (
                <DockedEditorFrame slot={slot} hostRef={hostEditor} />
              )}
            </>
          </Box>
        )
      }}
    </Droppable>
  )
}

export default Task
