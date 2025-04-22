import { Button, Grid, Typography, Dialog, DialogContent, Divider } from "@mui/material"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useUpdateBoardPasswordMutation } from "@/state/apiSlice"
import { PasswordChangeFormData } from "@/types"

import PasswordField from "../home/PasswordField"

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
          <Grid container spacing={3} flexDirection="column">
            <Grid item>
              <Typography gutterBottom variant="h6">
                Enter a New Password
              </Typography>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <PasswordField
                label="Old Password"
                errorText={errors.old_password?.message}
                register={register("old_password")}
              />
            </Grid>
            <Grid item xs={12}>
              <PasswordField
                label="New Password"
                errorText={errors.new_password?.message}
                register={register("new_password")}
              />
            </Grid>
            <Grid item xs={12}>
              <PasswordField
                label="Confirm Password"
                errorText={errors.confirm_password?.message}
                register={register("confirm_password")}
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

export default BoardPasswordChangeForm
