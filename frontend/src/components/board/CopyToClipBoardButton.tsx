import { IconButton, Snackbar, Tooltip } from "@mui/material"
import { useState } from "react"

const CopyToClipboardButton = () => {
  const [open, setOpen] = useState(false)
  const handleClick = () => {
    setOpen(true)
    navigator.clipboard.writeText(window.location.toString())
  }

  return (
    <>
      <Tooltip title="Copy Board Link">
        <IconButton onClick={handleClick}>
          <svg
            style={{ width: "1.5rem", height: "1.5rem", color: "#2D3748" }}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13.2 9.8a3.4 3.4 0 0 0-4.8 0L5 13.2A3.4 3.4 0 0 0 9.8 18l.3-.3m-.3-4.5a3.4 3.4 0 0 0 4.8 0L18 9.8A3.4 3.4 0 0 0 13.2 5l-1 1"
            />
          </svg>
        </IconButton>
      </Tooltip>
      <Snackbar open={open} onClose={() => setOpen(false)} autoHideDuration={2000} message="Copied to clipboard" />
    </>
  )
}

export default CopyToClipboardButton
