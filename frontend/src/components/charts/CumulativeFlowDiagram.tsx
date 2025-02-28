import { Grid, Paper, rgbToHex, Typography } from "@mui/material"
import dayjs from "dayjs"
import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { useGetCumulativeFlowDiagramDataQuery } from "@/state/apiSlice"

import DateSelector from "./DateSelector"

interface CumulativeFlowDiagramProps {
  boardId: string
}

const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ boardId }) => {
  const [start, setStart] = useState(dayjs().subtract(30, "day"))
  const [end, setEnd] = useState(dayjs())
  const [timeUnit, setTimeUnit] = useState("day")

  const { data: data } = useGetCumulativeFlowDiagramDataQuery({
    boardId: boardId,
    timeUnit: timeUnit,
    start: start.format("YYYY-MM-DD"),
    end: end.format("YYYY-MM-DD")
  })

  if (!data) {
    return null
  }

  const tickFormatter = (tick: string) => {
    if (timeUnit == "month") {
      return dayjs(tick).format("MM.YYYY")
    } else if (timeUnit == "year") {
      return dayjs(tick).format("YYYY")
    } else return dayjs(tick).format("DD.MM.YYYY")
  }

  const gradient: string[] = []
  const length = data.columns.length

  for (let i = 0; i < length; i++) {
    const red = Math.round(255 - i * (255 / length))
    const blue = Math.round(i * (255 / length))
    gradient.push(rgbToHex(`rgb(${red},0,${blue})`))
  }

  return (
    <Paper>
      <Grid container direction="column" justifyContent="center" alignItems="center" sx={{ padding: 2 }} spacing={1}>
        <Grid item>
          <Typography variant="h6">Cumulative Flow Diagram</Typography>
        </Grid>
        <Grid item sx={{ width: "30vw", height: "30vw" }}>
          <ResponsiveContainer width="100%" height="95%">
            <AreaChart
              data={data?.data}
              margin={{
                right: 40
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickFormatter={tickFormatter} />
              <YAxis type="number" domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
              <Tooltip labelFormatter={tickFormatter} itemStyle={{ color: "black" }} />
              {data?.columns.map((name, index) => (
                <Area
                  type="linear"
                  key={name}
                  dataKey={name}
                  stackId="1"
                  stroke={gradient[index + 2] || "#040042"}
                  fill={gradient[index]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Grid>
        <Grid item>
          <DateSelector
            startValue={start}
            endValue={end}
            timeUnitValue={timeUnit}
            onSubmitStart={setStart}
            onSubmitEnd={setEnd}
            onSubmitTimeUnit={setTimeUnit}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default CumulativeFlowDiagram
