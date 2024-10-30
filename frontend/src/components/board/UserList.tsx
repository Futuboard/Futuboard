import { Draggable, DraggableStateSnapshot, DraggableStyle, Droppable, DroppableProvided } from "@hello-pangea/dnd"
import { Switch } from "@mui/material"
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
    <div>
      <Droppable droppableId="user-list" type="user" direction="horizontal">
        {(provided: DroppableProvided) => {
          return (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                display: "flex",
                alignItems: "center",
                overflowX: "auto",
                maxWidth: "750px", //change to something else
                border: "solid 2px #D1D5DB",
                borderRadius: "10px"
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
              <div title="Toggle Delete" style={{ marginLeft: "auto" }}>
                <Switch onClick={() => setShowEditable(!showEditable)} />
              </div>
            </div>
          )
        }}
      </Droppable>
    </div>
  )
}

export default UserList
