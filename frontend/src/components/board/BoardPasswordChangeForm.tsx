import { Button, TextField, Grid, Typography, Dialog, DialogContent } from "@mui/material"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useUpdateBoardPasswordMutation } from "@/state/apiSlice"
import { PasswordChangeFormData } from "@/types"

interface BoardPasswordChangeFormProps {
  onClose: () => void
  open: boolean
}

const BoardPasswordChangeForm = ({ onClose, open }: BoardPasswordChangeFormProps) => {
  const { id = "default-id" } = useParams()
  const [updateBoardPassword] = useUpdateBoardPasswordMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<PasswordChangeFormData>()

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (data.new_password !== data.confirm_password) {
      setError("confirm_password", {
        type: "manual",
        message: "New password and confirm password do not match"
      })
      return
    }

    try {
      await updateBoardPassword({ boardId: id, newPassword: data }).unwrap()
      onClose()
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "data" in error) {
        const apiError = error as { data?: { message?: string } }
        const errorMessage = apiError.data?.message || "An unexpected error occurred"

        if (errorMessage === "Wrong old password") {
          setError("old_password", {
            type: "manual",
            message: "The old password is incorrect"
          })
        } else {
          console.error("Failed to change password:", errorMessage)
        }
      } else {
        console.error("Unknown error:", error)
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} height="400px" width="250px">
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
      </DialogContent>
    </Dialog>
  )
}

export default BoardPasswordChangeForm
