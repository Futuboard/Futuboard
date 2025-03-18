import { IconButton, Tooltip } from "@mui/material"
import { Link } from "react-router-dom"

import LogoIcon from "./LogoIcon"

const HomeButton = () => {
  return (
    <Tooltip title="Home">
      <Link to="/">
        <IconButton>
          <LogoIcon />
        </IconButton>
      </Link>
    </Tooltip>
  )
}

export default HomeButton
