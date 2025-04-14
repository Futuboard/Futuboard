import { Box, List, ListItemButton, Typography, Divider, InputAdornment, TextField } from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
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
        <Typography variant="h6" color={"black"} marginY={2} sx={{ fontWeight: "bold" }}>
          Recently viewed boards
        </Typography>
        <TextField
          placeholder="Search..."
          type="search"
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
        <List disablePadding sx={{ height: "200px", overflowY: "auto" }}>
          {visibleBoards.map((board) => (
            <Fragment key={board.boardid}>
              <ListItemButton
                component={Link}
                to={"/board/" + board.boardid}
                sx={{ "&:hover": { color: "#646cff" } }}
                disableRipple
              >
                <Typography>{board.title}</Typography>
              </ListItemButton>
              <Divider />
            </Fragment>
          ))}
        </List>
      </Box>
    )
  )
}

export default VisitedBoardList
