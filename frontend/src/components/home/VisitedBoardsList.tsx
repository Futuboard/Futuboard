import SearchIcon from "@mui/icons-material/Search"
import { Box, List, ListItemButton, Typography, Divider, InputAdornment, TextField, useMediaQuery } from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getVisitedBoards } from "@/services/utils"
import { BoardWithOnlyIdAndTitle } from "@/types"

const VisitedBoardList: React.FC = () => {
  const [visitedBoards, setVisitedBoards] = useState<BoardWithOnlyIdAndTitle[]>([])
  const [visibleBoards, setVisibleBoards] = useState<BoardWithOnlyIdAndTitle[]>([])

  useEffect(() => {
    setVisitedBoards(getVisitedBoards())
    setVisibleBoards(getVisitedBoards())
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVisibleBoards(
      visitedBoards.filter((board) => board.title.toUpperCase().includes(event.target.value.toUpperCase()))
    )
  }

  return (
    visitedBoards.length > 0 && (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: "18em",
          maxWidth: "25em",
          borderStyle: "solid",
          borderWidth: "0px",
          borderColor: "black"
        }}
      >
        <Typography textAlign="center" variant="h6" color={"black"} marginY={2} sx={{ fontWeight: "bold" }}>
          Recently viewed boards
        </Typography>
        <TextField
          placeholder="Search..."
          type="search"
          sx={{ backgroundColor: "#ffffff" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          variant="outlined"
          onChange={handleChange}
          autoComplete="off"
        />
        <List
          disablePadding
          sx={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "204px",
            overflowY: "auto",
            backgroundColor: "#ffffff",
            borderStyle: "solid",
            borderWidth: "1px",
            borderRadius: 1,
            borderColor: "#c4c4c4"
          }}
        >
          {visibleBoards.map((board) => (
            <Fragment key={board.boardid}>
              <ListItemButton
                component={Link}
                to={"/board/" + board.boardid}
                sx={{ "&:hover": { color: "#646cff", backgroundColor: "#f5f5f5" } }}
                disableRipple
              >
                <Typography>{board.title}</Typography>
              </ListItemButton>
              <Divider sx={{ width: "97%", alignSelf: "center" }} />
            </Fragment>
          ))}
        </List>
      </Box>
    )
  )
}

export default VisitedBoardList
