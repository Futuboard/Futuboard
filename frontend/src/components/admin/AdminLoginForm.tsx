import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { useCheckAdminPasswordMutation } from "@/state/apiSlice"
import { getAdminPassword, setAdminPassword } from "@/state/auth"

interface Props {
  setIsAuthenticated: (value: boolean) => void
}

const AdminLoginForm = ({ setIsAuthenticated }: Props) => {
  const [checkAdminPassword] = useCheckAdminPasswordMutation()

  useEffect(() => {
    const storedPassword = getAdminPassword()
    if (storedPassword) {
      handlePasswordCheck(storedPassword)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    setError,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<{ password: string }>({
    defaultValues: {
      password: ""
    }
  })

  const handleFormSubmit = async ({ password }: { password: string }) => {
    const isSuccessful = await handlePasswordCheck(password)
    if (!isSuccessful) {
      setError("password", { message: "Invalid password" })
    }
  }

  const handlePasswordCheck = async (password: string) => {
    const response = await checkAdminPassword(password)
    if ("data" in response && response.data.success) {
      setAdminPassword(password)
      setIsAuthenticated(true)

      return true
    }

    return false
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography gutterBottom variant="h6">
            Log in to the Admin Panel
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
          <Button sx={{ marginLeft: 2 }} href="/">
            Cancel
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default AdminLoginForm
