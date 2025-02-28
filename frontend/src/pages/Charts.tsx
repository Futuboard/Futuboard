import { Box, GlobalStyles } from "@mui/material"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import ToolBar from "@/components/board/Toolbar"
import CumulativeFlowDiagram from "@/components/charts/CumulativeFlowDiagram"
import { useGetBoardQuery } from "@/state/apiSlice"
import { setBoardId } from "@/state/auth"

const Charts: React.FC = () => {
  const dispatch = useDispatch()
  const params = useParams()
  const [isBoardIdSet, setIsBoardIdset] = useState(false)

  const id = params.id || ""
  const { data: board } = useGetBoardQuery(id || "", { skip: !id || !isBoardIdSet })

  useEffect(() => {
    dispatch(setBoardId(id))
    setIsBoardIdset(true)
  }, [id, dispatch])

  useEffect(() => {
    document.title = board?.title ? "Charts - " + board?.title : "Futuboard"
  }, [board])

  if (!board) return null

  return (
    <div>
      <GlobalStyles styles={{ ":root": { backgroundColor: board.background_color || "white" } }} />
      <ToolBar boardId={id} title={`Charts - ${board?.title}`} chartToolbar={true} />
      <Box
        sx={{
          marginTop: 10,
          justifyContent: "center",
          alignItems: "center",
          display: "flex"
        }}
      >
        <CumulativeFlowDiagram boardId={id} />
      </Box>
    </div>
  )
}

export default Charts
