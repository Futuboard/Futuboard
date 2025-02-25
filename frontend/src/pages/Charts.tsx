import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import ToolBar from "@/components/board/Toolbar"
import CumulativeFlowDiagram from "@/components/charts/CumulativeFlowDiagram"
import { useGetBoardQuery, useGetCumulativeFlowDiagramDataQuery } from "@/state/apiSlice"
import { setBoardId } from "@/state/auth"
import dayjs from "dayjs"

const Charts: React.FC = () => {
  const dispatch = useDispatch()
  const params = useParams()
  const [isBoardIdSet, setIsBoardIdset] = useState(false)

  const [start, setStart] = useState(dayjs().subtract(30, "day").format("YYYY-MM-DD"))
  const [end, setEnd] = useState(dayjs().format("YYYY-MM-DD"))

  const id = params.id || ""
  const { data: board } = useGetBoardQuery(id || "", { skip: !id || !isBoardIdSet })

  const { data: cmfData } = useGetCumulativeFlowDiagramDataQuery({
    boardId: id,
    timeUnit: "day",
    start: start,
    end: end
  })

  useEffect(() => {
    dispatch(setBoardId(id))
    setIsBoardIdset(true)
  }, [id])

  useEffect(() => {
    document.title = board?.title ? board?.title + " - Charts" : "Futuboard"
  }, [board])

  useEffect(() => {
    console.log(cmfData)
  }, [cmfData])

  return (
    <div>
      <ToolBar title={`${board?.title} - Charts`} />
      <CumulativeFlowDiagram data={cmfData || {}} changeStart={setStart} changeEnd={setEnd} />
    </div>
  )
}

export default Charts
