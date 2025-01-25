import { Droppable } from "@hello-pangea/dnd"
import { Add } from "@mui/icons-material"
import { Box, IconButton, Paper, Popover } from "@mui/material"
import { useState } from "react"

import { getId } from "@/services/Utils"
import { usePostActionMutation } from "@/state/apiSlice"
import { Action as ActionType, NewAction, SwimlaneColumn, Task } from "@/types"

import Action from "./Action"
import ActionCreationForm from "./ActionCreationForm"

interface SwimlaneActionListProps {
  taskId: string
  swimlanecolumn: SwimlaneColumn
  actionList: ActionType[]
}

const SwimlaneActionList: React.FC<SwimlaneActionListProps> = ({ taskId, swimlanecolumn, actionList }) => {
  return (
    <>
      <Droppable
        droppableId={swimlanecolumn.swimlanecolumnid + "/" + taskId + "/" + swimlanecolumn.columnid}
        type={"SWIMLANE" + "/" + taskId}
      >
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              display: "flex",
              flexDirection: "column",
              padding: "2px",
              alignContent: "center",
              border: snapshot.isDraggingOver ? "1px solid rgba(22, 95, 199)" : "1px solid rgba(0, 0, 0, 0.12)",
              backgroundColor: snapshot.isDraggingOver ? "rgba(22, 95, 199, 0.1)" : "#E5DB0",
              overflowX: "hidden"
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

const CreateActionButton: React.FC<{ taskId: string; swimlanecolumnid: string; columnid: string }> = ({
  taskId,
  swimlanecolumnid,
  columnid
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [createAction] = usePostActionMutation()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleOnSubmit = async (data: { actionTitle: string; resetActionTitle: () => void }) => {
    const action: NewAction = {
      title: data.actionTitle,
      columnid: columnid,
      actionid: getId(),
      ticketid: taskId,
      swimlanecolumnid,
      order: 0
    }
    data.resetActionTitle()
    await createAction({ action })
  }

  const open = Boolean(anchorEl)
  const popOverid = open ? "popover" : undefined

  return (
    <div>
      <IconButton sx={{ marginTop: "10px" }} size={"small"} onClick={handleClick}>
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
  columnid: string
}

const Swimlane: React.FC<SwimlaneProps> = ({ task, swimlaneColumns, actions, columnid }) => {
  return (
    <Box sx={{ display: "flex" }}>
      {swimlaneColumns && (
        <CreateActionButton
          taskId={task.ticketid}
          swimlanecolumnid={swimlaneColumns[0].swimlanecolumnid}
          columnid={columnid}
        />
      )}
      <Box
        sx={{
          height: "120px",
          paddingBottom: "9px",
          paddingTop: "9px",
          paddingRight: "25px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          width: "100%"
        }}
      >
        {swimlaneColumns &&
          swimlaneColumns.map((swimlaneColumn, index) => (
            <SwimlaneActionList
              key={index}
              taskId={task.ticketid}
              swimlanecolumn={swimlaneColumn}
              actionList={actions.filter((action) => action.swimlanecolumnid == swimlaneColumn.swimlanecolumnid)}
            />
          ))}
      </Box>
    </Box>
  )
}

export default Swimlane
