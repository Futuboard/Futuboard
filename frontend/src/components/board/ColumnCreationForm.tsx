import { Checkbox } from "@mui/material"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"

interface AddColumnCreationFormProps {
  onSubmit: ({ columnTitle, swimlane }: { columnTitle: string; swimlane: boolean }) => void
  onCancel: () => void
}

const ColumnCreationForm: React.FC<AddColumnCreationFormProps> = (props) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      columnTitle: ""
    }
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const [swimlane, setSwimlane] = useState<boolean>(false)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const { onSubmit, onCancel } = props

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSwimlane(event.target.checked)
  }

  const handleFormSubmit = (data: { columnTitle: string }) => {
    onSubmit({ ...data, swimlane })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography gutterBottom variant="h6">
            {" "}
            Create Column{" "}
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <TextField
            inputRef={inputRef}
            label={
              <span>
                Name <span style={{ color: "red", fontSize: "1.2rem" }}>*</span>
              </span>
            }
            helperText={errors.columnTitle?.message}
            error={Boolean(errors.columnTitle)}
            {...register("columnTitle", {
              required: {
                value: true,
                message: "Column name is required"
              }
            })}
          />
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h6">Add swimlanes</Typography>
        </Grid>
        <Grid item xs={8}>
          <Checkbox checked={swimlane} onChange={handleCheckboxChange} />
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={6}>
          <Button type="submit" color="primary" variant="contained">
            Submit
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default ColumnCreationForm
