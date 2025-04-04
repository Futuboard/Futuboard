import InfoIcon from "@mui/icons-material/Info"
import ShareIcon from "@mui/icons-material/Share"
import { Popover, Divider, TextField, Typography, IconButton, Paper, Tooltip, Grid } from "@mui/material"
import { useState, MouseEvent } from "react"

import CopyToClipboardButton from "../board/CopyToClipBoardButton"

interface LinksButtonProps {
  clickHandler: (event: MouseEvent<HTMLElement>) => void
  readOnly: boolean
}

const LinksButton: React.FC<LinksButtonProps> = ({ clickHandler, readOnly }) => {
  return (
    <Tooltip
      title={readOnly ? "This feature is unusable in read only mode" : "Invite Collaborators"}
      disableInteractive
    >
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
    <Grid item container xs={12} alignItems="center">
      <Grid item>
        <TextField
          defaultValue={copyContent}
          fullWidth
          size="small"
          variant="outlined"
          inputProps={{ sx: { width: 200, height: 10, backgroundColor: " #f5f5f5" } }}
          sx={{ padding: "5px" }}
        />
      </Grid>
      <Grid item paddingLeft="10px">
        <CopyToClipboardButton copyContent={copyContent} copyTooltip={copyTooltip} />
      </Grid>
    </Grid>
  )
}

interface InfoComponentProps {
  title: string
  info: string
  readOnly: boolean
  tooltip: string
}

const InfoComponent: React.FC<InfoComponentProps> = ({ title, info, readOnly, tooltip }) => {
  const returnString = readOnly ? window.location.toString() + "/?readOnly=true" : window.location.toString()
  return (
    <div>
      <Divider sx={{ borderBottom: "2px solid #D1D5DB", padding: "2px" }} />
      <Grid item container xs={12} sx={{ padding: "2px" }} alignItems="center" justifyContent="flex-start">
        <Grid item>
          <Typography variant="body1" sx={{ paddingRight: "2px" }}>
            {title}
          </Typography>
        </Grid>
        <Grid item marginLeft="auto">
          <Tooltip title={info} disableInteractive placement="right">
            <InfoIcon sx={{ padding: "10px" }} />
          </Tooltip>
        </Grid>
      </Grid>
      <CopyTextComponent copyContent={returnString} copyTooltip={tooltip} />
    </div>
  )
}

const BoardLinks = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const readOnlyStub = window.location.toString().includes("?readOnly=true")
  const handleOpenAndClosePopper = (event: MouseEvent<HTMLElement>) => {
    if (!readOnlyStub) {
      setAnchorEl(anchorEl ? null : event.currentTarget)
    }
  }

  return (
    <div>
      <LinksButton clickHandler={handleOpenAndClosePopper} readOnly={readOnlyStub} />
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
          <Typography variant="h6" fontWeight="lighter" sx={{ padding: "2px" }}>
            Who would you like to invite?
          </Typography>
          <InfoComponent
            title="A collaborator with read-only access"
            info="A collaborator using this link and the read-only password can only view the board, edit the tasks and notes."
            readOnly={true}
            tooltip="read-only board link"
          />
          <InfoComponent
            title="A collaborator with write access"
            info="A collaborator using this link and the write-access password can do anything except delete the board."
            readOnly={false}
            tooltip="write-access board link"
          />
        </Paper>
      </Popover>
    </div>
  )
}

export default BoardLinks
