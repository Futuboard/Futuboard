import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import React from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { useLoginMutation } from "@/state/apiSlice"

import PasswordField from "../home/PasswordField"

interface AccessBoardFormProps {
  id: string
}

interface FormData {
  password: string
}

const AccessBoardForm: React.FC<AccessBoardFormProps> = ({ id }) => {
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

  const [tryLogin] = useLoginMutation()

  const onSubmit = async (data: FormData) => {
    const loginResponse = await tryLogin({ boardId: id, password: data.password })
    if ("error" in loginResponse) {
      alert("An error occurred. Please try again later.")
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
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography gutterBottom variant="h6">
            Enter Board Password
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <PasswordField register={register("password")} errorText={errors.password?.message} />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" color="primary" variant="contained">
            Submit
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default AccessBoardForm
