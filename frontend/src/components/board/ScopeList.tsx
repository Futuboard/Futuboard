import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import { Dialog } from "@mui/material"
import DialogContent from "@mui/material/DialogContent"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import Paper from "@mui/material/Paper"
import Popper from "@mui/material/Popper"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import React, { useState } from "react"

import { useAddScopeMutation } from "@/state/apiSlice"
import { useGetScopesQuery } from "@/state/apiSlice"
import { Scope as Scopetype } from "@/types"

import Scope from "./Scope"
import ScopeCreationForm from "./ScopeCreationForm"

interface ScopeListItemProps {
  scope: Scopetype
  isActive: boolean
  deactivate: () => void
}

const ScopeListItem: React.FC<ScopeListItemProps> = ({ scope, isActive, deactivate}) => {
  const displayName = scope.title.length < 30 ? scope.title : scope.title.substring(0, 30) + "..."
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
    deactivate()
  }
  return (
    <div>
      <ListItemButton sx={{ padding: "5px" }} alignItems="flex-start">
        <Tooltip title={scope.title.length < 30 ? "" : scope.title} disableInteractive>
          <Typography sx={{ padding: "5px" }} color="black" variant="body1">
            {displayName}
          </Typography>
        </Tooltip>
        <IconButton onClick={handleClick} sx={{ padding: "7px", marginLeft: "auto" }}>
          <EditIcon />
        </IconButton>
      </ListItemButton>
      <Popper open={isActive} anchorEl={anchorEl} disablePortal placement="left">
        <Paper elevation={3} style={{ padding: "18px" }}>
          <Scope scope={scope}></Scope>
        </Paper>
      </Popper>
      <Divider />
    </div>
  )
}

interface ScopeListProps {
  anchorEl: HTMLButtonElement | null
  visible: boolean
  boardId: string
}

const ScopeList: React.FC<ScopeListProps> = ({ visible, boardId, anchorEl }) => {
  const info = useGetScopesQuery(boardId)
  const scopes = info.data ? info.data : []
  const [open, setOpen] = useState(false)
  const [addScope] = useAddScopeMutation()
  const [activeScope, setActiveScope] = useState(0)

  const openDialog = () => {
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
  }

  const handleSubmit = (data: { scopeTitle: string }) => {
    addScope({ boardId, title: data.scopeTitle })
    setOpen(false)
  }

  return (
    <Popper open={visible} anchorEl={anchorEl}>
      <List
        sx={{
          bgcolor: "background.paper",
          boxShadow: 1,
          borderRadius: 2,
          paddingTop: 1.65,
          paddingBottom: 0,
          minWidth: 330
        }}
      >
        <ListItemButton sx={{ padding: "5px" }} alignItems="flex-start">
          <Typography sx={{ padding: "5px" }} color="black" variant="body1">
            Create Scope
          </Typography>
          <IconButton onClick={openDialog} sx={{ marginLeft: "auto" }}>
            <AddIcon />
          </IconButton>
        </ListItemButton>
        <Divider />
        {scopes.length > 0 ? (
          scopes.map((scope, index) => <ScopeListItem key={index} scope={scope} isActive={activeScope === (index + 1)} deactivate={() => setActiveScope(index + 1)}/>)
        ) : (
          <div>
          </div>
        )}
        <Dialog open={open} onClose={handleCloseDialog}>
          <DialogContent>
            <ScopeCreationForm onSubmit={handleSubmit} onCancel={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </List>
    </Popper>
  )
}

export default ScopeList
