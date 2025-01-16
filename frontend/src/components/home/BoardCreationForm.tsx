import CloudUploadIcon from "@mui/icons-material/CloudUpload"
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

type Card = { boardtemplateid?: string; title: string; type: NewBoardType; description: string }

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

  const cards: Card[] = [
    {
      type: "empty",
      title: "Empty board",
      description: "An empty board with no columns or cards"
    },
    {
      type: "import",
      title: "Imported board ",
      description: "A board from CSV file on your computer"
    }
  ]

  if (isSuccess) {
    cards.push(
      ...boardTemplates.map(({ title, description, boardtemplateid }) => ({
        boardtemplateid,
        type: "template" as NewBoardType,
        title,
        description
      }))
    )
  }

  const handleCardSelection = (card: Card, index: number) => {
    setValue("boardType", card.type)
    setValue("boardTemplateId", card.boardtemplateid)
    setSelectedCard(index)
  }

  const uploadedFileName = watch("file")?.[0]?.name || ""
  const currentCardBoardType = watch("boardType")

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
          <Typography variant="h6" color="text.primary">
            Template
          </Typography>
          <Divider sx={{ marginX: 6, marginY: 1 }} />
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(150px, 100%), 1fr))",
            gap: 2,
            marginBottom: 2
          }}
        >
          {cards.map((card, index) => (
            <Card key={card.title}>
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
        {currentCardBoardType === "import" && (
          <Grid item xs={12}>
            <Button
              component="label"
              role={undefined}
              variant="contained"
              tabIndex={-1}
              startIcon={<CloudUploadIcon />}
              sx={{ width: "84%" }}
            >
              Upload file
              <input
                type="file"
                {...register("file", { required: currentCardBoardType === "import" })}
                style={{ display: "none" }}
                accept=".csv"
              />
            </Button>
            <Typography variant="body2" color="textSecondary" style={{ marginTop: "8px" }}>
              Uploaded file: {uploadedFileName || "No file uploaded"}
            </Typography>
          </Grid>
        )}
        <Grid item xs={12} sx={{ marginTop: 2 }}>
          <Button type="submit" color="primary" variant="contained">
            Submit
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default BoardCreationForm
