import { Draggable, DraggableStateSnapshot, DraggableStyle, Droppable } from "@hello-pangea/dnd"
import { Box, ClickAwayListener, Typography } from "@mui/material"
import { useEffect, useState } from "react"

import { useUpdateActionMutation } from "@/state/apiSlice"
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
  const [isEditing, setIsEditing] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(action.title)

  useEffect(() => {
    setCurrentTitle(action.title)
  }, [action.title])

  const [updateAction] = useUpdateActionMutation()

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = async () => {
    setIsEditing(false)

    if (currentTitle === action.title) {
      return
    }

    const updatedAction = { ...action, title: currentTitle }
    await updateAction({ action: updatedAction })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    setCurrentTitle(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleBlur()
    }
  }

  return (
    <Draggable key={action.actionid} draggableId={action.actionid} index={index}>
      {(provided) => (
        <Box
          boxShadow={1}
          onDoubleClick={handleDoubleClick}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{ backgroundColor: "white", marginBottom: "2px", borderRadius: "4px" }}
        >
          {isEditing ? (
            <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleBlur}>
              <input
                name={"actionTitle"}
                autoFocus
                value={currentTitle}
                onBlur={handleBlur}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "4px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              />
            </ClickAwayListener>
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
                        action.users.length > 0 /*if action has users, limit the text into a single row to save space*/
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
        </Box>
      )}
    </Draggable>
  )
}

export default Action
