import { Droppable } from "@hello-pangea/dnd"
import { Add } from "@mui/icons-material"
import { Box, IconButton, Paper, Popover, Skeleton } from "@mui/material"
import { useContext, useState } from "react"

import { WebsocketContext } from "@/pages/BoardContainer"
import { getId } from "@/services/Utils"
import { useGetActionListByTaskIdAndSwimlaneColumnIdQuery, usePostActionMutation } from "@/state/apiSlice"
import { Action as ActionType, SwimlaneColumn, Task } from "@/types"

import Action from "./Action"
import ActionCreationForm from "./ActionCreationForm"

interface SwimlaneActionListProps {
  taskId: string
  swimlanecolumnid: string
  actionList: ActionType[]
}

const SwimlaneActionList: React.FC<SwimlaneActionListProps> = ({ taskId, swimlanecolumnid, actionList }) => {
  return (
    <>
      <Droppable droppableId={swimlanecolumnid + "/" + taskId} type={"SWIMLANE" + "/" + taskId}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: "1",
              padding: "2px",
              alignContent: "center",
              border: snapshot.isDraggingOver ? "1px solid rgba(22, 95, 199)" : "1px solid rgba(0, 0, 0, 0.12)",
              backgroundColor: snapshot.isDraggingOver ? "rgba(22, 95, 199, 0.1)" : "#E5DB0",
              height: "118px",
              overflowX: "hidden",
              //custom scrollbar has issues with react-beautiful-dnd, remove if it's causing problems
              "&::-webkit-scrollbar": {
                width: "5px"
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1"
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#888"
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "#555"
              }
            }}
          >
            {actionList &&
              actionList.map((action, index) => <Action key={action.actionid} action={action} index={index} />)}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </>
  )
}

const CreateActionButton: React.FC<{ taskId: string; swimlanecolumnid: string }> = ({ taskId, swimlanecolumnid }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [createAction] = usePostActionMutation()

  const sendMessage = useContext(WebsocketContext)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleOnSubmit = async (data: { actionTitle: string; resetActionTitle: () => void }) => {
    const actionObject: ActionType = {
      title: data.actionTitle,
      actionid: getId(),
      color: "white"
    }

    await createAction({ taskId, swimlaneColumnId: swimlanecolumnid, action: actionObject })

    if (sendMessage !== null) {
      sendMessage("Action created")
    }
    data.resetActionTitle()
  }

  const open = Boolean(anchorEl)
  const popOverid = open ? "popover" : undefined

  return (
    <div>
      <IconButton size={"small"} onClick={handleClick}>
        <Add sx={{ fontSize: "15px" }} />
      </IconButton>
      <Popover
        disableRestoreFocus
        id={popOverid}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        transformOrigin={{
          vertical: 10,
          horizontal: 230
        }}
      >
        <Paper sx={{ height: "fit-content", padding: "20px", width: "200px" }}>
          <ActionCreationForm onSubmit={handleOnSubmit} onCancel={handleClose} />
        </Paper>
      </Popover>
    </div>
  )
}

interface SwimlaneProps {
  task: Task
  swimlaneColumns: SwimlaneColumn[]
  actions: ActionType[]
}

const Swimlane: React.FC<SwimlaneProps> = ({ task, swimlaneColumns, actions }) => {
  return (
    <div style={{ display: "flex" }}>
      {swimlaneColumns && (
        <CreateActionButton taskId={task.ticketid} swimlanecolumnid={swimlaneColumns[0].swimlanecolumnid} />
      )}
      <Box
        sx={{
          height: "129px",
          /*might later need to change swimlane height to show all actions*/ width: "100%",
          backgroundColor: "#E5DB0",
          paddingBottom: "10px"
        }}
      >
        <Box sx={{ display: "flex" }}>
          {swimlaneColumns &&
            swimlaneColumns.map((swimlaneColumn, index) => (
              <SwimlaneActionList
                key={index}
                taskId={task.ticketid}
                swimlanecolumnid={swimlaneColumn.swimlanecolumnid}
                actionList={actions.filter(
                  (action) =>
                    action.ticketid == task.ticketid && action.swimlanecolumnid == swimlaneColumn.swimlanecolumnid
                )}
              />
            ))}
        </Box>
      </Box>
    </div>
  )
}

export default Swimlane
