import CloseIcon from "@mui/icons-material/Close"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import { IconButton } from "@mui/material"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardActionArea from "@mui/material/CardActionArea"
import CardContent from "@mui/material/CardContent"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { useGetBoardTemplatesQuery } from "@/state/apiSlice"

import { NewBoardFormData, NewBoardType } from "../../types"

import PasswordField from "./PasswordField"

interface AddBoardCreationFormProps {
  onSubmit: (_: NewBoardFormData) => void
  onCancel: () => void
}

type Template = { boardtemplateid?: string; title: string; type: NewBoardType; description: string }

const BoardCreationForm: React.FC<AddBoardCreationFormProps> = ({ onSubmit, onCancel }) => {
  const {
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<NewBoardFormData>({
    defaultValues: {
      title: "",
      password: "",
      boardType: "empty",
      boardTemplateId: undefined,
      file: undefined
    }
  })

  const { data: boardTemplates, isSuccess } = useGetBoardTemplatesQuery()
  const [selectedCard, setSelectedCard] = useState<number>(0)

  const templates: Template[] = [
    {
      type: "empty",
      title: "Empty board",
      description: "An empty board with no columns or cards"
    }
  ]

  if (isSuccess) {
    templates.push(
      ...boardTemplates.map(({ title, description, boardtemplateid }) => ({
        boardtemplateid,
        type: "template" as NewBoardType,
        title,
        description
      }))
    )
  }

  const handleCardSelection = (card: Template, index: number) => {
    setValue("boardType", card.type)
    setValue("boardTemplateId", card.boardtemplateid)
    setSelectedCard(index)
    setValue("file", undefined)
  }

  const handleFileSelect = () => {
    setValue("boardType", "import")
    setSelectedCard(-1)
  }

  const uploadedFileName = watch("file")?.[0]?.name || ""

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={1} textAlign="center">
        <Grid item xs={12}>
          <Typography variant="h5">Create board</Typography>
          <Divider sx={{ marginX: 6, marginY: 2 }} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            sx={{ width: "90%" }}
            label="Name"
            helperText={errors.title?.message}
            error={Boolean(errors.title)}
            {...register("title", {
              minLength: {
                value: 3,
                message: "Board name must be at least 3 characters"
              },
              maxLength: {
                value: 40,
                message: "Board name can be up to 40 characters"
              },
              required: {
                value: true,
                message: "Board name is required"
              }
            })}
          />
        </Grid>
        <Grid item xs={12}>
          <PasswordField register={register("password")} />
        </Grid>
        <Grid item xs={12} sx={{ marginTop: 2 }}>
          <Typography variant="h6" color="text.primary" sx={{ marginY: 1 }}>
            Choose a template
          </Typography>
        </Grid>

        <Grid
          item
          xs={12}
          sx={{ maxHeight: "225px", overflowY: "auto", border: "1px solid rgba(0, 0, 0, 0.12)", borderRadius: 2 }}
        >
          <Grid
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              paddingBottom: 1,
              paddingRight: 1
            }}
          >
            {templates.map((card, index) => (
              <Card key={card.title} sx={{ width: "100%", textAlign: "left" }}>
                <CardActionArea
                  onClick={() => handleCardSelection(card, index)}
                  data-active={selectedCard === index ? "" : undefined}
                  sx={{
                    height: "100%",
                    "&[data-active]": {
                      backgroundColor: "action.selected",
                      "&:hover": {
                        backgroundColor: "action.selectedHover"
                      }
                    }
                  }}
                >
                  <CardContent sx={{ height: "100%" }}>
                    <Typography variant="body1" color="text.primary">
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="center" sx={{ marginY: 1, width: "100%" }}>
          <Typography color="text.primary" fontSize="1.3rem">
            or
          </Typography>
        </Box>

        <Grid item xs={12}>
          <Button
            component="label"
            role={undefined}
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            sx={{ border: 1, paddingX: 4 }}
          >
            Import from CSV
            <input
              type="file"
              {...register("file", { onChange: handleFileSelect })}
              style={{ display: "none" }}
              accept=".csv"
            />
          </Button>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: "8px" }}>
            {uploadedFileName || "No file uploaded"}
            {uploadedFileName && (
              <IconButton onClick={() => setValue("file", undefined)} sx={{ padding: 0.5 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Typography>
        </Grid>

        <Grid item xs={12} sx={{ marginTop: 2 }}>
          <Button type="submit" color="primary" variant="contained">
            Submit
          </Button>
          <Button onClick={onCancel} sx={{ marginLeft: 2, border: 1 }}>
            Cancel
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default BoardCreationForm
