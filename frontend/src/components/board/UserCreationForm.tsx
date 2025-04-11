import { ButtonGroup } from "@mui/material"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { boardsApi } from "@/state/apiSlice"
import { store } from "@/state/store"

interface AddUserCreationFormProps {
  onSubmit: ({ name }: { name: string }) => void
  onCancel: () => void
}

const selectUsersByBoardId = boardsApi.endpoints.getUsersByBoardId.select

const UserCreationForm: React.FC<AddUserCreationFormProps> = (props) => {
  const state = store.getState()
  const { id = "default-id" } = useParams()
  const userList = selectUsersByBoardId(id)(state).data || []

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: ""
    }
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const { onSubmit, onCancel } = props

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography gutterBottom variant="body1">
            Add Magnet
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <TextField
            inputRef={inputRef}
            size="small"
            label={
              <span>
                Name <span style={{ color: "red", fontSize: "1.2rem" }}>*</span>
              </span>
            }
            helperText={errors.name?.message}
            error={Boolean(errors.name)}
            {...register("name", {
              required: {
                value: true,
                message: "User name is required"
              },
              validate: {
                unique: (value) => {
                  // Check if the name already exists in the user list
                  const isUnique = !userList.some((user) => user.name === value)
                  if (!isUnique) {
                    return "User with this name already exists. Please choose a unique name."
                  }
                  return true
                }
              }
            })}
          />
        </Grid>
        <Grid item xs={12}>
          <ButtonGroup size="small">
            <Button type="submit" color="primary" variant="contained">
              Submit
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    </form>
  )
}

export default UserCreationForm
