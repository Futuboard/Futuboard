import { Edit } from "@mui/icons-material"
import { Box, Button, Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useUpdateBoardTitleMutation } from "@/state/apiSlice"

interface BoardTitleFormProps {
  title: string
}

interface BoardTitleFormData {
  title: string
}

const BoardTitleForm: React.FC<BoardTitleFormProps> = (props) => {
  const { id = "default-id" } = useParams()
  const [open, setOpen] = useState(false)
  const [updateBoardName] = useUpdateBoardTitleMutation()

  const { title } = props

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BoardTitleFormData>({
    defaultValues: {
      title: title
    }
  })

  const handleOpenModal = () => {
    setOpen(true)
  }

  const handleCloseModal = () => {
    setOpen(false)
  }

  const onSubmit = async (data: BoardTitleFormData) => {
    try {
      await updateBoardName({ boardId: id, newName: data.title }).unwrap()
      handleCloseModal()
    } catch (error) {
      console.error("Failed to change board name:", error)
    }
  }

  return (
    <Box>
      <MenuItem onClick={handleOpenModal} sx={{ py: 1 }}>
        <Edit sx={{ fontSize: "1rem", mr: 1 }} />
        <Typography variant="body2">Edit Board Name</Typography>
      </MenuItem>
      <Dialog open={open} onClose={handleCloseModal}>
        <Box>
          <DialogTitle>Enter new name</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <Typography variant="body2" color="textSecondary">
                  Please enter a new board name.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    helperText={errors.title?.message}
                    error={Boolean(errors.title)}
                    {...register("title", {
                      minLength: {
                        value: 3,
                        message: "Board name must be at least 3 characters"
                      },
                      maxLength: {
                        value: 40,
                        message: "Board name can be up to 40 characters"
                      },
                      required: {
                        value: true,
                        message: "Board name is required"
                      }
                    })}
                  />
                  <Button variant="contained" type="submit">
                    Submit
                  </Button>
                </Stack>
              </Stack>
            </form>
          </DialogContent>
        </Box>
      </Dialog>
    </Box>
  )
}

export default BoardTitleForm
