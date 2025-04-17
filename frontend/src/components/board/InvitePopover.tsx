import InfoIcon from "@mui/icons-material/Info"
import ShareIcon from "@mui/icons-material/Share"
import { Popover, Divider, TextField, Typography, IconButton, Paper, Tooltip, Stack } from "@mui/material"
import { useState, MouseEvent } from "react"

import CopyToClipboardButton from "../board/CopyToClipBoardButton"

interface ShareButtonProps {
  clickHandler: (event: MouseEvent<HTMLElement>) => void
}

const ShareButton: React.FC<ShareButtonProps> = ({ clickHandler }) => {
  return (
    <Tooltip title={"Invite Collaborators"} disableInteractive>
      <IconButton onClick={clickHandler}>
        <ShareIcon />
      </IconButton>
    </Tooltip>
  )
}

interface CopyTextComponentProps {
  copyContent: string
  copyTooltip: string
}

const CopyTextComponent: React.FC<CopyTextComponentProps> = ({ copyContent, copyTooltip }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
      <TextField
        defaultValue={copyContent}
        fullWidth
        size="small"
        variant="outlined"
        inputProps={{ sx: { width: 200, height: 10, backgroundColor: " #f5f5f5" } }}
      />
      <CopyToClipboardButton copyContent={copyContent} copyTooltip={copyTooltip} />
    </Stack>
  )
}

interface InfoComponentProps {
  title: string
  info: string
}

const InfoComponent: React.FC<InfoComponentProps> = ({ title, info }) => {
  return (
    <Stack direction="row" spacing={3} justifyContent="flex-end">
      <Typography variant="body1">{title}</Typography>
      <Tooltip title={info} disableInteractive placement="right" sx={{ color: "black" }}>
        <InfoIcon sx={{ color: "gray", paddingRight: "7px" }} />
      </Tooltip>
    </Stack>
  )
}

const InvitePopover = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const handleOpenAndClosePopper = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  return (
    <div>
      <ShareButton clickHandler={handleOpenAndClosePopper} />
      <Popover
        open={Boolean(anchorEl)}
        onClose={handleOpenAndClosePopper}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Paper
          elevation={10}
          sx={{
            border: "2px solid #D1D5DB",
            padding: "10px",
            paddingBottom: "20px",
            borderRadius: 2
          }}
        >
          <Typography variant="h6" textAlign="center" fontWeight="lighter" sx={{ paddingBottom: "4px" }}>
            Invite Collaborators
          </Typography>
          <Stack spacing={1}>
            <Divider sx={{ borderBottom: "2px solid #D1D5DB", padding: "2px" }} />
            <InfoComponent
              title="Guest - Link"
              info={
                "Anyone with the link to this board can view it and download its' data as a JSON-file." +
                " They can not modify the board if it has a password."
              }
            />
            <InfoComponent
              title="Editor - Link and Password"
              info={"Anyone with the password of the board can modify it. This includes deleting the board itself."}
            />
            <CopyTextComponent copyContent={window.location.toString()} copyTooltip={"board link"} />
          </Stack>
        </Paper>
      </Popover>
    </div>
  )
}

export default InvitePopover
