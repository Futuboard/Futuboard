import { Button, Grid, TextField, Typography, Dialog, DialogContent } from "@mui/material"
import { useRef, useEffect, useState } from "react"
import { HexColorPicker, HexColorInput } from "react-colorful"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useUpdateBoardColorMutation } from "@/state/apiSlice"
import { BoardTitleChangeFormData } from "@/types"

interface BoardSettingsProps {
  /* boardColor: string */
  onClose: () => void
  open: boolean
}

const BoardSettings = ({ onClose, open }: BoardSettingsProps) => {
  const [color, setColor] = useState("#FFFFFF")
  /* const { id = "default-id" } = useParams()
  const [updateBoardName] = useUpdateBoardColorMutation() */

  /* const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BoardTitleChangeFormData>({
    defaultValues: {
      color: color
    }
  })

  const inputRef = useRef<HTMLInputElement>(null) */

  /* useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, []) */

  /* const onSubmit = async (data: BoardTitleChangeFormData) => {
    try {
      await updateBoardName({ boardId: id, newTitle: data.title }).unwrap()
      onClose()
    } catch (error) {
      console.error("Failed to change board name:", error)
    }
  } */

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <HexColorPicker color={color} onChange={setColor} />
        <HexColorInput color={color} onChange={setColor} prefixed />
      </DialogContent>
    </Dialog>
  )
}

export default BoardSettings
