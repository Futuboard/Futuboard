import { Search, Close } from "@mui/icons-material"
import { Menu } from "@mui/icons-material"
import {
  Box,
  List,
  ListItemButton,
  Typography,
  Divider,
  InputAdornment,
  TextField,
  useMediaQuery,
  IconButton,
  Button
} from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getVisitedBoards } from "@/services/utils"
import { deleteVisitedBoard } from "@/services/utils"
import { BoardWithOnlyIdAndTitle } from "@/types"

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
          alignItems: "center",
          position: "fixed",
          maxWidth: "100vw",
          top: 10,
          left: 25,
          transform: isVisitedBoardListOpen ? "translateX(0)" : "translateX(-333px)",
          transition: "transform 270ms"
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minWidth: "16em",
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
          <Button
            variant="contained"
            sx={{
              marginLeft: "0px",
              transform: "rotate(90deg)",
              backgroundColor: "#cfcfcf",
              boxShadow: 0,
              "&:hover": { backgroundColor: "#757575", boxShadow: 0 }
            }}
            onClick={() => setIsVisitedBoardListOpenState(!isVisitedBoardListOpenState)}
          >
            <Menu />
          </Button>
        )}
      </Box>
    )
  )
}

export default VisitedBoardList
