import { Search, Close } from "@mui/icons-material"
import {
  Box,
  List,
  ListItemButton,
  Typography,
  Divider,
  InputAdornment,
  TextField,
  useMediaQuery,
  Fab,
  IconButton
} from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getVisitedBoards } from "@/services/utils"
import { deleteVisitedBoard } from "@/services/utils"
import { BoardWithOnlyIdAndTitle } from "@/types"
import { ChevronLeft, ChevronRight } from "@mui/icons-material"

const VisitedBoardList: React.FC = () => {
  const [isVisitedBoardListOpenState, setIsVisitedBoardListOpenState] = useState(false)
  const [visitedBoards, setVisitedBoards] = useState<BoardWithOnlyIdAndTitle[]>([])
  const [visibleBoards, setVisibleBoards] = useState<BoardWithOnlyIdAndTitle[]>([])
  const [boardTitleFilter, setBoardTitleFilter] = useState("")

  const collator = Intl.Collator(undefined, { numeric: true, sensitivity: "base" })

  const isScreenWideEnoughForBoardList = useMediaQuery("(min-width:900px)")

  const isVisitedBoardListOpen = isScreenWideEnoughForBoardList
    ? isScreenWideEnoughForBoardList
    : isVisitedBoardListOpenState

  useEffect(() => {
    setVisitedBoards(getVisitedBoards())
    setVisibleBoards(getVisitedBoards())
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value.toUpperCase()
    setBoardTitleFilter(inputValue)
    setVisibleBoards(
      visitedBoards
        .filter((board) => board.title.toUpperCase().includes(inputValue))
        .sort(inputValue ? (a, b) => collator.compare(a.title, b.title) : undefined)
    )
  }

  const handleRemoveFromList = (id: string) => {
    deleteVisitedBoard({ boardid: id })
    const updatedBoards = getVisitedBoards()
    setVisitedBoards(updatedBoards)
    setVisibleBoards(updatedBoards.filter((board) => board.title.toUpperCase().includes(boardTitleFilter)))
  }

  return (
    visitedBoards.length > 0 && (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          position: "fixed",
          top: 10,
          left: 25,
          transform: isVisitedBoardListOpen ? "translateX(0)" : "translateX(-320px)",
          transition: "transform 270ms"
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minWidth: "18em",
            maxWidth: "27em",
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
                  <Search />
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
              maxHeight: "234px",
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
                  sx={{
                    justifyContent: "space-between",
                    "&:hover": { color: "#646cff", backgroundColor: "#f5f5f5" }
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
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemButton>
                <Divider sx={{ width: "97%", alignSelf: "center" }} />
              </Fragment>
            ))}
          </List>
        </Box>
        {!isScreenWideEnoughForBoardList && (
          <Fab
            sx={{
              marginTop: "0.25rem",
              marginLeft: "1.5rem"
            }}
            onClick={() => setIsVisitedBoardListOpenState(!isVisitedBoardListOpenState)}
            color="info"
          >
            {isVisitedBoardListOpen ? <ChevronLeft /> : <ChevronRight />}
          </Fab>
        )}
      </Box>
    )
  )
}

export default VisitedBoardList
