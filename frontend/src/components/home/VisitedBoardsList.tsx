import SearchIcon from "@mui/icons-material/Search"
import CloseIcon from "@mui/icons-material/Close"
import { Box, List, ListItemButton, Typography, Divider, InputAdornment, TextField, IconButton } from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getVisitedBoards } from "@/services/utils"
import { deleteVisitedBoard } from "@/services/utils"
import { BoardWithOnlyIdAndTitle } from "@/types"

const VisitedBoardList: React.FC = () => {
  const [visitedBoards, setVisitedBoards] = useState<BoardWithOnlyIdAndTitle[]>([])
  const [visibleBoards, setVisibleBoards] = useState<BoardWithOnlyIdAndTitle[]>([])
  const [filter, setFilter] = useState("")

  useEffect(() => {
    setVisitedBoards(getVisitedBoards())
    setVisibleBoards(getVisitedBoards())
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase()
    setFilter(value)
    setVisibleBoards(visitedBoards.filter((board) => board.title.toUpperCase().includes(value)))
  }

  const handleRemoveFromList = (id: string) => {
    deleteVisitedBoard({ boardid: id })
    const updatedBoards = getVisitedBoards()
    setVisitedBoards(updatedBoards)
    setVisibleBoards(updatedBoards.filter((board) => board.title.toUpperCase().includes(filter)))
  }

  return (
    visitedBoards.length > 0 && (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: "18em",
          maxWidth: "27em"
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
        <List disablePadding sx={{ maxHeight: "235px", overflowY: "auto" }}>
          {visibleBoards.map((board) => (
            <Fragment key={board.boardid}>
              <ListItemButton
                component={Link}
                to={"/board/" + board.boardid}
                sx={{
                  justifyContent: "space-between",
                  "&:hover": { color: "#646cff" }
                }}
                disableRipple
              >
                <Typography>{board.title}</Typography>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.preventDefault()
                    handleRemoveFromList(board.boardid)
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
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
