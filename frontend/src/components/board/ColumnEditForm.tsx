import { DeleteForever } from "@mui/icons-material"
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Typography
} from "@mui/material"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import React, { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"

import { useDeleteColumnMutation } from "@/state/apiSlice"

import { Column } from "../../types"

interface DeleteColumnButtonProps {
  column: Column
}

const DeleteColumnButton: React.FC<DeleteColumnButtonProps> = ({ column }) => {
  const [deleteColumn] = useDeleteColumnMutation()

  const [open, setOpen] = React.useState(false)

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleDelete = () => {
    deleteColumn({ column: column })
    setOpen(false)
  }

  return (
    <div>
      <Tooltip title="Delete Column">
        <IconButton sx={{ color: "red" }} onClick={handleClickOpen}>
          <DeleteForever />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Column? This action cannot be undone. This will also delete all cards
            in this column.
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

interface AddColumnCreationFormProps {
  onSubmit: (data: FormData) => void
  onCancel: () => void
  column: Column
}

interface FormData {
  columnTitle: string
  columnWipLimit: number | null
  columnWipLimitStory: number | null
}

const ColumnEditForm: React.FC<AddColumnCreationFormProps> = (props) => {
  const inputRefName = useRef<HTMLInputElement>(null)
  const inputRefWipLimit = useRef<HTMLInputElement>(null)
  const inputRefWipLimitStory = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRefWipLimit.current && inputRefName.current && inputRefWipLimitStory.current) {
      switch (true) {
        case inputRefWipLimit.current.value.trim() === "":
          inputRefWipLimit.current.focus()
          break
        case inputRefWipLimitStory.current.value.trim() === "":
          inputRefWipLimitStory.current.focus()
          break
        default:
          inputRefName.current.focus()
      }
    }
  }, [])

  const { onSubmit, onCancel, column } = props
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      columnTitle: column.title,
      columnWipLimit: column.wip_limit,
      columnWipLimitStory: column.wip_limit_story
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography>
              <b>{column.title}</b>
            </Typography>
            <DeleteColumnButton column={column} />
          </Box>
          <Divider />
        </Grid>
        <Divider />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              inputRef={inputRefName}
              label={
                <span>
                  Name <span style={{ color: "red", fontSize: "1.2rem" }}>*</span>
                </span>
              }
              helperText={errors.columnTitle?.message}
              error={Boolean(errors.columnTitle)}
              {...register("columnTitle", {
                minLength: {
                  value: 3,
                  message: "Column name must be at least 3 characters"
                },
                required: {
                  value: true,
                  message: "Column name is required"
                }
              })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              type="number"
              inputRef={inputRefWipLimit}
              label="Ticket count limit"
              helperText={errors.columnWipLimit?.message}
              error={Boolean(errors.columnWipLimit)}
              {...register("columnWipLimit", {
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: "Limit must be at least 1"
                },
                max: {
                  value: 99,
                  message: "Limit must be smaller than 100"
                }
              })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              type="number"
              inputRef={inputRefWipLimitStory}
              label="Story point limit"
              helperText={errors.columnWipLimitStory?.message}
              error={Boolean(errors.columnWipLimitStory)}
              {...register("columnWipLimitStory", {
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: "Limit must be at least 1"
                },
                max: {
                  value: 999900,
                  message: "Limit can not exceed 999900"
                }
              })}
            />
          </Grid>
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

export default ColumnEditForm
