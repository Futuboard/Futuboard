import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import { IconButton, Snackbar, Tooltip } from "@mui/material"
import { useState } from "react"

interface CopyToClipboardButtonProps {
  copyContent: string
  copyTooltip: string
  // Used to control snackbar casing for grammar
  lowercase?: boolean
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ copyContent, copyTooltip, lowercase }) => {
  const [open, setOpen] = useState(false)
  const handleClick = () => {
    setOpen(true)
    navigator.clipboard.writeText(copyContent)
  }

  const adjustedTooltip = lowercase ? copyTooltip.toLowerCase() : copyTooltip

  return (
    <>
      <Tooltip title={`Copy ${copyTooltip}`} disableInteractive>
        <IconButton onClick={handleClick}>
          <ContentCopyIcon />
        </IconButton>
      </Tooltip>
      <Snackbar
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={2000}
        message={`Copied ${adjustedTooltip} to clipboard.`}
      />
    </>
  )
}

export default CopyToClipboardButton
