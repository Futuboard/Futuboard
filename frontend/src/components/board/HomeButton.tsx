import { IconButton, Tooltip } from "@mui/material"
import { useNavigate } from "react-router-dom"

import LogoIcon from "./LogoIcon"

const HomeButton = () => {
  const navigate = useNavigate()
  return (
    <Tooltip title="Home">
      <IconButton onClick={() => navigate("/")}>
        <LogoIcon />
      </IconButton>
    </Tooltip>
  )
}

export default HomeButton