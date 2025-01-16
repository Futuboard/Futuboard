import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import AdminLoginForm from "@/components/admin/AdminLoginForm"
import {
  useAddBoardTemplateMutation,
  useDeleteBoardTemplateMutation,
  useGetBoardTemplatesQuery
} from "@/state/apiSlice"
import { NewBoardTemplate } from "@/types"

type FormValues = { boardUrl: string; title: string; description: string }

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [addBoardTemplate] = useAddBoardTemplateMutation()
  const [deleteBoardTemplate] = useDeleteBoardTemplateMutation()

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
    const uuidv4Regex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
    const boardId = boardUrl.match(uuidv4Regex)?.[0]
    const newBoardTemplate: NewBoardTemplate = {
      title,
      description,
      boardid: boardId || ""
    }
    if (!boardId) {
      setError("boardUrl", {
        message: "Invalid board URL"
      })
      return
    }
    const response = await addBoardTemplate(newBoardTemplate)
    if ("error" in response) {
      setError("boardUrl", {
        message: "Board might not exist"
      })
    }
  }

  const handleBoardTemplateDelete = async (boardTemplateId: string) => {
    await deleteBoardTemplate(boardTemplateId)
  }

  boardTemplates = boardTemplates || []

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="white">
      {isAuthenticated ? (
        <Grid spacing={2} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
          <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
            <DialogContent>
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Grid
                  container
                  spacing={2}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Grid item xs={12}>
                    <Typography gutterBottom variant="h6">
                      New Board Template
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
                      Create
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </DialogContent>
          </Dialog>
          <Grid
            item
            xs={12}
            display="flex"
            justifyContent="center"
            sx={{
              gap: 2,
              marginY: 4
            }}
          >
            <Card sx={{ width: 150, height: 150, textAlign: "center" }}>
              <CardContent>
                <Typography variant="body1" color="text.primary">
                  New board template
                </Typography>
                <Grid container justifyContent="center">
                  <IconButton onClick={() => setIsDialogOpen(true)}>
                    <AddIcon sx={{ fontSize: 50 }} color="primary" />
                  </IconButton>
                </Grid>
              </CardContent>
            </Card>
            {boardTemplates.map((boardTemplate) => (
              <Card key={boardTemplate.title} sx={{ width: 150, height: 150, textAlign: "center" }}>
                <CardContent sx={{ height: "100%" }}>
                  <Typography variant="body1" color="text.primary">
                    {boardTemplate.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {boardTemplate.description}
                  </Typography>

                  <IconButton onClick={() => handleBoardTemplateDelete(boardTemplate.boardtemplateid)}>
                    <DeleteIcon sx={{ fontSize: 40, bottom: 0 }} color="error" />
                  </IconButton>
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
