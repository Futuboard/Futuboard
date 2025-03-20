import { IconButton, Tooltip } from "@mui/material"
import { Link } from "react-router-dom"

import LogoIcon from "./LogoIcon"

const HomeButton = () => {
  return (
    <Tooltip title="Home">
      <Link to="/">
        <IconButton aria-label="Home">
          <LogoIcon />
        </IconButton>
      </Link>
    </Tooltip>
  )
}

export default HomeButton
