import {
  Button,
  ClickAwayListener,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from "@mui/material"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"

import { User } from "../../types"

interface TaskCreationFormProps {
  onSubmit: (data: FormData) => void
  onCancel: () => void
  defaultValues: FormData | null
  setDefaultValues: (data: FormData | null) => void
}

interface FormData {
  taskTitle: string
  size?: number
  corners?: User[]
  description?: string
  cornerNote?: string
  color?: string
}

const TaskCreationForm: React.FC<TaskCreationFormProps> = (props) => {
  // Focus on the title field when the form is opened
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const { onSubmit, onCancel, defaultValues, setDefaultValues } = props

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    defaultValues: defaultValues || {
      taskTitle: "",
      corners: [],
      cornerNote: "",
      description: "",
      color: "#ffffff",
      size: undefined
    }
  })

  const selectedColor = watch("color")

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue("color", event.target.value)
  }

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data)
  }

  const watchedValues = watch()

  const onModuleClose = () => {
    if (JSON.stringify(defaultValues) === JSON.stringify(watchedValues)) {
      onCancel()
      return
    }
    if (setDefaultValues) {
      setDefaultValues(watchedValues)
    }
  }

  const onFormCancel = () => {
    setDefaultValues(null)
    onCancel()
  }
  return (
    <ClickAwayListener onClickAway={onModuleClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography gutterBottom variant="h6">
              Create Card
            </Typography>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={
                <span>
                  Name <span style={{ color: "red", fontSize: "1.2rem" }}>*</span>
                </span>
              }
              inputRef={inputRef}
              inputProps={{ spellCheck: "false" }}
              multiline
              fullWidth
              helperText={errors.taskTitle?.message}
              error={Boolean(errors.taskTitle)}
              {...register("taskTitle", {
                required: {
                  value: true,
                  message: "Task name is required"
                }
              })}
              //the multiline field starts a new line when enter is pressed which doesnt make sense for a title, thus just send the form
              onKeyDown={(event: { key: string; preventDefault: () => void }) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleSubmit(onSubmit)()
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              type="number"
              label="Size"
              placeholder="Size"
              InputLabelProps={{ shrink: true }}
              helperText={errors.size?.message}
              error={Boolean(errors.size)}
              {...register("size", {
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: "Size must be at least 0"
                },
                max: {
                  value: 9999,
                  message: "Size can not exceed 9999"
                }
              })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Corner note" fullWidth {...register("cornerNote")} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" multiline minRows={6} maxRows={15} fullWidth {...register("description")} />
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <Typography variant="subtitle1">Color</Typography>
              <RadioGroup row aria-label="color" value={selectedColor} onChange={handleColorChange}>
                <FormControlLabel
                  value="#ffffff"
                  control={<Radio style={{ color: "#ffffff" }} />}
                  checked={selectedColor === "#ffffff"}
                  label={undefined}
                />
                <FormControlLabel
                  value="#ffeb3b"
                  control={<Radio style={{ color: "#ffeb3b" }} />}
                  checked={selectedColor === "#ffeb3b"}
                  label={undefined}
                />
                <FormControlLabel
                  value="#8bc34a"
                  control={<Radio style={{ color: "#8bc34a" }} />}
                  checked={selectedColor === "#8bc34a"}
                  label={undefined}
                />
                <FormControlLabel
                  value="#ff4081"
                  control={<Radio style={{ color: "#ff4081" }} />}
                  checked={selectedColor === "#ff4081"}
                  label={undefined}
                />
                <FormControlLabel
                  value="#03a9f4"
                  control={<Radio style={{ color: "#03a9f4" }} />}
                  checked={selectedColor === "#03a9f4"}
                  label={undefined}
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" color="primary" variant="contained">
              Submit
            </Button>
            <Button onClick={onFormCancel}>Cancel</Button>
          </Grid>
        </Grid>
      </form>
    </ClickAwayListener>
  )
}

export default TaskCreationForm
