import { Box, CircularProgress } from "@mui/material"
import React, { useState } from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Legend, Bar, LabelList } from "recharts"

import { useGetVelocityChartDataQuery } from "@/state/apiSlice"

import ChartContainer from "./ChartContainer"
import ChartToolTip from "./ChartToolTip"

interface VelocityChartProps {
  boardId: string
}

const VelocityChart: React.FC<VelocityChartProps> = ({ boardId }) => {
  const { data: data, isLoading: isLoading } = useGetVelocityChartDataQuery({ boardId: boardId })
  const [highLightedBar, setHighlightedBar] = useState("")

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

  const xAxisLabelFormatter = (scopeName: string) => {
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
          tickFormatter={xAxisLabelFormatter}
        />
        <YAxis />
        <Tooltip
          content={({ active, payload, label }) => (
            <ChartToolTip
              active={active || false}
              payload={payload as Array<{ [key: string]: string }>}
              label={label}
              labelFormatter={(label) => label}
              highlightedItem={highLightedBar}
            />
          )}
        />
        <Legend
          wrapperStyle={{
            paddingTop: "1rem"
          }}
        />
        <Bar
          dataKey="forecast"
          fill="#03a9f4"
          onMouseEnter={() => setHighlightedBar("forecast")}
          onMouseLeave={() => setHighlightedBar("")}
        >
          <LabelList dataKey="forecast" position="top" style={{ fontSize: "1.5rem", fill: "#213547" }} />
        </Bar>
        <Bar
          dataKey="done"
          fill="#89c344"
          onMouseEnter={() => setHighlightedBar("done")}
          onMouseLeave={() => setHighlightedBar("")}
        >
          <LabelList dataKey="done" position="top" style={{ fontSize: "1.5rem", fill: "#213547" }} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export default VelocityChart
