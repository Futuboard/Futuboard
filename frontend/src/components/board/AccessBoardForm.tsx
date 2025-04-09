import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Typography from "@mui/material/Typography"
import React from "react"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"

import { useLoginMutation } from "@/state/apiSlice"
import { setNotification } from "@/state/notification"
import { Board } from "@/types"

import PasswordField from "../home/PasswordField"

interface AccessBoardFormProps {
  board: Board
  tryLogin: ReturnType<typeof useLoginMutation>[0]
  handleOpenInReadOnly: () => void
}

interface FormData {
  password: string
}

const AccessBoardForm: React.FC<AccessBoardFormProps> = ({ board, tryLogin, handleOpenInReadOnly }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      password: ""
    }
  })
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const onSubmit = async (data: FormData) => {
    const loginResponse = await tryLogin({ boardId: board.boardid, password: data.password })
    if ("error" in loginResponse) {
      dispatch(setNotification({ text: "Error when validating password. Please try again later.", type: "error" }))
      return
    }

    const { success } = loginResponse.data

    // Succesful login in handled in apiSlice.ts
    if (!success) {
      setError("password", { message: "Invalid password" })
    }
  }
  const onCancel = () => {
    navigate("/")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "center" }}>
        <Box sx={{ display: "flex", flexDirection: "column", marginBottom: 2 }}>
          <Typography gutterBottom variant="h1" fontSize={28}>
            {board.title}
          </Typography>
          <Divider />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body1" fontSize={20}>
            Log in to edit
          </Typography>
          <PasswordField register={register("password")} errorText={errors.password?.message} />
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, justifyContent: "center" }}>
            <Button type="submit" color="primary" variant="contained">
              Log in
            </Button>
            <Button onClick={onCancel} variant="outlined" color="primary">
              Cancel
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" fontSize={20} fontWeight={700}>
          or
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <Typography variant="body1" fontSize={20}>
            View in read-only mode
          </Typography>
          <Button onClick={handleOpenInReadOnly} variant="outlined" color="primary" sx={{ width: "fit-content" }}>
            View board
          </Button>
        </Box>
      </Box>
    </form>
  )
}

export default AccessBoardForm
