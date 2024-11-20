import { EnhancedEncryption } from "@mui/icons-material"
import { Box, Button, Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useUpdateBoardPasswordMutation } from "@/state/apiSlice"

interface PasswordFormData {
  old_password: string
  new_password: string
  confirm_password: string
}

const BoardPasswordForm = () => {
  const { id = "default-id" } = useParams()
  const [open, setOpen] = useState(false)
  const [updateBoardPassword] = useUpdateBoardPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PasswordFormData>()

  const handleOpenModal = () => {
    setOpen(true)
  }

  const handleCloseModal = () => {
    setOpen(false)
  }

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await updateBoardPassword({ boardId: id, newPassword: data }).unwrap()
      handleCloseModal()
    } catch (error) {
      console.error("Failed to change password:", error)
    }
  }

  return (
    <Box>
      <MenuItem onClick={handleOpenModal} sx={{ py: 1 }}>
        <EnhancedEncryption sx={{ fontSize: "1rem", mr: 1 }} />
        <Typography variant="body2">Edit Board Password</Typography>
      </MenuItem>
      <Dialog open={open} onClose={handleCloseModal}>
        <Box>
          <DialogTitle>Enter new password</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <TextField
                  label="Old Password"
                  size="small"
                  helperText={errors.old_password?.message}
                  error={Boolean(errors.old_password)}
                  {...register("old_password")}
                />
                <TextField
                  label="New Password"
                  size="small"
                  helperText={errors.new_password?.message}
                  error={Boolean(errors.new_password)}
                  {...register("new_password")}
                />
                <TextField
                  label="Confirm Password"
                  size="small"
                  helperText={errors.confirm_password?.message}
                  error={Boolean(errors.confirm_password)}
                  {...register("confirm_password")}
                />
                <Button variant="contained" type="submit">
                  Submit
                </Button>
              </Stack>
            </form>
          </DialogContent>
        </Box>
      </Dialog>
    </Box>
  )
}

export default BoardPasswordForm
