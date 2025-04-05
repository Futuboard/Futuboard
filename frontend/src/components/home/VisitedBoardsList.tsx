import { getVisitedBoards } from "@/services/utils"
import { BoardWithOnlyIdAndTitle } from "@/types"
import { Box, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const VisitedBoardList: React.FC = () => {
  const [visitedBoards, setVisitedBoards] = useState<BoardWithOnlyIdAndTitle[]>([])

  useEffect(() => {
    setVisitedBoards(getVisitedBoards())
  }, [])

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "10em",
        width: "20em",
        borderStyle: "solid",
        borderWidth: "2px",
        borderColor: "black"
      }}
    >
      {visitedBoards.map((visitedBoard) => (
        <Link key={visitedBoard.boardid} to={"/board/" + visitedBoard.boardid}>
          <Typography>{visitedBoard.title}</Typography>
        </Link>
      ))}
    </Box>
  )
}

export default VisitedBoardList
