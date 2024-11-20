import { Box, Button, Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material"
import { SetStateAction, useState } from "react"
import { useParams } from "react-router-dom"

import { useUpdateBoardNameMutation } from "@/state/apiSlice"

const BoardNameEdit = () => {
  const { id = "default-id" } = useParams()
  const [open, setOpen] = useState(false)
  const [nameText, setNameText] = useState("")
  const [updateBoardName] = useUpdateBoardNameMutation()

  const handleOpenModal = () => {
    setOpen(true)
  }

  const handleCloseModal = () => {
    setOpen(false)
    setNameText("")
  }

  const handleNameTextChange = (event: { preventDefault: () => void; target: { value: SetStateAction<string> } }) => {
    event.preventDefault()
    setNameText(event.target.value)
  }

  const handleNameSubmit = async () => {
    try {
      await updateBoardName({ boardId: id, newName: nameText }).unwrap()
      handleCloseModal()
    } catch (error) {
      console.error("Failed to change board name:", error)
    }
  }

  return (
    <Box>
      <MenuItem onClick={handleOpenModal} sx={{ py: 1 }}>
        <Typography variant="body2">Change Board Name</Typography>
      </MenuItem>
      <Dialog open={open} onClose={handleCloseModal}>
        <Box>
          <DialogTitle>Enter new name</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography variant="body2" color="textSecondary">
                Please enter new board name.
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField size="small" label="Name" value={nameText} onChange={handleNameTextChange} />
                <Button variant="contained" onClick={handleNameSubmit}>
                  Submit
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Box>
      </Dialog>
    </Box>
  )
}

export default BoardNameEdit
