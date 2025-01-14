import BoardImportForm from "@components/board/BoardImportForm"
import { Dialog, DialogContent, Typography } from "@mui/material"
import Button from "@mui/material/Button"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Board, NewBoardFormImport } from "@/types"

const CreateBoardButton = () => {
  const navigate = useNavigate()
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

    await fetch(`${import.meta.env.VITE_DB_ADDRESS}import/`, {
      method: "POST",
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        const board = data as Board
        navigate(`/board/${board.boardid}`)
      })
      .catch((error) => {
        console.error("Error:", error)
      })
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
