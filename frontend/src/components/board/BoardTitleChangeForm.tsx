import { Button, Grid, TextField, Typography, Dialog, DialogContent } from "@mui/material"
import { useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useUpdateBoardTitleMutation } from "@/state/apiSlice"
import { BoardTitleChangeFormData } from "@/types"

interface BoardTitleChangeFormProps {
  title: string
  onClose: () => void
  open: boolean
}

const BoardTitleChangeForm = ({ title, onClose, open }: BoardTitleChangeFormProps) => {
  const { id = "default-id" } = useParams()
  const [updateBoardName] = useUpdateBoardTitleMutation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BoardTitleChangeFormData>({
    defaultValues: {
      title: title
    }
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const onSubmit = async (data: BoardTitleChangeFormData) => {
    try {
      await updateBoardName({ boardId: id, newTitle: data.title }).unwrap()
      onClose()
    } catch (error) {
      console.error("Failed to change board name:", error)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={1} height="200px" width="250px">
            <Grid item>
              <Typography variant="h6">Edit Board Name</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                inputRef={inputRef}
                spellCheck={false}
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
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" type="submit">
                Submit
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BoardTitleChangeForm
