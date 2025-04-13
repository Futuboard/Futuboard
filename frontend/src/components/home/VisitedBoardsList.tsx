import { Box, Grid, List, ListItemButton, Typography, ListItem, Divider } from "@mui/material"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getVisitedBoards } from "@/services/utils"
import { BoardWithOnlyIdAndTitle } from "@/types"

const VisitedBoardList: React.FC = () => {
  const [visitedBoards, setVisitedBoards] = useState<BoardWithOnlyIdAndTitle[]>([])

  useEffect(() => {
    setVisitedBoards(getVisitedBoards())
  }, [])

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
          borderColor: "black",
          gap: 1
        }}
      >
        <Typography variant="h6" color={"black"} marginTop={2} sx={{ fontWeight: "bold" }}>
          Recently viewed boards:
        </Typography>

        <List sx={{ maxHeight: "200px", overflowY: "auto" }}>
          <Divider />
          {visitedBoards.map((visitedBoard) => (
            <>
              <ListItemButton
                component={Link}
                key={visitedBoard.boardid}
                to={"/board/" + visitedBoard.boardid}
                sx={{ "&:hover": { color: "#646cff" } }}
                disableRipple
              >
                <Typography>{visitedBoard.title}</Typography>
              </ListItemButton>
              <Divider />
            </>
          ))}
        </List>
      </Box>
    )
  )
}

export default VisitedBoardList
