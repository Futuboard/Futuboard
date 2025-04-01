import { DeleteForever } from "@mui/icons-material"
import {
  Box,
  Button,
  ButtonGroup,
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
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material"
import React from "react"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"

import { useDeleteTaskMutation } from "@/state/apiSlice"
import { Task, Task as TaskType, User, TaskTemplate, SimpleScope } from "@/types"

import DescriptionEditField from "./DescriptionEditField"

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

interface TicketScopeListProps {
  task: Task
}

const TicketScopeList: React.FC<TicketScopeListProps> = ({ task }) => {
  if (task.scopes.length > 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: "10px",
          paddingTop: "15px",
          paddingBottom: "12px"
        }}
      >
        {task.scopes.map((scope: SimpleScope) => (
          <Box
            key={scope.scopeid}
            sx={{
              display: "flex",
              justifyContent: "center",
              backgroundColor: "#84D8FE",
              alignItems: "center",
              paddingY: "4px",
              paddingX: "10px",
              border: "solid 1px",
              borderColor: "gray",
              borderRadius: "4px"
            }}
          >
            <Typography
              sx={{
                fontSize: "13px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block"
              }}
            >
              {scope.title}
            </Typography>
          </Box>
        ))}
      </Box>
    )
  }
}

interface TaskFormProps {
  formTitle: string
  formType: string
  onSubmit: (data: FormData) => void
  onCancel: () => void
  onClose: (data: FormData | null) => void
  defaultValues: TaskType | TaskTemplate | null
}

interface FormData {
  taskTitle: string
  caretakers: User[]
  cornerNote: string
  description: string
  color: string
  size: number
}

const TaskForm: React.FC<TaskFormProps> = (props) => {
  const { formTitle, formType, onSubmit, onCancel, onClose, defaultValues } = props

  const initialFormValues = {
    taskTitle: defaultValues?.title || "",
    corners: defaultValues?.caretakers || [],
    cornerNote: defaultValues?.cornernote || "",
    description: defaultValues?.description || "",
    color: defaultValues?.color || "#ffffff",
    size: defaultValues?.size
  }

  const initialFormValuesRef = useRef(initialFormValues)

  const isTaskCreationForm = formType === "TaskCreation"
  const isTaskEditForm = formType === "TaskEdit"
  const isTaskTemplateForm = formType === "TaskTemplate"

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    //set initial values form the task prop
    defaultValues: initialFormValues
  })

  const colorOptions = ["#ffffff", "#ffeb3b", "#8bc34a", "#ff4081", "#03a9f4"]

  const selectedColor = watch("color")

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue("color", event.target.value)
  }

  const watchedValues = watch()

  const closeModule = () => {
    if (isTaskEditForm && JSON.stringify(initialFormValuesRef.current) === JSON.stringify(watchedValues)) {
      onClose(null)
    } else {
      onClose(watchedValues)
    }
  }

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data)
  }

  // Focus on the title field when the form is opened
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isTaskCreationForm && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isTaskCreationForm])

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={closeModule}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography
                gutterBottom
                variant="h6"
                sx={{
                  width: "100%",
                  maxHeight: 125,
                  wordWrap: "break-word",
                  overflowY: "auto",
                  textOverflow: "ellipsis",
                  fontWeight: "bold"
                }}
              >
                {formTitle}
              </Typography>
            </Box>
            <Divider />
            {defaultValues && isTaskEditForm && <TicketScopeList task={defaultValues as Task} />}
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={
                <span>
                  Name
                  {!isTaskTemplateForm && <span style={{ color: "red", fontSize: "1.2rem" }}>*</span>}
                </span>
              }
              inputRef={inputRef}
              inputProps={{ spellCheck: "false" }}
              multiline
              maxRows={4}
              fullWidth
              helperText={errors.taskTitle?.message}
              error={Boolean(errors.taskTitle)}
              {...register("taskTitle", {
                required: !isTaskTemplateForm
                  ? {
                      value: true,
                      message: "Task name is required"
                    }
                  : false
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
          <Grid item xs={240}>
            <TextField label="Corner note" fullWidth {...register("cornerNote", {})} />
          </Grid>
          <Grid item xs={240}>
            <DescriptionEditField
              description={defaultValues?.description || ""}
              onChange={(markdown) => setValue("description", markdown)}
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
                sx={{
                  bgcolor: "#F0F0F3",
                  borderRadius: 3,
                  paddingLeft: 3,
                  outlineStyle: "solid",
                  outlineColor: "#c4c4c4",
                  outlineWidth: "1px",
                  "&:hover": {
                    outlineColor: "#1a1a1a"
                  },
                  "&:focus-within": {
                    outlineColor: "#1976d2",
                    outlineWidth: "2px"
                  }
                }}
              >
                {colorOptions.map((val) => (
                  <FormControlLabel key={val} value={val} control={<Radio style={{ color: val }} />} label={null} />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ marginBottom: 2 }} />
            <Stack direction="row" justifyContent="space-between">
              <ButtonGroup color="primary">
                <Button type="submit" variant="contained">
                  {isTaskCreationForm ? "Submit" : "Save Changes"}
                </Button>
                <Button onClick={onCancel}>Cancel</Button>
              </ButtonGroup>
              {defaultValues && isTaskEditForm && <DeleteTaskButton task={defaultValues as Task} />}
            </Stack>
          </Grid>
        </Grid>
      </form>
    </ClickAwayListener>
  )
}

export default TaskForm
