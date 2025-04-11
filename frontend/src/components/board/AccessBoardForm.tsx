import { Card } from "@mui/material"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import React from "react"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"

import { useLoginMutation } from "@/state/apiSlice"
import { setNotification } from "@/state/notification"
import { Board } from "@/types"

import ToolBar from "../general/Toolbar"
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "75vh"
      }}
    >
      <ToolBar boardId={board.boardid} title={board.title} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "center", padding: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body1" fontSize={20}>
              Log in to edit
            </Typography>
            <PasswordField register={register("password")} errorText={errors.password?.message} />
            <Box sx={{ display: "flex", flexDirection: "row", gap: 1, justifyContent: "center" }}>
              <Button type="submit" color="primary" variant="contained">
                Log in
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
        </Card>
      </form>
    </Box>
  )
}

export default AccessBoardForm
