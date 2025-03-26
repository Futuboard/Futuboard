import { DeleteForever } from "@mui/icons-material"
import InfoIcon from "@mui/icons-material/Info"
import CloseIcon from "@mui/icons-material/Close"
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
import { setNotification } from "@/state/notification"
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
  onClose: () => void
}

const Scope: React.FC<ScopeProps> = (props) => {
  const { scope, onClose } = props
  const { data: columns } = useGetColumnsByBoardIdQuery(scope?.boardid)
  const [setScopeTitle] = useSetScopeTitleMutation()
  const [title, setTitle] = useState(scope.title)
  const [tickets, setTickets] = useState(scope.tickets.length)
  const [size, setSize] = useState(scope.tickets.reduce((sum, task) => sum + (task.size || 0), 0))
  const dispatch = useDispatch()

  const handleSubmitTitle = async () => {
    if (title !== "") {
      await setScopeTitle({ scopeid: scope.scopeid, title: title })
    } else {
      dispatch(setNotification({ text: "Scope name is required. Changing back...", type: "error" }))
    }
  }

  const handleTextFieldBlur = () => {
    handleSubmitTitle()
  }

  const handleTextFieldChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmitTitle()
    }
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
              onKeyDown={handleKeyDown}
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: "1.4rem", fontWeight: "bold" }
              }}
            />
            <Box sx={{ display: "flex", ml: "auto" }}>
              <Tooltip title="Close Scope">
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
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

          {scope.forecast_set_date && (
            <Grid item xs={12} marginTop={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography marginBottom={1} sx={{ fontWeight: "bold" }}>
                  {"Current Forecast  "}
                </Typography>
              </Box>

              <Grid item xs={12}>
                <Typography>
                  {"Tickets:   "}
                  <b>{scope.forecast_tickets.length}</b>
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  {"Size:   "}
                  <b>{scope.forecast_size}</b>
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  {"Set date:   "}
                  <b>{scope.forecast_set_date.slice(0, 10)}</b>
                </Typography>
              </Grid>
            </Grid>
          )}

          <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <DeleteScopeButton scope={scope} />
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  )
}

export default Scope
