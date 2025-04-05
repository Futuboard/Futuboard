import { ButtonGroup, Divider, Typography } from "@mui/material"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"

interface AddActionCreationFormProps {
  onSubmit: ({ actionTitle, resetActionTitle }: { actionTitle: string; resetActionTitle: () => void }) => void
  onCancel: () => void
}

interface FormData {
  actionTitle: string
}

const ActionEditForm: React.FC<AddActionCreationFormProps> = (props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const { onSubmit, onCancel } = props

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      actionTitle: ""
    }
  })

  const resetActionTitle = () => {
    setValue("actionTitle", "")
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, resetActionTitle }))}>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography>Add action</Typography>
          <Divider flexItem />
        </Grid>
        <Grid item xs={12}>
          <TextField
            inputRef={inputRef}
            label={
              <span>
                Name <span style={{ color: "red", fontSize: "1.2rem" }}>*</span>
              </span>
            }
            size={"small"}
            helperText={errors.actionTitle?.message}
            error={Boolean(errors.actionTitle)}
            {...register("actionTitle", {
              required: {
                value: true,
                message: "Action name is required"
              }
            })}
          />
        </Grid>
        <Grid item xs={12}>
          <ButtonGroup size="small">
            <Button type="submit" color="primary" variant="contained" aria-label="submit action">
              Submit
            </Button>
            <Button onClick={onCancel} aria-label="cancel action">
              Cancel
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    </form>
  )
}

export default ActionEditForm
