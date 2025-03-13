import { CircularProgress, Paper } from "@mui/material"
import React from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Legend, Bar } from "recharts"

import { useGetVelocityChartDataQuery } from "@/state/apiSlice"

import ChartContainer from "./ChartContainer"

interface VelocityChartProps {
  boardId: string
}

const VelocityChart: React.FC<VelocityChartProps> = ({ boardId }) => {
  const { data: data, isLoading: isLoading } = useGetVelocityChartDataQuery({ boardId: boardId })

  if (isLoading) {
    return (
      <Paper sx={{ textAlign: "center", typography: "h5", padding: 10 }}>
        <CircularProgress />
      </Paper>
    )
  }

  if (!data?.data) {
    return <Paper sx={{ textAlign: "center", typography: "h5", padding: 10 }}>No data</Paper>
  }

  return (
    <ChartContainer>
      <BarChart data={data.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="forecast" fill="#03a9f4" />
        <Bar dataKey="done" fill="#89c344" />
      </BarChart>
    </ChartContainer>
  )
}

export default VelocityChart
