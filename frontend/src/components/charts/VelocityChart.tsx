import { CircularProgress, Paper } from "@mui/material"
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
      <Paper sx={{ textAlign: "center", typography: "h5", padding: 10 }}>
        <CircularProgress />
      </Paper>
    )
  }

  if (!data?.data) {
    return <Paper sx={{ textAlign: "center", typography: "h5", padding: 10 }}>No data</Paper>
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
        <XAxis dataKey="name" style={{ fontSize: "1.5rem" }} interval={0} tickFormatter={xAxisLableFormatter} />
        <YAxis />
        <Tooltip />
        <Legend
          wrapperStyle={{
            paddingTop: "1rem"
          }}
        />
        <Bar dataKey="forecast" fill="#03a9f4">
          <LabelList dataKey="forecast" position="top" style={{ fontSize: "1.5rem" }} />
        </Bar>
        <Bar dataKey="done" fill="#89c344">
          <LabelList dataKey="done" position="top" style={{ fontSize: "1.5rem" }} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export default VelocityChart
