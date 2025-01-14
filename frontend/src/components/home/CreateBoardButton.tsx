import BoardCreationForm from "@components/board/BoardCreationForm"
import { Dialog, DialogContent, Typography } from "@mui/material"
import Button from "@mui/material/Button"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAddBoardMutation } from "@/state/apiSlice"
import { NewBoardFormData } from "@/types"

const CreateBoardButton = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [addBoard] = useAddBoardMutation()

  const handleOpenDialog = () => {
    setOpen(true)
  }
  const handleCloseDialog = () => {
    setOpen(false)
  }
  const handleSubmit = async (newBoardData: NewBoardFormData) => {
    const response = await addBoard(newBoardData)
    if ("data" in response) {
      // redirect to created board page
      navigate(`/board/${response.data.boardid}`)

      setOpen(false)
    } else {
      // TODO: add error handling
    }
  }
  return (
    <div>
      <Button variant="contained" color="primary" onClick={handleOpenDialog}>
        <Typography>Create board</Typography>
      </Button>
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogContent>
          <BoardCreationForm onSubmit={handleSubmit} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateBoardButton
