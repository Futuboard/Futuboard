import CreateBoardButton from "@components/home/CreateBoardButton"
import GitHubIcon from "@mui/icons-material/GitHub"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import { getId } from "@services/Utils"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

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

  useEffect(() => {
    document.title = "Futuboard"
  })

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" width="100%" bgcolor="white">
      <Grid textAlign="center" container spacing={1}>
        <Grid item xs={12}>
          <svg
            style={{ width: 250, height: 250, color: "#2D3748", margin: 1 }}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
            preserveAspectRatio="xMidYMid meet"
            fill="#000000"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M32 2C15.432 2 2 15.432 2 32s13.432 30 30 30s30-13.432 30-30S48.568 2 32 2m13.102 32.953c-5.594 4.627-14.084 3.592-18.965-2.309c-4.881-5.902-4.303-14.436 1.291-19.063c5.594-4.625 14.084-3.592 18.965 2.311s4.302 14.436-1.291 19.061"
                fill="#000000"
              ></path>
              <path
                d="M40.209 20.738c.742-1.457.732-3.074-.236-4.631c-1.68-2.701-5.055-3.225-8.17-1.285c-3.143 1.953-4.164 5.209-2.484 7.912c.967 1.555 2.414 2.279 4.072 2.244c-1.109 1.818-1.152 3.803-.021 5.621c1.785 2.869 5.314 3.494 8.994 1.207c3.68-2.289 4.68-5.73 2.895-8.602c-1.132-1.815-2.929-2.655-5.05-2.466m-8.162.532c-.893-1.436-.463-3.195 1.152-4.199c1.594-.99 3.398-.588 4.275.822c.879 1.412.457 3.234-1.135 4.225c-1.614 1.005-3.398.587-4.292-.848m8.814 8.121c-1.771 1.102-3.75.674-4.717-.883c-.938-1.506-.402-3.398 1.369-4.5c1.773-1.102 3.719-.721 4.641.762c.953 1.531.479 3.517-1.293 4.621"
                fill="#000000"
              ></path>
            </g>
          </svg>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h2" color={"black"} fontWeight="bold">
            FutuBoard
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
