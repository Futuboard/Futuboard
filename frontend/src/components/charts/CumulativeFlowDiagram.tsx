import { Grid, Paper, rgbToHex } from "@mui/material"
import dayjs from "dayjs"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import DateSelector from "./DateSelector"
import { useState } from "react"
import { useGetCumulativeFlowDiagramDataQuery } from "@/state/apiSlice"

interface CumulativeFlowDiagramProps {
  boardId: string
}

const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ boardId }) => {
  const [start, setStart] = useState(dayjs().subtract(30, "day").format("YYYY-MM-DD"))
  const [end, setEnd] = useState(dayjs().format("YYYY-MM-DD"))
  const [timeUnit, setTimeUnit] = useState("day")

  const { data: data } = useGetCumulativeFlowDiagramDataQuery({
    boardId: boardId,
    timeUnit: timeUnit,
    start: start,
    end: end
  })

  if (!data) {
    return null
  }

  const tickFormatter = (tick: string) => {
    return dayjs(tick).format("DD.MM.YYYY")
  }

  const gradient: string[] = []
  const length = data.columns.length

  for (var i = 0; i < length; i++) {
    const red = Math.round(255 - i * (255 / length))
    const blue = Math.round(i * (255 / length))
    gradient.push(rgbToHex(`rgb(${red},0,${blue})`))
  }

  return (
    <Paper>
      <Grid container direction="column" justifyContent="center" alignItems="center" sx={{ padding: 1, marginTop: 10 }}>
        <Grid item sx={{ width: 800, height: 800 }}>
          <ResponsiveContainer width="100%" height="95%">
            <AreaChart
              data={data?.data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickFormatter={tickFormatter} />
              <YAxis type="number" domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
              <Tooltip wrapperStyle={{ width: "200px" }} labelFormatter={tickFormatter} />
              {data?.columns.map((name, index) => (
                <Area type="linear" key={name} dataKey={name} stackId="1" fill={gradient[index]} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Grid>
        <Grid item>
          <DateSelector onSubmitStart={setStart} onSubmitEnd={setEnd} onSubmitTimeUnit={setTimeUnit} />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default CumulativeFlowDiagram
