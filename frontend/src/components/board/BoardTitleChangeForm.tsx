import { Button, Grid, TextField, Typography, Dialog, DialogContent, Divider } from "@mui/material"
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
          <Grid container spacing={2} flexDirection="column" width="500px">
            <Grid item>
              <Typography variant="h6">Edit Board Name</Typography>
              <Divider />
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
                sx={{ width: "100%" }}
              />
            </Grid>
            <Grid item xs={12} display="flex" flexDirection="row" sx={{ marginTop: 1, justifyContent: "center" }}>
              <Button variant="contained" color="primary" type="submit">
                Submit
              </Button>
              <Button sx={{ marginLeft: 2, border: 1 }} onClick={onClose}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BoardTitleChangeForm
