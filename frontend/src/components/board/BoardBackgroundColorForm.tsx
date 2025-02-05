import { Button, Grid, Typography, Dialog, DialogContent, GlobalStyles, styled, Divider } from "@mui/material"
import { useEffect, useState } from "react"
import { HexColorPicker, HexColorInput } from "react-colorful"
import { useParams } from "react-router-dom"

import { useUpdateBoardColorMutation } from "@/state/apiSlice"

const StyledHexColorInput = styled(HexColorInput)(({ theme }) => ({
  padding: theme.spacing(1),
  borderStyle: "solid",
  borderWidth: "1px",
  borderRadius: theme.shape.borderRadius,
  fontSize: theme.typography.body1.fontSize,
  fontFamily: theme.typography.body1.fontFamily,
  width: "100px"
}))

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
        <Grid container spacing={2} flexDirection="column" padding={1} width="280px">
          <Grid item xs={12}>
            <Typography gutterBottom variant="h6">
              Change Board Color
            </Typography>
            <Divider />
          </Grid>
          <Grid container spacing={2} display="flex" flexDirection="column" sx={{ marginTop: 1, alignItems: "center" }}>
            <Grid item xs={12}>
              <HexColorPicker color={color} onChange={setColor} />
            </Grid>
            <Grid item xs={12}>
              <StyledHexColorInput name="hexColorInput" color={color} onChange={setColor} prefixed />
            </Grid>
            <Grid item xs={12} sx={{ marginTop: 1 }}>
              <Button variant="contained" color="primary" onClick={handleColorSet}>
                Submit
              </Button>
              <Button sx={{ marginLeft: 2, border: 1 }} onClick={handleOnClose}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  )
}

export default BoardBackgroundColorForm
