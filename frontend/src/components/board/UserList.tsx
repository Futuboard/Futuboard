import { Draggable, DraggableStateSnapshot, DraggableStyle, Droppable, DroppableProvided } from "@hello-pangea/dnd"
import { DeleteOutline, DeleteTwoTone } from "@mui/icons-material"
import { Box, IconButton, Tooltip } from "@mui/material"
import { useState } from "react"

import { User } from "@/types"

import UserMagnet from "./UserMagnet"

interface UserListProps {
  users: User[]
}

const dropStyle = (style: DraggableStyle | undefined, snapshot: DraggableStateSnapshot) => {
  if (!snapshot.isDropAnimating) {
    return style
  }
  //get rid of drop animation, else it dorps the user to the wrong place
  return {
    ...style,
    transform: "scale(0)",
    transition: `all ${0.01}s`
  }
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  const [showEditable, setShowEditable] = useState(false)

  return (
    <Droppable droppableId="user-list" type="user" direction="horizontal">
      {(provided: DroppableProvided) => {
        return (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="user-list"
            sx={{
              display: "flex",
              alignItems: "center",
              overflowX: "auto",
              border: "solid 2px #D1D5DB",
              borderRadius: "10px",
              marginRight: "3rem",
              marginLeft: "3rem",
              minWidth: "80px"
            }}
          >
            {users &&
              users.map((user, index) => (
                <Draggable key={user.userid} draggableId={user.userid} index={index}>
                  {(provided, snapshot) => {
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={dropStyle(provided.draggableProps.style, snapshot)}
                      >
                        <UserMagnet user={user} editable={showEditable} />
                      </div>
                    )
                  }}
                </Draggable>
              ))}
            {provided.placeholder}
            <Tooltip title="Toggle Delete" sx={{ marginLeft: "auto" }}>
              <IconButton onClick={() => setShowEditable(!showEditable)}>
                {showEditable ? <DeleteTwoTone color="error" /> : <DeleteOutline />}
              </IconButton>
            </Tooltip>
          </Box>
        )
      }}
    </Droppable>
  )
}

export default UserList
