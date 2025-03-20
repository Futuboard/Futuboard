import { Box, CircularProgress } from "@mui/material"
import React from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Legend, Bar, LabelList } from "recharts"

import { useGetVelocityChartDataQuery } from "@/state/apiSlice"

import ChartContainer from "./ChartContainer"

interface VelocityChartProps {
  boardId: string
}

const VelocityChart: React.FC<VelocityChartProps> = ({ boardId }) => {
  const { data: data, isLoading: isLoading } = useGetVelocityChartDataQuery({ boardId: boardId })

  if (isLoading) {
    return (
      <Box sx={{ typography: "h5", paddingX: 10, paddingY: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data?.data || data?.data.length == 0) {
    return <Box sx={{ typography: "h5", padding: 10 }}>No data</Box>
  }

  const xAxisLableFormatter = (scopeName: string) => {
    const maxLength = 15
    if (scopeName.length > maxLength) {
      return `${scopeName.substring(0, maxLength)}...`
    }
    return scopeName
  }

  return (
    <ChartContainer>
      <BarChart data={data.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          style={{ fontSize: "1.5rem", fill: "#213547" }}
          interval={0}
          tickFormatter={xAxisLableFormatter}
        />
        <YAxis />
        <Tooltip />
        <Legend
          wrapperStyle={{
            paddingTop: "1rem"
          }}
        />
        <Bar dataKey="forecast" fill="#03a9f4">
          <LabelList dataKey="forecast" position="top" style={{ fontSize: "1.5rem", fill: "#213547" }} />
        </Bar>
        <Bar dataKey="done" fill="#89c344">
          <LabelList dataKey="done" position="top" style={{ fontSize: "1.5rem", fill: "#213547" }} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export default VelocityChart
