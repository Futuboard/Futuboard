import { ChartData } from "@/types"
import { Button, Paper } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers"
import dayjs from "dayjs"
import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface CumulativeFlowDiagramProps {
  data: ChartData
  changeStart: (startDate: string) => void
  changeEnd: (endDate: string) => void
}

const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ data, changeStart, changeEnd }) => {
  if (Object.values(data).length == 0) {
    return null
  }

  const [startDate, setStartDate] = useState(dayjs().subtract(30, "day"))
  const [endDate, setEndDate] = useState(dayjs())

  const dataAsArray = Object.entries(data).map(([key, value]) => ({ name: dayjs(key).format("DD.MM.YYYY"), ...value }))

  const columnNames = Object.keys(Object.values(data)[0])

  const onSubmit = () => {
    changeStart(startDate.format("YYYY-MM-DD"))
    changeEnd(endDate.format("YYYY-MM-DD"))
  }

  return (
    <Paper sx={{ paddingTop: 10, width: 500 }}>
      <AreaChart
        width={500}
        height={400}
        data={dataAsArray}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0
        }}
      >
        <defs></defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        {columnNames.map((name) => {
          return (
            <Area
              type="linear"
              dataKey={name}
              stackId="1"
              fill={"#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0")}
            />
          )
        })}
      </AreaChart>
      <DatePicker defaultValue={startDate} onChange={(date) => setStartDate(date || startDate)} />
      <DatePicker defaultValue={endDate} onChange={(date) => setEndDate(date || endDate)} />
      <Button onClick={onSubmit}>Get</Button>
    </Paper>
  )
}

export default CumulativeFlowDiagram
