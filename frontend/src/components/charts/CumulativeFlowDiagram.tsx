import { Box } from "@mui/material"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface CumulativeFlowDiagramProps {
  data: {
    name: string
    uv: number
    pv: number
    amt: number
  }[]
}

const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ data }) => {
  return (
    <Box sx={{ paddingTop: 10 }}>
      <AreaChart
        width={500}
        height={400}
        data={data}
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
        <Tooltip />
        <Area type="linear" dataKey="uv" stackId="1" stroke="#8884d8" fill="#8884d8" />
        <Area type="linear" dataKey="pv" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
        <Area type="linear" dataKey="amt" stackId="1" stroke="#ffc658" fill="#ffc658" />
      </AreaChart>
    </Box>
  )
}

export default CumulativeFlowDiagram
