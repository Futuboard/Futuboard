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
import { useDispatch, useSelector } from "react-redux"

import { useAddScopeMutation } from "@/state/apiSlice"
import { useGetScopesQuery } from "@/state/apiSlice"
import { disableScope, setScope } from "@/state/scope"
import { RootState } from "@/state/store"
import { Scope as ScopeType } from "@/types"

import Scope from "./Scope"
import ScopeCreationForm from "./ScopeCreationForm"

interface ScopeListItemProps {
  scope: ScopeType
  onClose: () => void
}

const ScopeListItem: React.FC<ScopeListItemProps> = ({ scope, onClose }) => {
  const anchor = document.getElementById("scope-anchor")
  const selectedScope = useSelector((state: RootState) => state.scope)
  const isScopeSelected = scope.scopeid === selectedScope?.scopeid
  const dispatch = useDispatch()

  const handleClick = () => {
    dispatch(setScope(scope))
  }

  const handleCloseScope = () => {
    dispatch(disableScope())
    onClose()
  }

  return (
    <div>
      <ListItemButton sx={{ padding: 1 }} onClick={handleClick} selected={isScopeSelected}>
        <EditIcon sx={{ paddingLeft: 1, padding: 1.5, color: "gray", alignSelf: "center", fontSize: 20 }} />
        <Tooltip title={scope.title.length < 30 ? "" : scope.title} disableInteractive>
          <Typography color="black" variant="body1">
            {scope.title}
          </Typography>
        </Tooltip>
      </ListItemButton>
      {anchor && (
        <Popper open={isScopeSelected} anchorEl={anchor} placement="left-end">
          <Scope key={scope.scopeid} scope={scope} onClose={handleCloseScope}></Scope>
        </Popper>
      )}
      <Divider />
    </div>
  )
}

interface ScopeListProps {
  visible: boolean
  closeDrawer: () => void
  boardId: string
}

const ScopeList: React.FC<ScopeListProps> = ({ visible, boardId, closeDrawer }) => {
  const info = useGetScopesQuery(boardId)
  const scopes = info.data ? info.data : []
  const [open, setOpen] = useState(false)
  const [addScope] = useAddScopeMutation()
  const collator = Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
  const dispatch = useDispatch()

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
    dispatch(disableScope())
  }

  useEffect(() => {
    if (!visible) {
      dispatch(disableScope())
    }
  }, [visible, dispatch])

  return (
    <Drawer
      open={visible}
      anchor={"right"}
      variant="persistent"
      PaperProps={{
        sx: { borderLeft: "2px solid #D1D5DB" }
      }}
    >
      <List sx={{ minWidth: 270, maxWidth: 270 }} disablePadding>
        <ListItem sx={{ height: "63px", cursor: "pointer" }} onClick={() => closeDrawer()}>
          <IconButton>
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
            .map((scope) => <ScopeListItem key={scope.scopeid} scope={scope} onClose={handleCloseScope} />)
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
