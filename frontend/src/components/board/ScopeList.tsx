import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import { Dialog } from "@mui/material"
import DialogContent from "@mui/material/DialogContent"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import Popper from "@mui/material/Popper"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import React, { useState, useEffect } from "react"
import { useDispatch } from "react-redux"

import { useAddScopeMutation } from "@/state/apiSlice"
import { useGetScopesQuery } from "@/state/apiSlice"
import { setScope } from "@/state/scope"
import { Scope as ScopeType } from "@/types"

import Scope from "./Scope"
import ScopeCreationForm from "./ScopeCreationForm"

interface ScopeListItemProps {
  scope: ScopeType
  isActive: boolean
  deactivate: () => void
}

const ScopeListItem: React.FC<ScopeListItemProps> = ({ scope, isActive, deactivate }) => {
  const displayName = scope.title.length < 20 ? scope.title : scope.title.substring(0, 16) + "..."
  const anchor = document.getElementById("scope-anchor")
  const dispatch = useDispatch()

  const handleClick = () => {
    deactivate()
    dispatch(setScope(scope.scopeid))
  }
  return (
    <div>
      <ListItemButton sx={{ padding: "5px" }} alignItems="flex-start">
        <Tooltip title={scope.title.length < 20 ? "" : scope.title} disableInteractive>
          <Typography sx={{ padding: "5px" }} color="black" variant="body1">
            {displayName}
          </Typography>
        </Tooltip>
        <IconButton onClick={handleClick} sx={{ padding: "7px", marginLeft: "auto" }}>
          <EditIcon />
        </IconButton>
      </ListItemButton>
      {anchor && (
        <Popper open={isActive} anchorEl={anchor} placement="left-end">
          <Scope key={scope.scopeid} scope={scope}></Scope>
        </Popper>
      )}
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
  const [activeScope, setActiveScope] = useState<string | null>(null)
  const collator = Intl.Collator(undefined, { numeric: true, sensitivity: "base" })

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

  useEffect(() => {
    if (!visible) {
      setActiveScope(null)
    }
  }, [visible])

  return (
    <Popper open={visible} anchorEl={anchorEl}>
      <List
        sx={{
          bgcolor: "background.paper",
          boxShadow: 1,
          borderRadius: 2,
          paddingTop: 1.65,
          paddingBottom: 0,
          minWidth: 200
        }}
      >
        <ListItemButton sx={{ padding: "5px" }} alignItems="flex-start" id="scope-anchor">
          <IconButton onClick={openDialog} sx={{ margin: "auto" }}>
            <AddIcon />
          </IconButton>
        </ListItemButton>
        <Divider />
        {scopes.length > 0 ? (
          scopes
            .slice()
            .sort((a, b) => collator.compare(a.title, b.title))
            .map((scope) => (
              <ScopeListItem
                key={scope.scopeid}
                scope={scope}
                isActive={activeScope === scope.scopeid}
                deactivate={() => setActiveScope(scope.scopeid)}
              />
            ))
        ) : (
          <ListItem>
            <Typography sx={{ margin: "auto", padding: "5px" }}>No scopes yet</Typography>
          </ListItem>
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
