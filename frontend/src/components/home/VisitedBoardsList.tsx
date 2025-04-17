import { Search, Close, ChevronLeft, ChevronRight } from "@mui/icons-material"
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
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  Stack,
  ListItem
} from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getVisitedBoards, removeVisitedBoard } from "@/services/utils"
import { BoardWithOnlyIdAndTitle } from "@/types"

interface DeleteVisitedBoardButtonProps {
  boardid: string
  handleRemoveFromList: (boardid: string) => void
}

const RemoveVisitedBoardButton: React.FC<DeleteVisitedBoardButtonProps> = ({ boardid, handleRemoveFromList }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton
        size="small"
        onClick={() => {
          setOpen(true)
        }}
      >
        <Close fontSize="small" />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box>
          <DialogTitle>Are you sure you want to remove the board from the list?</DialogTitle>
          <DialogActions>
            <Stack direction="row" spacing={4} justifyContent="flex-end">
              <Button variant="contained" color="error" onClick={() => handleRemoveFromList(boardid)}>
                Remove
              </Button>
              <Button variant="outlined" color="primary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}

const VisitedBoardList: React.FC = () => {
  const [visitedBoards, setVisitedBoards] = useState<BoardWithOnlyIdAndTitle[]>([])
  const [visibleBoards, setVisibleBoards] = useState<BoardWithOnlyIdAndTitle[]>([])
  const [boardTitleFilter, setBoardTitleFilter] = useState("")
  const [isVisitedBoardListOpenState, setIsVisitedBoardListOpenState] = useState(false)

  const isScreenWideEnoughForBoardList = useMediaQuery("(min-width:900px)")

  const isVisitedBoardListOpen = isScreenWideEnoughForBoardList
    ? isScreenWideEnoughForBoardList
    : isVisitedBoardListOpenState

  const collator = Intl.Collator(undefined, { numeric: true, sensitivity: "base" })

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

  const handleRemoveFromList = (boardid: string) => {
    removeVisitedBoard(boardid)
    const updatedBoards = getVisitedBoards()
    setVisitedBoards(updatedBoards)
    setVisibleBoards(
      updatedBoards
        .filter((board) => board.title.toUpperCase().includes(boardTitleFilter))
        .sort(boardTitleFilter ? (a, b) => collator.compare(a.title, b.title) : undefined)
    )
  }

  return (
    visitedBoards.length > 0 && (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: 310,
          position: "fixed",
          top: 10,
          left: isVisitedBoardListOpen ? 25 : -320,
          transition: "left 270ms",
          marginRight: 60
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
            maxHeight: 204,
            overflowY: "auto",
            backgroundColor: "#ffffff",
            borderStyle: "solid",
            borderWidth: 1,
            borderRadius: 1,
            borderColor: "#c4c4c4"
          }}
        >
          {visibleBoards.map((board) => (
            <Fragment key={board.boardid}>
              <ListItem
                disablePadding
                secondaryAction={
                  <RemoveVisitedBoardButton boardid={board.boardid} handleRemoveFromList={handleRemoveFromList} />
                }
              >
                <ListItemButton
                  component={Link}
                  to={"/board/" + board.boardid}
                  sx={{
                    "&:hover": { color: "#646cff", backgroundColor: "#f5f5f5" }
                  }}
                  disableRipple
                >
                  <Typography>{board.title}</Typography>
                </ListItemButton>
              </ListItem>
              <Divider sx={{ width: "97%", alignSelf: "center" }} />
            </Fragment>
          ))}
        </List>
        {!isScreenWideEnoughForBoardList && (
          <IconButton
            sx={{
              position: "fixed",
              top: 80,
              left: isVisitedBoardListOpen ? 340 : 7,
              transition: "left 270ms",
              backgroundColor: "#cfcfcf",
              "&:hover": { backgroundColor: "#B0B0B0" }
            }}
            onClick={() => setIsVisitedBoardListOpenState(!isVisitedBoardListOpenState)}
          >
            {isVisitedBoardListOpen ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        )}
      </Box>
    )
  )
}

export default VisitedBoardList
