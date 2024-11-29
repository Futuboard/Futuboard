import { Delete } from "@mui/icons-material"
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material"
import { SetStateAction, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { useDeleteBoardMutation, useLoginMutation } from "@/state/apiSlice"

const BoardDeletionComponent = () => {
  const navigate = useNavigate()
  const { id = "default-id" } = useParams()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [showDelete, setShowDelete] = useState(false)
  const [tryLogin, { isLoading }] = useLoginMutation()
  const [deleteBoard] = useDeleteBoardMutation()

  const handleOpenModal = () => {
    setOpen(true)
  }

  const handleCloseModal = () => {
    setOpen(false)
    setPassword("")
    setShowDelete(false)
  }

  const handlePasswordChange = (event: { preventDefault: () => void; target: { value: SetStateAction<string> } }) => {
    event.preventDefault()
    setPassword(event.target.value)
  }

  const handleDeleteBoard = async () => {
    try {
      //might later want to add password to this call as well, to make sure the user is authenticated
      await deleteBoard(id).unwrap()
      navigate("/")
    } catch (error) {
      console.error("Failed to delete board:", error)
    }
  }

  const handleSubmitPassword = async () => {
    const loginResponse = await tryLogin({ boardId: id, password: password })
    if ("error" in loginResponse) {
      alert("Hmm we got an error")
      return
    }
    const success = loginResponse.data.success
    if (success) {
      setShowDelete(true)
    } else {
      alert("Wrong password")
    }
  }
  return (
    <Box>
      <MenuItem onClick={handleOpenModal} sx={{ py: 1 }}>
        <Delete sx={{ fontSize: "1rem", mr: 1, color: "red" }} />
        <Typography variant="body2">Delete Board</Typography>
      </MenuItem>
      <Dialog open={open} onClose={handleCloseModal}>
        {showDelete ? (
          <Box>
            <DialogTitle>
              <Typography variant="body1" color="error" align="center">
                IRREVERSIBLE ACTION
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1}>
                <Typography variant="body1" color="error">
                  Are you sure you want to delete this board?
                </Typography>
                <Typography variant="body1" color="error">
                  This action cannot be undone.
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Stack direction="row" spacing={4} justifyContent="flex-end">
                <Button variant="outlined" color="primary" onClick={handleCloseModal}>
                  Think Again
                </Button>
                <Button variant="contained" color="error" onClick={handleDeleteBoard}>
                  Confirm Deletion
                </Button>
              </Stack>
            </DialogActions>
          </Box>
        ) : (
          <Box>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Typography variant="body2" color="textSecondary">
                  Please enter board password.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSubmitPassword}
                    disabled={isLoading}
                    color={isLoading ? "secondary" : "primary"}
                  >
                    {isLoading ? <CircularProgress size={24} /> : "Submit"}
                  </Button>
                </Stack>
              </Stack>
            </DialogContent>
          </Box>
        )}
      </Dialog>
    </Box>
  )
}

export default BoardDeletionComponent
