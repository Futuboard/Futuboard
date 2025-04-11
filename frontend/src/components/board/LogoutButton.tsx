import { Logout } from "@mui/icons-material"
import { Box, Button, Dialog, DialogActions, DialogTitle, MenuItem, Stack, Typography } from "@mui/material"
import { useState } from "react"
import { useDispatch } from "react-redux"

import { boardsApi } from "@/state/apiSlice"
import { logOutOfBoard, setIsInReadMode } from "@/state/auth"

type Props = {
  boardId: string
}

const LogoutButton = ({ boardId }: Props) => {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch()

  const handleLogOut = () => {
    logOutOfBoard(boardId)
    setIsInReadMode(boardId, false)
    dispatch(boardsApi.util.resetApiState())
  }

  return (
    <>
      <MenuItem onClick={() => setOpen(true)} sx={{ py: 1 }}>
        <Logout sx={{ fontSize: "1rem", mr: 1 }} />
        <Typography variant="body2">Log Out</Typography>
      </MenuItem>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box>
          <DialogTitle>Are you sure you want to log out?</DialogTitle>
          <DialogActions>
            <Stack direction="row" spacing={4} justifyContent="flex-end">
              <Button variant="contained" color="primary" onClick={handleLogOut}>
                Logout
              </Button>
              <Button variant="outlined" color="primary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}

export default LogoutButton
