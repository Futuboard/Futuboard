import { Dialog, DialogContent, Typography } from "@mui/material"
import Button from "@mui/material/Button"
import { SerializedError } from "@reduxjs/toolkit"
import { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import BoardCreationForm from "@/components/home/BoardCreationForm"
import { useAddBoardMutation, useCreateBoardFromTemplateMutation, useImportBoardMutation } from "@/state/apiSlice"
import { Board, NewBoardFormData } from "@/types"

const CreateBoardButton = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [addBoard] = useAddBoardMutation()
  const [importBoard] = useImportBoardMutation()
  const [createBoardFromTemplate] = useCreateBoardFromTemplateMutation()

  const handleOpenDialog = () => {
    setOpen(true)
  }
  const handleCloseDialog = () => {
    setOpen(false)
  }
  const handleSubmit = async (newBoardData: NewBoardFormData) => {
    let response: { data: Board } | { error: FetchBaseQueryError | SerializedError } | null = null

    if (newBoardData.boardType === "empty") {
      response = await addBoard(newBoardData)
    }

    if (newBoardData.boardType === "import" && newBoardData.file) {
      const { file, password, title } = newBoardData
      const formData = new FormData()
      formData.append("file", file[0])
      formData.append("board", JSON.stringify({ password, title }))

      response = await importBoard(formData)
    }

    if (newBoardData.boardType === "template" && newBoardData.boardTemplateId) {
      response = await createBoardFromTemplate(newBoardData)
    }

    if (response && "data" in response) {
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
