import GitHubIcon from "@mui/icons-material/GitHub"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import { getId } from "@services/Utils"
import { useNavigate } from "react-router-dom"

import CreateBoardButton from "@components/home/CreateBoardButton"
import ImportBoardButton from "@/components/home/ImportBoardButton"
import ModalFrameCv from "@/components/home/ModalFrameCv"
import { useAddBoardMutation } from "@/state/apiSlice"
import { Board, NewBoardFormData } from "@/types"

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [addBoard] = useAddBoardMutation()

  const handleCreateBoard = async ({ title, password }: NewBoardFormData) => {
    const id = getId()
    const board: Board = {
      id,
      title,
      password,
      users: [],
      columns: []
    }
    //send board object to server
    // TODO: add error handling
    await addBoard(board)
    //redirect to created board page
    navigate(`/board/${id}`)
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" width="100%" bgcolor="white">
      <Grid textAlign="center" container spacing={1}>
        <Grid item xs={12}>
          <img
            src="futuboard-logo.svg"
            style={{ width: "250px", height: "250px", paddingLeft: 30, paddingBottom: 20 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h2" color={"black"} fontWeight="bold">
            Futuboard
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" color={"black"} marginBottom={1}>
            Workstream management tool for individuals and teams.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={1} justifyContent="center">
            <Grid item>
              <CreateBoardButton onNewBoard={handleCreateBoard} />
            </Grid>
            <Grid item>
              <ImportBoardButton />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} marginTop={"20px"}>
          <Grid container spacing={3} justifyContent="center" alignItems="center">
            <Grid item>
              <Typography variant="h6" color={"black"} fontWeight="bold">
                Version 2.0
              </Typography>
            </Grid>
            <Grid item>
              <Link href="https://github.com/Futuboard/Futuboard" underline="hover" display="inline" color="black">
                <GitHubIcon />
              </Link>
            </Grid>
            <Grid item>
              <ModalFrameCv cvFileName="Team_Tenacity_CV.png" />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} marginTop={"20px"}>
          <Grid container spacing={3} justifyContent="center" alignItems="center">
            <Grid item>
              <Typography variant="h6" color={"black"} fontWeight="bold">
                Version 1.0
              </Typography>
            </Grid>
            <Grid item>
              <Link href="https://github.com/Kasipallot/Futuboard" underline="hover" display="inline" color="black">
                <GitHubIcon />
              </Link>
            </Grid>
            <Grid item>
              <ModalFrameCv cvFileName="Team_Kasipallot_CV.png" />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Home
