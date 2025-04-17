import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import { IconButton, Snackbar, Tooltip } from "@mui/material"
import { useState } from "react"

interface CopyToClipboardButtonProps {
  copyContent: string
  copyTooltip: string
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ copyContent, copyTooltip }) => {
  const [open, setOpen] = useState(false)
  const handleClick = () => {
    setOpen(true)
    navigator.clipboard.writeText(copyContent)
  }

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
        message={`Copied ${copyTooltip} to clipboard`}
      />
    </>
  )
}

export default CopyToClipboardButton
