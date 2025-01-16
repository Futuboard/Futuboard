import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardActionArea from "@mui/material/CardActionArea"
import CardContent from "@mui/material/CardContent"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import AdminLoginForm from "@/components/admin/AdminLoginForm"
import { useAddBoardTemplateMutation, useGetBoardTemplatesQuery } from "@/state/apiSlice"
import { NewBoardTemplate } from "@/types"

type FormValues = { boardUrl: string; title: string; description: string }

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [addBoardTemplate] = useAddBoardTemplateMutation()

  let { data: boardTemplates } = useGetBoardTemplatesQuery()

  useEffect(() => {
    document.title = "Futuboard - Admin Panel"
  }, [])

  const {
    setError,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      boardUrl: "",
      title: "",
      description: ""
    }
  })

  const handleFormSubmit = async ({ boardUrl, title, description }: FormValues) => {
    const boardId = boardUrl.split("/").pop()
    const newBoardTemplate: NewBoardTemplate = {
      title,
      description,
      boardid: boardId || ""
    }
    await addBoardTemplate(newBoardTemplate)
  }

  boardTemplates = boardTemplates || []

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" width="100%" bgcolor="white">
      {isAuthenticated ? (
        <Grid>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography gutterBottom variant="h6">
                  New Template Board
                </Typography>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Board URL"
                  error={Boolean(errors.boardUrl)}
                  helperText={errors.boardUrl?.message}
                  {...register("boardUrl")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message}
                  {...register("title")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  error={Boolean(errors.description)}
                  helperText={errors.description?.message}
                  {...register("description")}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" color="primary" variant="contained">
                  Submit
                </Button>
              </Grid>
            </Grid>
          </form>

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
            {boardTemplates.map((boardTemplate) => (
              <Card key={boardTemplate.title}>
                <CardContent sx={{ height: "100%" }}>
                  <Typography variant="body1" color="text.primary">
                    {boardTemplate.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {boardTemplate.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Grid>
      ) : (
        <AdminLoginForm setIsAuthenticated={setIsAuthenticated} />
      )}
    </Box>
  )
}

export default Admin
