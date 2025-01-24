import { Draggable, DraggableStateSnapshot, DraggableStyle, Droppable } from "@hello-pangea/dnd"
import { Box, ClickAwayListener, Typography } from "@mui/material"
import React, { useEffect, useState } from "react"

import { useDeleteActionMutation, useUpdateActionMutation } from "@/state/apiSlice"
import { Action as ActionType, UserWithoutTicketsOrActions } from "@/types"

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

const Action: React.FC<{ action: ActionType; index: number }> = ({ action, index }) => {
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    setCurrentTitle(event.target.value)
  }

  const handleKeyDownInput = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
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
          sx={{
            backgroundColor: isHighlighted ? "#d6d6d6" : "white",
            marginBottom: "2px",
            borderRadius: "4px",
            borderWidth: "2px",
            borderStyle: isHighlighted ? "inset" : "solid",
            borderColor: isHighlighted ? "#d6d6d6" : "white"
          }}
        >
          <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleBlur}>
            {isEditing ? (
              <input
                name={"actionTitle"}
                autoFocus
                value={currentTitle}
                onBlur={handleBlur}
                onChange={handleChange}
                onKeyDown={handleKeyDownInput}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "4px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px"
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
                        maxHeight: "50px",
                        overflow: "hidden",
                        padding: "2px"
                      }}
                    >
                      <Typography
                        variant={"body1"}
                        noWrap={
                          action.users.length >
                          0 /*if action has users, limit the text into a single row to save space*/
                        }
                        fontSize={12}
                      >
                        {currentTitle}
                      </Typography>
                      {action.users.length > 0 && <ActionUserList users={action.users} actionid={action.actionid} />}

                      {provided.placeholder}
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
