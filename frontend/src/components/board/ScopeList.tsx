import AddIcon from "@mui/icons-material/Add"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import EditIcon from "@mui/icons-material/Edit"
import {
  Dialog,
  DialogContent,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Popper,
  Tooltip,
  Typography
} from "@mui/material"
import React, { useState, useEffect } from "react"
import { useDispatch } from "react-redux"

import { useAddScopeMutation } from "@/state/apiSlice"
import { useGetScopesQuery } from "@/state/apiSlice"
import { disableScope, setScope } from "@/state/scope"
import { Scope as ScopeType } from "@/types"

import Scope from "./Scope"
import ScopeCreationForm from "./ScopeCreationForm"

interface ScopeListItemProps {
  scope: ScopeType
  onClose: () => void
  isActive: boolean
  deactivate: () => void
}

const ScopeListItem: React.FC<ScopeListItemProps> = ({ scope, onClose, isActive, deactivate }) => {
  const displayName = scope.title.length < 30 ? scope.title : scope.title.substring(0, 26) + "..."
  const anchor = document.getElementById("scope-anchor")
  const dispatch = useDispatch()

  const handleClick = () => {
    deactivate()
    dispatch(setScope(scope))
  }

  const handleCloseScope = () => {
    dispatch(disableScope())
    onClose()
  }

  return (
    <div>
      <ListItemButton sx={{ padding: "5px" }} onClick={handleClick} selected={isActive}>
        <EditIcon sx={{ paddingLeft: "20px", padding: "7px", color: "gray", alignSelf: "center" }} />
        <Tooltip title={scope.title.length < 30 ? "" : scope.title} disableInteractive>
          <Typography color="black" variant="body1">
            {displayName}
          </Typography>
        </Tooltip>
      </ListItemButton>
      {anchor && (
        <Popper open={isActive} anchorEl={anchor} placement="left-end">
          <Scope key={scope.scopeid} scope={scope} onClose={handleCloseScope}></Scope>
        </Popper>
      )}
      <Divider />
    </div>
  )
}

interface ScopeListProps {
  visible: boolean
  closeDrawer: (event: React.MouseEvent<HTMLButtonElement>) => void
  boardId: string
}

const ScopeList: React.FC<ScopeListProps> = ({ visible, boardId, closeDrawer }) => {
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

  const handleCloseScope = () => {
    setActiveScope(null)
  }

  useEffect(() => {
    if (!visible) {
      setActiveScope(null)
    }
  }, [visible])

  return (
    <Drawer open={visible} anchor={"right"} variant="persistent">
      <List sx={{ minWidth: 270, maxWidth: 270 }} disablePadding>
        <ListItem sx={{ height: "63px" }}>
          <IconButton onClick={closeDrawer}>
            <ChevronRightIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold" sx={{ paddingLeft: "42px", height: "63%" }}>
            Scopes
          </Typography>
        </ListItem>
        <Divider sx={{ borderBottom: "2px solid #D1D5DB" }} />
        <ListItemButton sx={{ padding: "5px" }} alignItems="flex-start" id="scope-anchor" onClick={openDialog}>
          <Tooltip title="Create a Scope" disableInteractive>
            <AddIcon sx={{ margin: "auto", padding: "5px" }} color="primary" />
          </Tooltip>
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
                onClose={handleCloseScope}
                isActive={activeScope === scope.scopeid}
                deactivate={() => setActiveScope(scope.scopeid)}
              />
            ))
        ) : (
          <ListItem>
            <Typography sx={{ margin: "auto" }}>No scopes yet</Typography>
          </ListItem>
        )}
        <Dialog open={open} onClose={handleCloseDialog}>
          <DialogContent>
            <ScopeCreationForm onSubmit={handleSubmit} onCancel={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </List>
    </Drawer>
  )
}

export default ScopeList
