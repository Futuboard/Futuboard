import { Download, MoreVert, EnhancedEncryption, Edit } from "@mui/icons-material"
import {
  AppBar,
  Box,
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
import { useParams } from "react-router-dom"

import { useGetUsersByBoardIdQuery, usePostUserToBoardMutation } from "@/state/apiSlice"

import BoardDeletionComponent from "./BoardDeletionComponent"
import BoardPasswordChangeForm from "./BoardPasswordChangeForm"
import BoardTitleChangeForm from "./BoardTitleChangeForm"
import CopyToClipboardButton from "./CopyToClipBoardButton"
import CreateColumnButton from "./CreateColumnButton"
import HomeButton from "./HomeButton"
import UserCreationForm from "./UserCreationForm"
import UserList from "./UserList"

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
        <IconButton onClick={handleClick}>
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

interface ToolBarProps {
  title: string
  boardId: string // Assuming boardId is also a string
}

//refactor later
const ToolBar = ({ title, boardId }: ToolBarProps) => {
  const { data: users, isSuccess } = useGetUsersByBoardIdQuery(boardId)

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)

  const [passwordFormOpen, setPasswordFormOpen] = useState(false)
  const [titleFormOpen, setTitleFormOpen] = useState(false)

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

  const handleOpenTitleForm = () => {
    setTitleFormOpen(true)
  }

  const handleCloseTitleForm = () => {
    setTitleFormOpen(false)
  }

  const handleOpenPasswordForm = () => {
    setPasswordFormOpen(true)
  }

  const handleClosePasswordForm = () => {
    setPasswordFormOpen(false)
  }

  const handleExport = async () => {
    const date = new Date()
    const timestamp = date
      .toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/[^a-zA-Z0-9]/g, "_")
    const filename = title + "-" + timestamp
    const response = await fetch(
      `${import.meta.env.VITE_DB_ADDRESS}export/${boardId}/${filename.replace(/[^A-Za-z0-9\-._~]/g, "_")}/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "text/csv"
        }
      }
    )
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    a.click()
  }

  return (
    <AppBar
      position="fixed"
      sx={{ background: "white", height: "65px", boxShadow: "none", borderBottom: "2px solid #D1D5DB" }}
    >
      <Toolbar sx={{ justifyContent: "center" }}>
        <Box display="flex" alignContent="center" sx={{ flexGrow: 1 }}>
          <HomeButton />
          <Divider
            orientation="vertical"
            flexItem
            sx={{ margin: "0 10px", borderRightWidth: "2px", height: "35px", marginTop: "5px", borderColor: "#D1D5DB" }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "#2D3748", marginLeft: "10px", marginTop: "7px" }}
          >
            {title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} style={{ marginTop: "3px" }}>
            {isSuccess && users.length > 0 && <UserList users={users} />}
          </Box>
          <div style={{ marginLeft: "10px" }}>
            <AddUserButton />
          </div>
          <CopyToClipboardButton />
          <CreateColumnButton boardId={boardId} />
          <IconButton
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={handleMenu}
            sx={{ padding: "5px" }}
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
            <MenuItem onClick={handleOpenTitleForm} sx={{ py: 1 }}>
              <Edit sx={{ fontSize: "1rem", mr: 1 }} />
              <Typography variant="body2">Edit Board Name</Typography>
            </MenuItem>
            <MenuItem onClick={handleOpenPasswordForm} sx={{ py: 1 }}>
              <EnhancedEncryption sx={{ fontSize: "1rem", mr: 1 }} />
              <Typography variant="body2">Change Board Password</Typography>
            </MenuItem>
            <MenuItem onClick={handleExportAndClose} sx={{ py: 1 }}>
              <Download sx={{ fontSize: "1rem", mr: 1 }} />
              <Typography variant="body2">Download Board CSV</Typography>
            </MenuItem>
            <BoardDeletionComponent />
          </Menu>
        </Box>
        <Box>
          <Dialog open={titleFormOpen} onClose={handleCloseTitleForm}>
            <DialogContent>
              <BoardTitleChangeForm title={title} onClose={handleCloseTitleForm} />
            </DialogContent>
          </Dialog>
          <Dialog open={passwordFormOpen} onClose={handleClosePasswordForm}>
            <DialogContent>
              <BoardPasswordChangeForm onClose={handleClosePasswordForm} />
            </DialogContent>
          </Dialog>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default ToolBar
