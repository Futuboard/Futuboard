import ColumnCreationForm from "@components/board/ColumnCreationForm"
import { Dialog, DialogContent, IconButton, Tooltip } from "@mui/material"
import Box from "@mui/material/Box"
import { useState } from "react"

import { getId } from "@/services/utils"
import { useAddColumnMutation } from "@/state/apiSlice"
import { ColumnData } from "@/types"

interface CreateColumnButtonProps {
  boardId: string
}
const CreateColumnButton: React.FC<CreateColumnButtonProps> = ({ boardId }) => {
  const [addColumn] = useAddColumnMutation()
  const [open, setOpen] = useState(false)

  const handleOpenDialog = () => {
    setOpen(true)
  }
  const handleCloseDialog = () => {
    setOpen(false)
  }

  const handleSubmit = async (data: ColumnData) => {
    setOpen(false)
    const column = {
      columnid: getId(),
      title: data.columnTitle,
      boardid: boardId,
      swimlane: data.swimlane
    }
    await addColumn({ boardId: boardId, column: column })
  }
  return (
    <Box>
      <Tooltip title="Create Column">
        <IconButton aria-label="add column" onClick={handleOpenDialog}>
          <svg
            style={{ width: "1.5rem", height: "1.5rem", color: "#2D3748" }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <g id="Edit / Add_Column">
                <path
                  id="Vector"
                  d="M5 17H8M8 17H11M8 17V14M8 17V20M14 21H15C16.1046 21 17 20.1046 17 19V5C17 3.89543 16.1046 3 15 3H13C11.8954 3 11 3.89543 11 5V11"
                  stroke="#2D3748"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </g>
            </g>
          </svg>
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogContent>
          <ColumnCreationForm onSubmit={handleSubmit} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default CreateColumnButton
