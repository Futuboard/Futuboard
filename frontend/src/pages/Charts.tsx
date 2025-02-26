import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import ToolBar from "@/components/board/Toolbar"
import CumulativeFlowDiagram from "@/components/charts/CumulativeFlowDiagram"
import { useGetBoardQuery, useGetCumulativeFlowDiagramDataQuery } from "@/state/apiSlice"
import { setBoardId } from "@/state/auth"
import dayjs from "dayjs"
import { Grid, Skeleton } from "@mui/material"

const Charts: React.FC = () => {
  const dispatch = useDispatch()
  const params = useParams()
  const [isBoardIdSet, setIsBoardIdset] = useState(false)

  const [start, setStart] = useState(dayjs().subtract(30, "day").format("YYYY-MM-DD"))
  const [end, setEnd] = useState(dayjs().format("YYYY-MM-DD"))
  const [timeUnit, setTimeUnit] = useState("day")

  const id = params.id || ""
  const { data: board } = useGetBoardQuery(id || "", { skip: !id || !isBoardIdSet })

  const { data: cmfData } = useGetCumulativeFlowDiagramDataQuery({
    boardId: id,
    timeUnit: timeUnit,
    start: start,
    end: end
  })

  useEffect(() => {
    dispatch(setBoardId(id))
    setIsBoardIdset(true)
  }, [id])

  useEffect(() => {
    document.title = board?.title ? "Charts - " + board?.title : "Futuboard"
  }, [board])

  useEffect(() => {
    console.log(cmfData)
  }, [cmfData])

  return (
    <div>
      <ToolBar title={`Charts - ${board?.title}`} />
      <Grid container justifyContent="center" alignItems="center">
        <CumulativeFlowDiagram
          data={cmfData || {}}
          changeStart={setStart}
          changeEnd={setEnd}
          changeTimeUnit={setTimeUnit}
        />
      </Grid>
    </div>
  )
}

export default Charts
