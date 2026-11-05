import { Draggable, Droppable } from "@hello-pangea/dnd"
import { Box, ClickAwayListener, Typography } from "@mui/material"
import React, { useEffect, useLayoutEffect, useRef, useState } from "react"

import { skipDropAnimationStyle } from "@/services/dragState"
import { useDeleteActionMutation, useUpdateActionMutation } from "@/state/apiSlice"
import { Action as ActionType, UserWithoutTicketsOrActions } from "@/types"

import UserMagnet from "./UserMagnet"

const ActionUserList: React.FC<{ users: UserWithoutTicketsOrActions[]; actionid: string }> = ({ users, actionid }) => {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", overflow: "hidden" }}>
      {users &&
        users.map((user, index) => (
          <Draggable key={user.userid} draggableId={user.userid + "/" + actionid} index={index}>
            {(provided, snapshot) => {
              return (
                <div
                  key={user.userid}
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

// Height the title may use when the cell has no spare room. Matches the old fixed truncation.
export const COLLAPSED_TITLE_MAX_HEIGHT = 50

interface ActionProps {
  action: ActionType
  index: number
  /**
   * How many title lines to show. Undefined keeps the default truncation (one line with magnets,
   * otherwise up to COLLAPSED_TITLE_MAX_HEIGHT). Infinity shows the whole title.
   * Set by the swimlane cell when it has free space.
   */
  titleLines?: number
}

const titleSx = (titleLines: number | undefined, hasUsers: boolean) => {
  if (titleLines === Infinity) {
    return {}
  }
  if (titleLines === undefined && !hasUsers) {
    return { maxHeight: COLLAPSED_TITLE_MAX_HEIGHT, overflow: "hidden" }
  }
  return {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: String(titleLines ?? 1),
    overflow: "hidden"
  }
}

const Action: React.FC<ActionProps> = ({ action, index, titleLines }) => {
  const [isEditing, setIsEditingState] = useState(false)
  const [isHighlighted, setIsHighlightedState] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(action.title)

  const [updateAction] = useUpdateActionMutation()
  const [deleteAction] = useDeleteActionMutation()

  const setIsEditing = (value: boolean) => {
    if (value) {
      setIsHighlightedState(false)
    }
    setIsEditingState(value)
  }

  const setIsHighlighted = (value: boolean) => {
    if (!isEditing) {
      setIsHighlightedState(value)
    }
  }

  useEffect(() => {
    setCurrentTitle(action.title)
  }, [action.title])

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (isHighlighted && event.key === "Delete") {
        await deleteAction({ actionid: action.actionid })
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isHighlighted, action.actionid, deleteAction])

  const handleClick = () => {
    setIsHighlighted(true)
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = async () => {
    setIsEditing(false)
    setIsHighlighted(false)

    if (currentTitle === action.title) {
      return
    } else if (currentTitle === "") {
      await deleteAction({ actionid: action.actionid })
    } else {
      const updatedAction = { ...action, title: currentTitle }
      await updateAction({ action: updatedAction })
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault()
    setCurrentTitle(event.target.value)
  }

  // The edit field grows with its text, so a long title stays fully visible while editing
  const editFieldRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const field = editFieldRef.current
    if (!isEditing || !field) return
    field.style.height = "auto"
    field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`
  }, [isEditing, currentTitle])

  const handleKeyDownInput = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      // titles are single paragraphs: Enter saves instead of adding a line break
      event.preventDefault()
      handleBlur()
    }
  }

  return (
    <Draggable key={action.actionid} draggableId={action.actionid} index={index}>
      {(provided) => (
        <Box
          boxShadow={1}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-action-card={action.actionid}
          data-action-has-users={action.users.length > 0}
          sx={{
            backgroundColor: isHighlighted ? "#d3d3d3" : "white",
            marginBottom: "2px",
            borderRadius: "4px",
            borderWidth: "2px"
          }}
        >
          <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleBlur}>
            {isEditing ? (
              <textarea
                ref={editFieldRef}
                name={"actionTitle"}
                autoFocus
                rows={1}
                value={currentTitle}
                onFocus={(event) => event.currentTarget.setSelectionRange(currentTitle.length, currentTitle.length)}
                onBlur={handleBlur}
                onChange={handleChange}
                onKeyDown={handleKeyDownInput}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "4px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  resize: "none",
                  overflow: "hidden"
                }}
              />
            ) : (
              <div title={currentTitle}>
                <Droppable droppableId={action.actionid + "/action"} type="user">
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: "20px",
                        backgroundColor: snapshot.isDraggingOver ? "lightblue" : "transparent",
                        // Default cap kept from the old layout. It also clips a magnet drop placeholder during drags.
                        maxHeight: titleLines === undefined ? `${COLLAPSED_TITLE_MAX_HEIGHT}px` : undefined,
                        overflow: "hidden",
                        padding: "2px"
                      }}
                    >
                      {/* with users the title defaults to a single row to save space */}
                      <Typography
                        variant={"body1"}
                        fontSize={12}
                        data-action-title
                        sx={{ overflowWrap: "anywhere", ...titleSx(titleLines, action.users.length > 0) }}
                      >
                        {currentTitle}
                      </Typography>
                      {action.users.length > 0 && <ActionUserList users={action.users} actionid={action.actionid} />}

                      {titleLines === undefined ? (
                        provided.placeholder
                      ) : (
                        // An expanded card has no height cap, so keep the magnet drop placeholder out
                        // of the flow: growing mid-drag would shift drop targets the dnd library cached.
                        <Box sx={{ height: 0, overflow: "hidden" }}>{provided.placeholder}</Box>
                      )}
                    </Box>
                  )}
                </Droppable>
              </div>
            )}
          </ClickAwayListener>
        </Box>
      )}
    </Draggable>
  )
}

export default Action
