import { Button, Grid, Typography, Dialog, DialogContent, GlobalStyles } from "@mui/material"
import { useEffect, useState } from "react"
import { HexColorPicker, HexColorInput } from "react-colorful"
import { useParams } from "react-router-dom"

import { useUpdateBoardColorMutation } from "@/state/apiSlice"

interface BoardBackgroundColorFormProps {
  boardColor: string
  onClose: () => void
  open: boolean
}

const BoardBackgroundColorForm = ({ boardColor, onClose, open }: BoardBackgroundColorFormProps) => {
  const { id = "default-id" } = useParams()
  const [color, setColor] = useState(boardColor)
  const [updateBoardColor] = useUpdateBoardColorMutation()

  useEffect(() => {
    if (open) {
      setColor(boardColor)
    }
  }, [open, boardColor])

  const handleColorSet = () => {
    updateBoardColor({ boardId: id, newColor: color })
    onClose()
  }

  const handleOnClose = () => {
    setColor(boardColor)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleOnClose} hideBackdrop>
      <DialogContent>
        <GlobalStyles styles={{ ":root": { backgroundColor: color || "white" } }} />
        <Grid container spacing={1} flexDirection="column" padding={1}>
          <Grid item>
            <Typography gutterBottom variant="h6">
              Change Board Color
            </Typography>
          </Grid>
          <Grid item>
            <HexColorPicker color={color} onChange={setColor} />
          </Grid>
          <Grid item>
            <HexColorInput color={color} onChange={setColor} prefixed />
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" onClick={handleColorSet}>
              Submit
            </Button>
            <Button sx={{ marginLeft: 2 }} onClick={handleOnClose}>
              Cancel
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  )
}

export default BoardBackgroundColorForm
