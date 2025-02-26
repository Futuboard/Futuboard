import { ChartData } from "@/types"
import { Grid, Paper } from "@mui/material"
import dayjs from "dayjs"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import DateSelector from "./DateSelector"

interface CumulativeFlowDiagramProps {
  data: ChartData
  changeStart: (startDate: string) => void
  changeEnd: (endDate: string) => void
  changeTimeUnit: (timeUnit: string) => void
}

const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({
  data,
  changeStart,
  changeEnd,
  changeTimeUnit
}) => {
  const dataAsArray = Object.entries(data).map(([key, value]) => ({ name: dayjs(key).format("DD.MM.YYYY"), ...value }))

  const columnNames = Object.keys(Object.values(data)[0])

  return (
    <Paper>
      <Grid container direction="column" justifyContent="center" alignItems="center" sx={{ padding: 1, marginTop: 10 }}>
        <Grid item sx={{ width: 800, height: 800 }}>
          <ResponsiveContainer width="100%" height="95%">
            <AreaChart
              data={dataAsArray}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip wrapperStyle={{ width: "200px" }} />
              {columnNames.map((name) => (
                <Area
                  type="linear"
                  key={name}
                  dataKey={name}
                  stackId="1"
                  fill={"#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0")}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Grid>
        <Grid item>
          <DateSelector onSubmitStart={changeStart} onSubmitEnd={changeEnd} onSubmitTimeUnit={changeTimeUnit} />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default CumulativeFlowDiagram
