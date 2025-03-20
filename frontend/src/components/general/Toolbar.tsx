import {
  Download,
  MoreVert,
  EnhancedEncryption,
  Edit,
  Gradient,
  ColorLens,
  Analytics,
  ViewWeek
} from "@mui/icons-material"
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Toolbar,
  Tooltip,
  Typography
} from "@mui/material"
import React, { useState } from "react"
import { Link, useParams } from "react-router-dom"

import { useGetUsersByBoardIdQuery, usePostUserToBoardMutation, useUpdateTaskTemplateMutation } from "@/state/apiSlice"
import { TaskTemplate } from "@/types"

import BoardBackgroundColorForm from "../board/BoardBackgroundColorForm"
import BoardDeletionComponent from "../board/BoardDeletionComponent"
import BoardPasswordChangeForm from "../board/BoardPasswordChangeForm"
import BoardTitleChangeForm from "../board/BoardTitleChangeForm"
import CopyToClipboardButton from "../board/CopyToClipBoardButton"
import CreateColumnButton from "../board/CreateColumnButton"
import TaskForm from "../board/TaskForm"
import UserCreationForm from "../board/UserCreationForm"
import UserList from "../board/UserList"

import HomeButton from "./HomeButton"

interface FormData {
  name: string
}

export const AddUserButton: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const { id = "default-id" } = useParams()
  const [addUser] = usePostUserToBoardMutation()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleOnSubmit = async (data: FormData) => {
    await addUser({ boardId: id, user: data })

    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const popOverid = open ? "popover" : undefined

  return (
    <div>
      <Tooltip title="Add User">
        <IconButton onClick={handleClick} aria-label="add user">
          <svg
            style={{ width: "1.5rem", height: "1.5rem", color: "#2D3748" }}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4H7Zm8-1c0-.6.4-1 1-1h1v-1a1 1 0 1 1 2 0v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1h-1a1 1 0 0 1-1-1Z"
              clipRule="evenodd"
            />
          </svg>
        </IconButton>
      </Tooltip>
      <Popover
        disableRestoreFocus
        id={popOverid}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        transformOrigin={{
          vertical: -10,
          horizontal: 50
        }}
      >
        <Paper sx={{ height: "fit-content", padding: "20px", width: "200px" }}>
          <UserCreationForm onSubmit={handleOnSubmit} onCancel={handleClose} />
        </Paper>
      </Popover>
    </div>
  )
}

interface OpenAnalyticsButtonProps {
  boardId: string
}

const OpenAnalyticsButton: React.FC<OpenAnalyticsButtonProps> = ({ boardId }) => {
  return (
    <Tooltip title="Open Analytics">
      <Link to={"/board/" + boardId + "/charts/cumulativeFlow"}>
        <IconButton sx={{ color: "#2d3748" }}>
          <Analytics />
        </IconButton>
      </Link>
    </Tooltip>
  )
}

type BoardToolBarProps = {
  title: string
  boardId: string
  taskTemplate: TaskTemplate
  boardBackgroundColor: string
}

interface TaskFormData {
  taskTitle: string
  description: string
  cornerNote: string
  size: number
  color: string
}

const BoardToolBar = ({ title, boardId, taskTemplate, boardBackgroundColor }: BoardToolBarProps) => {
  const { data: users, isSuccess } = useGetUsersByBoardIdQuery(boardId)
  const { id = "default-id" } = useParams()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)
  const [updateTaskTemplate] = useUpdateTaskTemplateMutation()
  const [passwordFormOpen, setPasswordFormOpen] = useState(false)
  const [titleFormOpen, setTitleFormOpen] = useState(false)
  const [colorFormOpen, setColorFormOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)

  const handleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleExportAndClose = () => {
    handleExport()
    handleClose()
  }

  const handleSubmitTaskFormData = async (data: TaskFormData | null) => {
    try {
      if (data) {
        const templateObject = {
          title: data.taskTitle,
          description: data.description,
          cornernote: data.cornerNote,
          size: data.size,
          color: data.color
        }
        await updateTaskTemplate({ boardId: id, newTaskTemplate: templateObject }).unwrap()
        setTaskFormOpen(false)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleExport = async () => {
    const response = await fetch(`${import.meta.env.VITE_DB_ADDRESS}export/${boardId}`, {
      method: "GET"
    })

    if (!response.ok) {
      throw new Error("Network response was not ok")
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    let filename = `${title}.json`
    const contentDisposition = response.headers.get("Content-Disposition")
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/)
      if (match) filename = match[1]
    }

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="flex-end" sx={{ minWidth: 0, flexGrow: 1 }}>
      {isSuccess && users.length > 0 && <UserList users={users} />}
      <AddUserButton />
      <CopyToClipboardButton />
      <CreateColumnButton boardId={boardId} />
      <OpenAnalyticsButton boardId={boardId} />
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleMenu}
        sx={{ padding: "5px", color: "#2D3748" }}
      >
        <MoreVert />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button"
        }}
      >
        <MenuItem onClick={() => setTitleFormOpen(true)} sx={{ py: 1 }}>
          <Edit sx={{ fontSize: "1rem", mr: 1 }} />
          <Typography variant="body2">Edit Board Name</Typography>
        </MenuItem>
        <MenuItem onClick={() => setPasswordFormOpen(true)} sx={{ py: 1 }}>
          <EnhancedEncryption sx={{ fontSize: "1rem", mr: 1 }} />
          <Typography variant="body2">Change Board Password</Typography>
        </MenuItem>
        <MenuItem onClick={() => setColorFormOpen(true)} sx={{ py: 1 }}>
          <ColorLens sx={{ fontSize: "1rem", mr: 1 }} />
          <Typography variant="body2">Board Background Color</Typography>
        </MenuItem>
        <MenuItem onClick={() => setTaskFormOpen(true)} sx={{ py: 1 }}>
          <Gradient sx={{ fontSize: "1rem", mr: 1 }} />
          <Typography variant="body2">Edit Card Template</Typography>
        </MenuItem>
        <MenuItem onClick={handleExportAndClose} sx={{ py: 1 }}>
          <Download sx={{ fontSize: "1rem", mr: 1 }} />
          <Typography variant="body2">Download Board JSON</Typography>
        </MenuItem>
        <BoardDeletionComponent />
      </Menu>
      <Box>
        <BoardTitleChangeForm title={title} onClose={() => setTitleFormOpen(false)} open={titleFormOpen} />
        <BoardPasswordChangeForm onClose={() => setPasswordFormOpen(false)} open={passwordFormOpen} />
        <BoardBackgroundColorForm
          onClose={() => setColorFormOpen(false)}
          open={colorFormOpen}
          boardColor={boardBackgroundColor}
        />
        <Dialog open={taskFormOpen} onClose={() => setTaskFormOpen(false)}>
          <DialogContent>
            <TaskForm
              formTitle={"Edit Card Template"}
              formType={"TaskTemplate"}
              onSubmit={handleSubmitTaskFormData}
              onCancel={() => setTaskFormOpen(false)}
              onClose={() => setTaskFormOpen(false)}
              defaultValues={taskTemplate}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  )
}

interface chartToolBarProps {
  boardId: string
}

const ChartToolbar: React.FC<chartToolBarProps> = ({ boardId }) => {
  return (
    <Box display="flex" alignItems="center" justifyContent="flex-end" sx={{ minWidth: 0, flexGrow: 1 }}>
      <Link to={`/board/${boardId}`}>
        <Button variant="contained" endIcon={<ViewWeek />}>
          Back to board
        </Button>
      </Link>
    </Box>
  )
}

interface ToolBarProps {
  title: string
  boardId?: string
  boardBackgroundColor?: string
  taskTemplate?: TaskTemplate
  chartToolbar?: boolean
}

const ToolBar = ({ title, boardId, taskTemplate, boardBackgroundColor, chartToolbar }: ToolBarProps) => {
  return (
    <AppBar
      position="fixed"
      sx={{ background: "white", height: "65px", boxShadow: "none", borderBottom: "2px solid #D1D5DB" }}
    >
      <Toolbar disableGutters sx={{ paddingX: 2 }}>
        <HomeButton />
        <Divider
          orientation="vertical"
          sx={{ marginX: 2, borderRightWidth: "2px", height: "35px", borderColor: "#D1D5DB" }}
        />
        <Typography
          variant="h6"
          sx={{ color: "#213547", marginLeft: 1, height: "100%", display: "flex", alignItems: "center", flexGrow: 1 }}
        >
          {title}
        </Typography>
        {boardId && taskTemplate && (
          <BoardToolBar
            title={title}
            boardId={boardId}
            taskTemplate={taskTemplate}
            boardBackgroundColor={boardBackgroundColor || "white"}
          />
        )}
        {boardId && chartToolbar && <ChartToolbar boardId={boardId} />}
      </Toolbar>
    </AppBar>
  )
}

export default ToolBar
