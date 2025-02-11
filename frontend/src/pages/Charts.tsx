import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import ToolBar from "@/components/board/Toolbar"
import CumulativeFlowDiagram from "@/components/charts/CumulativeFlowDiagram"
import { useGetBoardQuery } from "@/state/apiSlice"
import { setBoardId } from "@/state/auth"

const data = [
  {
    name: "Page A",
    uv: 4000,
    pv: 2400,
    amt: 2400
  },
  {
    name: "Page B",
    uv: 3000,
    pv: 1398,
    amt: 2210
  },
  {
    name: "Page C",
    uv: 2000,
    pv: 9800,
    amt: 2290
  },
  {
    name: "Page D",
    uv: 2780,
    pv: 3908,
    amt: 2000
  },
  {
    name: "Page E",
    uv: 1890,
    pv: 4800,
    amt: 2181
  },
  {
    name: "Page F",
    uv: 2390,
    pv: 3800,
    amt: 2500
  },
  {
    name: "Page G",
    uv: 3490,
    pv: 4300,
    amt: 2100
  }
]

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
    document.title = board?.title ? board?.title + " - Charts" : "Futuboard"
  }, [board])

  return (
    <div>
      <ToolBar title={`${board?.title} - Charts`} />
      <CumulativeFlowDiagram data={data} />
    </div>
  )
}

export default Charts
