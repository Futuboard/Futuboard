import { CircularProgress, Grid, Paper, Typography } from "@mui/material"
import React from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Legend, Bar } from "recharts"

import { useGetVelocityChartDataQuery } from "@/state/apiSlice"

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
    <Paper>
      <Grid container direction="column" justifyContent="center" alignItems="center" sx={{ padding: 2 }} spacing={1}>
        <Grid item>
          <Typography variant="h6">Velocity</Typography>
        </Grid>
        <Grid item sx={{ width: "1100px", height: "650px" }}>
          <ResponsiveContainer width="105%" height="100%">
            <BarChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="forecast" fill="#03a9f4" />
              <Bar dataKey="done" fill="#89c344" />
            </BarChart>
          </ResponsiveContainer>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default VelocityChart
