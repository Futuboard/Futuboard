import CreateBoardButton from "@components/home/CreateBoardButton"
import GitHubIcon from "@mui/icons-material/GitHub"
import SettingsIcon from "@mui/icons-material/Settings"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import { useEffect } from "react"

import ModalFrameCv from "@/components/home/ModalFrameCv"
import VisitedBoardsList from "@/components/home/VisitedBoardsList"

const Home: React.FC = () => {
  useEffect(() => {
    document.title = "Futuboard"
  })

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      width="100%"
      bgcolor="white"
      sx={{ overflowY: "auto" }}
    >
      <VisitedBoardsList />

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
              <CreateBoardButton />
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
      <IconButton href="/admin" sx={{ position: "absolute", right: 10, top: 10 }} title="Manage Board Templates">
        <SettingsIcon fontSize="large" />
      </IconButton>
    </Box>
  )
}

export default Home
