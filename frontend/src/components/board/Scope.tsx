import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from "@mui/material"

import { Scope as Scopetype } from "@/types"
import InfoIcon from "@mui/icons-material/Info"
import { DeleteForever } from "@mui/icons-material"
import { useState, useEffect } from "react"
import { useDeleteScopeMutation, useSetScopeTitleMutation } from "@/state/apiSlice"
import { useGetColumnsByBoardIdQuery } from "../../state/apiSlice"
import DoneColumnChooser from "./DoneColumnChooser"
import SetScopeForecastButton from "./SetForecastButton"
import { useDispatch, useSelector } from "react-redux"
import { disableScope, setScope } from "@/state/scope"

interface DeleteScopeButtonProps {
  scope: Scopetype
}

const DeleteScopeButton: React.FC<DeleteScopeButtonProps> = ({ scope }) => {
  const [deleteScope] = useDeleteScopeMutation()

  const [open, setOpen] = useState(false)

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleDelete = () => {
    deleteScope({ boardid: scope.boardid, scopeid: scope.scopeid })
    setOpen(false)
  }

  return (
    <div>
      <Tooltip title="Delete Scope">
        <IconButton sx={{ color: "red" }} onClick={handleClickOpen}>
          <DeleteForever />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this scope? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

interface ScopeProps {
  scope: Scopetype
}

const Scope: React.FC<ScopeProps> = (props) => {
  const { scope } = props
  const { data: columns } = useGetColumnsByBoardIdQuery(scope?.boardid)
  const [setScopeTitle] = useSetScopeTitleMutation()
  const [title, setTitle] = useState(scope.title)
  const dispatch = useDispatch()
  dispatch(setScope(scope.scopeid))

  const handleTextFieldBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setScopeTitle({ scopeid: scope.scopeid, title: event.target.value })
  }

  const handleTextFieldChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(event.target.value)
  }

  useEffect(() => {
    setTitle(scope.title)
  }, [scope.title])

  return (
    <Grid container spacing={2} width={350}>
      <Grid item xs={12}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <TextField
            placeholder="Enter scope name"
            value={title}
            onChange={handleTextFieldChange}
            variant="standard"
            fullWidth
            onBlur={handleTextFieldBlur}
            InputProps={{
              disableUnderline: true,
              sx: { fontSize: "1.4rem", fontWeight: "bold" }
            }}
          />
        </Box>
        <Divider />
      </Grid>

      <Grid item xs={12}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography gutterBottom variant="h6">
            {"Tickets:  "}
            <b>{scope?.tickets.length}</b>
          </Typography>
        </Box>

        <Grid item xs={12}>
          <Typography gutterBottom variant="h6">
            {"Size:   "}
            <b>{scope?.tickets.reduce((sum, ticket) => sum + (1 || 0), 0)}</b>
          </Typography>
        </Grid>

        <Grid item xs={12} marginTop={3} marginBottom={2}>
          <DoneColumnChooser scope={scope} columns={columns ? columns : []} />
        </Grid>

        <Grid item container spacing={2} xs={12} alignItems="center">
          <Grid item>
            <SetScopeForecastButton scope={scope} />
          </Grid>
          <Grid item sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Tooltip
              title="Saves the scope forecast with the currently selected tickets, their total size, and the timestamp. If the scope changes afterwards, it does not affect the forecast."
              placement="right"
            >
              <InfoIcon sx={{ fontSize: 24 }} />
            </Tooltip>
          </Grid>
        </Grid>
        {scope && (
          <Grid item xs={1} sx={{ display: "flex", ml: "auto" }}>
            <DeleteScopeButton scope={scope} />
          </Grid>
        )}
      </Grid>
    </Grid>
  )
}

export default Scope
