import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"

interface ScopeCreationFormProps {
  onSubmit: ({ scopeTitle }: { scopeTitle: string }) => void
  onCancel: () => void
}

const ScopeCreationForm: React.FC<ScopeCreationFormProps> = (props) => {
  const { onSubmit, onCancel } = props

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      scopeTitle: ""
    }
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2} direction="column" sx={{ width: 350 }}>
        <Grid item xs={12}>
          <Typography gutterBottom variant="h6">
            Create Scope
          </Typography>
          <Divider />
        </Grid>
        <Grid item>
          <TextField
            fullWidth
            inputRef={inputRef}
            label={
              <span>
                Name <span style={{ color: "red", fontSize: "1.2rem" }}>*</span>
              </span>
            }
            helperText={errors.scopeTitle?.message}
            error={Boolean(errors.scopeTitle)}
            {...register("scopeTitle", {
              required: {
                value: true,
                message: "Scope name is required"
              }
            })}
          />
        </Grid>
        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Button type="submit" color="primary" variant="contained">
            Submit
          </Button>
          <Button onClick={onCancel} variant="outlined" sx={{ marginLeft: 1 }}>
            Cancel
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default ScopeCreationForm
