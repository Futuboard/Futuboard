import { Box, Checkbox } from "@mui/material"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
          justifyContent: "space-between",
          height: "220px",
          width: "300px"
        }}
      >
        <Typography gutterBottom variant="h6">
          Create Column
        </Typography>
        <Divider flexItem />
        <TextField
          fullWidth
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
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
          <Typography variant="h6">Add swimlanes</Typography>
          <Checkbox checked={swimlane} onChange={handleCheckboxChange} />
        </Box>
        <Divider flexItem />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: "100%"
          }}
        >
          <Button type="submit" color="primary" variant="contained" sx={{ marginRight: 3 }}>
            Submit
          </Button>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
        </Box>
      </Box>
    </form>
  )
}

export default ColumnCreationForm
