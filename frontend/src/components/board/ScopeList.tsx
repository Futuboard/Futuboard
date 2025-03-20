import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import Divider from '@mui/material/Divider'
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import Popper from "@mui/material/Popper"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import React from "react"

import { useGetScopesQuery } from "@/state/apiSlice"

interface ScopeListItemProps {
  scopeName: string
}

const ScopeListItem: React.FC<ScopeListItemProps> = ({scopeName}) => {
  const displayName = scopeName.length < 30 ? scopeName : scopeName.substring(0, 30) + "..."
  return (
    <div>
      <ListItemButton sx={{padding: "5px", }} alignItems="flex-start">
        <Tooltip title={scopeName.length < 30 ? "" : scopeName} disableInteractive>
        <Typography sx={{padding: "5px"}} color="black" variant="body1">{displayName}</Typography>
        </Tooltip>
        <IconButton sx={{ padding: "7px", marginLeft: "auto"}}>
          <EditIcon />
        </IconButton>
      </ListItemButton>
      <Divider />
    </div>
  )
}

interface ScopeListProps {
  anchorEl: HTMLButtonElement | null,
  visible: boolean,
  boardId: string
}

const ScopeList: React.FC<ScopeListProps> = ({visible, boardId, anchorEl}) => {

  const info =  useGetScopesQuery(boardId)
  const scopes = info.data ? info.data : []

  return (
    <Popper open={visible} anchorEl={anchorEl}>
    <List sx={{
          bgcolor: 'background.paper',
          boxShadow: 1,
          borderRadius: 2,
          paddingTop: 1.65,
          paddingBottom: 0,
          minWidth: 330,
        }}>
      {scopes.length > 0
        ? scopes.map(scope => <ScopeListItem key={scope.title} scopeName={scope.title} />)
        : <div>
            <ListItem sx={{padding: "5px"}} alignItems="flex-start">
              <Typography sx={{padding: "5px"}} color="black" variant="body1">No Scopes</Typography>
            </ListItem>
            <Divider />
          </div>
      }
      <ListItemButton sx={{padding: "5px"}} alignItems="flex-start">
        <Typography sx={{padding: "5px"}} color="black" variant="body1">Create Scope</Typography>
        <IconButton sx={{marginLeft: "auto"}}>
          <AddIcon />
        </IconButton>
      </ListItemButton>
    </List>
    </Popper>
  )
}

export default ScopeList