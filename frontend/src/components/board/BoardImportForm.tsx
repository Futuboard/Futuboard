import styled from "@emotion/styled"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useForm } from "react-hook-form"

import { NewBoardFormImport } from "../../types"

interface AddBoardCreationFormProps {
  onSubmit: (_: NewBoardFormImport) => void
  onCancel: () => void
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1
})

const BoardImportForm: React.FC<AddBoardCreationFormProps> = ({ onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<NewBoardFormImport>({
    defaultValues: {
      title: "",
      password: "",
      file: undefined
    }
  })

  const handleFormSubmit = (data: NewBoardFormImport) => {
    onSubmit({ ...data, file: data.file })
  }

  const uploadedFileName = watch("file")?.[0]?.name

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={1} textAlign="center" height="285px" width="250px">
        <Grid item xs={12}>
          <Typography gutterBottom variant="h6">
            {" "}
            Import board{" "}
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
          <TextField label="Password" type="password" {...register("password")} />
        </Grid>
        <Grid item xs={12}>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            sx={{ width: "84%" }}
          >
            Upload file
            <VisuallyHiddenInput type="file" {...register("file")} />
          </Button>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: "8px" }}>
            Uploaded file: {uploadedFileName || "No file uploaded"}
          </Typography>
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

export default BoardImportForm
