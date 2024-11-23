import BoardImportForm from "@components/board/BoardImportForm"
import { Dialog, DialogContent, Typography } from "@mui/material"
import Button from "@mui/material/Button"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { getId } from "@/services/Utils"
import { NewBoardFormImport } from "@/types"

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
    //TODO: should only temporarily update the board name. (not in this function though)
    //later should create entirely new board object and send it to database
    const board = {
      title: data.title,
      password: data.password,
      id: getId()
    }

    const formData = new FormData()
    formData.append("file", data.file[0])
    formData.append("board", JSON.stringify(board))

    await fetch(`${import.meta.env.VITE_DB_ADDRESS}/import/${board.id}/`, {
      method: "POST",
      body: formData
    })
      .then((response) => response.json())
      .then(() => {
        navigate(`/board/${board.id}`)
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
