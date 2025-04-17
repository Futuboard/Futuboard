import {
  Download,
  MoreVert,
  EnhancedEncryption,
  Edit,
  Gradient,
  ColorLens,
  AnalyticsOutlined,
  ViewWeek,
  AllOut,
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
import React, { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { Link, useParams } from "react-router-dom"

import { useGetUsersByBoardIdQuery, usePostUserToBoardMutation, useUpdateTaskTemplateMutation } from "@/state/apiSlice"
import { disableScope } from "@/state/scope"
import { TaskTemplate } from "@/types"

import BoardBackgroundColorForm from "../board/BoardBackgroundColorForm"
import BoardDeletionComponent from "../board/BoardDeletionComponent"
import BoardPasswordChangeForm from "../board/BoardPasswordChangeForm"
import BoardTitleChangeForm from "../board/BoardTitleChangeForm"
import CreateColumnButton from "../board/CreateColumnButton"
import InvitePopover from "../board/InvitePopover"
import MagnetIcon from "../board/MagnetIcon"
import ScopeList from "../board/ScopeList"
import TaskForm from "../board/TaskForm"
import UserCreationForm from "../board/UserCreationForm"
import UserList from "../board/UserList"

import HomeButton from "./HomeButton"

interface FormData {
  name: string
}

export const AddMagnetButton: React.FC = () => {
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
      <Tooltip title="Add Magnet">
        <IconButton onClick={handleClick} aria-label="add user">
          <MagnetIcon />
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
          <AnalyticsOutlined />
        </IconButton>
      </Link>
    </Tooltip>
  )
}

interface OpenScopeListButtonProps {
  handler: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const OpenScopeListButton: React.FC<OpenScopeListButtonProps> = ({ handler }) => {
  return (
    <Tooltip title="View and Set Scopes">
      <IconButton onClick={handler}>
        <AllOut sx={{ color: "black" }} />
      </IconButton>
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
  const [scopeListOpen, setScopeListOpen] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!scopeListOpen) {
      dispatch(disableScope())
    }
  }, [scopeListOpen, dispatch])

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

  const handleScopeList = () => {
    setScopeListOpen(!scopeListOpen)
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
    <Box
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
      sx={{ minWidth: 0, flexGrow: 1, marginRight: "calc(100% - 100vw + 3rem)" }}
    >
      {isSuccess && users.length > 0 && <UserList users={users} />}
      <AddMagnetButton />
      <CreateColumnButton boardId={boardId} />
      <OpenScopeListButton handler={handleScopeList} />
      <OpenAnalyticsButton boardId={boardId} />
      <InvitePopover />
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleMenu}
        sx={{ padding: "5px", color: "#2D3748" , zoom: "1.1"}}
      >
        <MoreVert />
      </IconButton>
      <ScopeList visible={scopeListOpen} boardId={boardId} closeDrawer={handleScopeList} />
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
          variant="h1"
          sx={{
            color: "#213547",
            marginLeft: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
            flexGrow: 1,
            fontSize: 24
          }}
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
