import { Speed, Water } from "@mui/icons-material"
import { Box, Divider, Typography } from "@mui/material"
import { Link, useLocation } from "react-router-dom"

import CumulativeFlowDiagram from "@/components/charts/CumulativeFlowDiagram"
import VelocityChart from "@/components/charts/VelocityChart"
import { Board } from "@/types"

type ChartsProps = {
  board: Board
}

const Charts: React.FC<ChartsProps> = ({ board }) => {
  const location = useLocation()

  let chartName = location.pathname.split("/").pop()

  const charts = {
    cumulativeFlow: {
      displayName: "Cumulative Flow",
      component: CumulativeFlowDiagram,
      Icon: Water
    },
    velocity: {
      displayName: "Velocity",
      component: VelocityChart,
      Icon: Speed
    }
  }

  if (!charts[chartName as keyof typeof charts]) {
    chartName = "cumulativeFlow"
  }

  const ChartComponent = charts[chartName as keyof typeof charts]?.component

  return (
    <Box sx={{ position: "relative", height: "100%" }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          height: "100%",
          borderRight: "2px solid #d1d5db"
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ marginBottom: 2, paddingTop: 3, widht: "100%", textAlign: "center" }}
          >
            Charts
          </Typography>
          {
            <Divider
              flexItem
              sx={{ borderBottomWidth: 2, marginX: 2, opacity: chartName === "cumulativeFlow" ? 0 : 1 }}
            />
          }
        </Box>
        {Object.entries(charts).map(([name, { displayName, Icon }]) => (
          <Link
            to={name}
            key={name}
            style={{ color: "#213547", backgroundColor: name === chartName ? "#e0e0e2" : "white" }}
          >
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", gap: 0.5, paddingX: 3, paddingY: 2 }}
              key={name}
            >
              <Icon />
              {displayName}
            </Typography>
          </Link>
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%"
        }}
      >
        <ChartComponent boardId={board.boardid} />
      </Box>
    </Box>
  )
}

export default Charts
