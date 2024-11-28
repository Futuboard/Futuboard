import { DeleteForever } from "@mui/icons-material"
import {
  Box,
  Button,
  ClickAwayListener,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography
} from "@mui/material"
import React from "react"
import { Controller, useForm } from "react-hook-form"

import { useDeleteTaskMutation } from "@/state/apiSlice"

import { Task, Task as TaskType, User } from "../../types"

interface DeleteTaskButtonProps {
  task: Task
}

const DeleteTaskButton: React.FC<DeleteTaskButtonProps> = ({ task }) => {
  const [deleteTask] = useDeleteTaskMutation()

  const [open, setOpen] = React.useState(false)

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleDelete = () => {
    deleteTask({ task: task })
    setOpen(false)
  }

  return (
    <div>
      <Tooltip title="Delete Card">
        <IconButton sx={{ color: "red" }} onClick={handleClickOpen}>
          <DeleteForever />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this card? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

interface TaskEditFormProps {
  onSubmit: (data: FormData) => void
  onCancel: () => void
  task: TaskType
}

interface FormData {
  taskTitle: string
  corners: User[]
  cornerNote: string
  description: string
  color: string
  size: number
}

const TaskEditForm: React.FC<TaskEditFormProps> = (props) => {
  const { onSubmit, onCancel, task } = props

  const initialFormValues = {
    taskTitle: task.title,
    corners: task.caretakers,
    cornerNote: task.cornernote,
    description: task.description,
    color: task.color,
    size: task.size
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm<FormData>({
    //set initial values form the task prop
    defaultValues: initialFormValues
  })

  const selectedColor = watch("color")

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue("color", event.target.value)
  }

  const closeModule = () => {
    if (JSON.stringify(initialFormValues) === JSON.stringify(getValues())) {
      onCancel()
      return
    }
    handleSubmit(onSubmit)()
  }

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data)
  }

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={closeModule}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography noWrap gutterBottom variant="h6">
                {" "}
                <b>{task.title}</b>
              </Typography>
            </Box>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="taskTitle"
              control={control}
              defaultValue={task.title}
              rules={{
                required: {
                  value: true,
                  message: "Task name is required"
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={
                    <span>
                      Name <span style={{ color: "red", fontSize: "1.2rem" }}>*</span>
                    </span>
                  }
                  multiline
                  maxRows={3}
                  fullWidth
                  inputProps={{ spellCheck: "false" }}
                  helperText={errors.taskTitle?.message}
                  error={Boolean(errors.taskTitle)}
                  onKeyDown={(event: { key: string; preventDefault: () => void }) => {
                    // the multiline field starts a new line when enter is pressed which doesnt make sense for a title, thus just send the form
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleSubmit(onSubmit)()
                    }
                  }}
                />
              )}
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
          <Grid item xs={240}>
            <TextField label="Corner note" fullWidth {...register("cornerNote", {})} />
          </Grid>
          <Grid item xs={240}>
            <TextField
              label="Description"
              multiline
              rows={11}
              fullWidth
              {...register("description", {
                //rows amount hardcoded due to bug with multiline textAreaAutoSize
              })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <Typography variant="subtitle1">Color</Typography>
              <RadioGroup
                row
                aria-label="color"
                value={selectedColor}
                onChange={handleColorChange}
                sx={{ bgcolor: "#c7c7c7", borderRadius: 1000, paddingLeft: 3 }}
              >
                <FormControlLabel value="#ffffff" control={<Radio style={{ color: "#ffffff" }} />} label={null} />
                <FormControlLabel value="#ffeb3b" control={<Radio style={{ color: "#ffeb3b" }} />} label={null} />
                <FormControlLabel value="#8bc34a" control={<Radio style={{ color: "#8bc34a" }} />} label={null} />
                <FormControlLabel value="#ff4081" control={<Radio style={{ color: "#ff4081" }} />} label={null} />
                <FormControlLabel value="#03a9f4" control={<Radio style={{ color: "#03a9f4" }} />} label={null} />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item container spacing={4} xs={12}>
            <Grid item xs={10}>
              <Button type="submit" color="primary" variant="contained">
                Save Changes
              </Button>
              <Button onClick={onCancel}>Cancel</Button>
            </Grid>
            <Grid item xs={1}>
              <DeleteTaskButton task={task} />
            </Grid>
          </Grid>
        </Grid>
      </form>
    </ClickAwayListener>
  )
}

export default TaskEditForm
