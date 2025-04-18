import InfoIcon from "@mui/icons-material/Info"
import ShareIcon from "@mui/icons-material/Share"
import { Popover, Divider, TextField, Typography, IconButton, Paper, Tooltip, Stack } from "@mui/material"
import { useState, MouseEvent } from "react"

import CopyToClipboardButton from "./CopyToClipBoardButton"

interface ButtonProps {
  clickHandler: (event: MouseEvent<HTMLElement>) => void
}

const Button: React.FC<ButtonProps> = ({ clickHandler }) => {
  return (
    <Tooltip title={"Invite Collaborators"} disableInteractive>
      <IconButton onClick={clickHandler}>
        <ShareIcon sx={{ color: "#2d3748", zoom: "0.9" }} />
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
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
      <TextField
        defaultValue={copyContent}
        fullWidth
        size="small"
        variant="outlined"
        inputProps={{ sx: { width: 200, height: 10, backgroundColor: " #f5f5f5" } }}
      />
      <CopyToClipboardButton copyContent={copyContent} copyTooltip={copyTooltip} lowercase={true} />
    </Stack>
  )
}

const ShareButton = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const handleOpenAndClosePopover = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const infoString: string =
    "Anyone with the link can view and export the board. " +
    "If they know the password, or if the board has no password, they can fully edit and delete it."
  return (
    <div>
      <Button clickHandler={handleOpenAndClosePopover} />
      <Popover
        open={Boolean(anchorEl)}
        onClose={handleOpenAndClosePopover}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Paper
          elevation={10}
          sx={{
            border: "2px solid #D1D5DB",
            padding: "10px",
            paddingBottom: "16px",
            borderRadius: 2,
            maxWidth: 350
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-start">
            <Typography variant="h6" fontWeight="lighter">
              Invite Collaborators
            </Typography>
            <Tooltip
              disableInteractive
              title={<Typography variant="body2">{infoString}</Typography>}
              slotProps={{
                tooltip: {
                  sx: {
                    color: "rgb(80, 78, 78)",
                    backgroundColor: " #FFFF",
                    border: "2px solid #D1D5DB"
                  }
                }
              }}
            >
              <InfoIcon sx={{ color: "gray" }} />
            </Tooltip>
          </Stack>
          <Stack spacing={1}>
            <Divider sx={{ borderBottom: "2px solid #D1D5DB", padding: "2px" }} />
            <CopyTextComponent copyContent={window.location.toString()} copyTooltip={"Board Link"} />
          </Stack>
        </Paper>
      </Popover>
    </div>
  )
}

export default ShareButton
