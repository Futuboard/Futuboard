import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useForm } from "react-hook-form"

import { NewBoardFormData } from "../../types"

interface AddBoardCreationFormProps {
  onSubmit: (_: NewBoardFormData) => void
  onCancel: () => void
}

const BoardCreationForm: React.FC<AddBoardCreationFormProps> = ({ onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<NewBoardFormData>({
    defaultValues: {
      title: "",
      password: ""
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={1} textAlign="center" height="285px" width="250px">
        <Grid item xs={12}>
          <Typography gutterBottom variant="h6">
            {" "}
            Create board{" "}
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Name"
            helperText={errors.title?.message}
            error={Boolean(errors.title)}
            {...register("title", {
              minLength: {
                value: 3,
                message: "Board name must be at least 3 characters"
              },
              maxLength: {
                value: 40,
                message: "Board name can be up to 40 characters"
              },
              required: {
                value: true,
                message: "Board name is required"
              }
            })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Password" {...register("password")} />
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

export default BoardCreationForm
