import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import ToolBar from "@/components/board/Toolbar"
import CumulativeFlowDiagram from "@/components/charts/CumulativeFlowDiagram"
import { useGetBoardQuery } from "@/state/apiSlice"
import { setBoardId } from "@/state/auth"
import { Box } from "@mui/material"

const Charts: React.FC = () => {
  const dispatch = useDispatch()
  const params = useParams()
  const [isBoardIdSet, setIsBoardIdset] = useState(false)

  const id = params.id || ""
  const { data: board } = useGetBoardQuery(id || "", { skip: !id || !isBoardIdSet })

  useEffect(() => {
    dispatch(setBoardId(id))
    setIsBoardIdset(true)
  }, [id])

  useEffect(() => {
    document.title = board?.title ? "Charts - " + board?.title : "Futuboard"
  }, [board])

  return (
    <div>
      <ToolBar boardId={id} title={`Charts - ${board?.title}`} chartToolbar={true} />
      <Box display="flex" justifyContent="center" alignItems="center">
        <CumulativeFlowDiagram boardId={id} />
      </Box>
    </div>
  )
}

export default Charts
