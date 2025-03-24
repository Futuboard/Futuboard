import { DeleteForever } from "@mui/icons-material"
import InfoIcon from "@mui/icons-material/Info"
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
  Typography,
  Paper
} from "@mui/material"
import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"

import { useDeleteScopeMutation, useSetScopeTitleMutation } from "@/state/apiSlice"
import { disableScope } from "@/state/scope"
import { Scope as Scopetype } from "@/types"



import { useGetColumnsByBoardIdQuery } from "../../state/apiSlice"

import DoneColumnChooser from "./DoneColumnChooser"
import SetScopeForecastButton from "./SetForecastButton"



interface DeleteScopeButtonProps {
  scope: Scopetype
}

const DeleteScopeButton: React.FC<DeleteScopeButtonProps> = ({ scope }) => {
  const [deleteScope] = useDeleteScopeMutation()
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch()

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleDelete = () => {
    deleteScope({ boardid: scope.boardid, scopeid: scope.scopeid })
    setOpen(false)
    dispatch(disableScope())
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
  const [tickets, setTickets] = useState(scope.tickets.length)
  const [size, setSize] = useState(scope.tickets.reduce((sum, task) => sum + (task.size || 0), 0))

  const handleTextFieldBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setScopeTitle({ scopeid: scope.scopeid, title: event.target.value })
  }

  const handleTextFieldChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(event.target.value)
  }

  useEffect(() => {
    setTitle(scope.title)
    setTickets(scope.tickets.length)
    setSize(scope.tickets.reduce((sum, task) => sum + (task.size || 0), 0))
  }, [scope.title, scope.tickets])

  return (
    <Grid container spacing={2} width={350}>
      <Paper sx={{ padding: "18px", marginTop: "7px" }}>
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

        <Grid item xs={12} marginTop={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography gutterBottom variant="h6">
              {"Tickets:  "}
              <b>{tickets}</b>
            </Typography>
          </Box>

          <Grid item xs={12}>
            <Typography gutterBottom variant="h6">
              {"Size:   "}
              <b>{size}</b>
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
      </Paper>
    </Grid>
  )
}

export default Scope
