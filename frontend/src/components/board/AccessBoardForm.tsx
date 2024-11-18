import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import React from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { useLoginMutation } from "@/state/apiSlice"

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
      alert("Hmm we got an error")
      return
    }

    const { success } = loginResponse.data

    // Succesful login in handles in apiSlice.ts
    if (!success) {
      alert("Wrong password")
    }
  }
  const onCancel = () => {
    navigate("/")
  }

  const handleFormSubmit = (data: FormData) => {
    // Perform password validation or authentication here
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography gutterBottom variant="h6">
            Enter Board Password
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Password"
            type="password"
            helperText={errors.password?.message}
            error={Boolean(errors.password)}
            {...register("password")}
          />
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
