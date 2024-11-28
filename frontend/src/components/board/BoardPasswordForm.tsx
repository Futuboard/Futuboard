import { Button, TextField, Grid, Typography } from "@mui/material"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useUpdateBoardPasswordMutation } from "@/state/apiSlice"

interface PasswordFormData {
  old_password: string
  new_password: string
  confirm_password: string
}

interface BoardPasswordFormProps {
  onClose: () => void
}

const BoardPasswordForm = ({ onClose }: BoardPasswordFormProps) => {
  const { id = "default-id" } = useParams()
  const [updateBoardPassword] = useUpdateBoardPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PasswordFormData>()

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await updateBoardPassword({ boardId: id, newPassword: data }).unwrap()
      onClose()
    } catch (error) {
      console.error("Failed to change password:", error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2} height="360px" width="250px">
        <Grid item>
          <Typography variant="h6">Enter a New Password</Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            inputRef={inputRef}
            label="Old Password"
            type="password"
            helperText={errors.old_password?.message}
            error={Boolean(errors.old_password)}
            {...register("old_password")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="New Password"
            type="password"
            helperText={errors.new_password?.message}
            error={Boolean(errors.new_password)}
            {...register("new_password")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Confirm Password"
            type="password"
            helperText={errors.confirm_password?.message}
            error={Boolean(errors.confirm_password)}
            {...register("confirm_password")}
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
  )
}

export default BoardPasswordForm
