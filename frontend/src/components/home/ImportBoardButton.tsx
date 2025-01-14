import BoardImportForm from "@components/board/BoardImportForm"
import { Dialog, DialogContent, Typography } from "@mui/material"
import Button from "@mui/material/Button"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useImportBoardMutation } from "@/state/apiSlice"
import { NewBoardFormImport } from "@/types"

const CreateBoardButton = () => {
  const navigate = useNavigate()
  const [importBoard] = useImportBoardMutation()
  const [open, setOpen] = useState(false)

  const handleOpenDialog = () => {
    setOpen(true)
  }
  const handleCloseDialog = () => {
    setOpen(false)
  }
  const handleSubmit = async (data: NewBoardFormImport) => {
    const formData = new FormData()
    formData.append("file", data.file[0])
    formData.append("board", JSON.stringify(data))

    const response = await importBoard(formData)

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
        <Typography>Import board</Typography>
      </Button>
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogContent>
          <BoardImportForm onSubmit={handleSubmit} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateBoardButton
