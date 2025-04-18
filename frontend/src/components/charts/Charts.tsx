import { LocalFireDepartmentOutlined, SpeedOutlined, WaterOutlined } from "@mui/icons-material"
import { Box, Divider, Stack, Paper, Typography } from "@mui/material"
import { Link, useLocation } from "react-router-dom"

import CumulativeFlowDiagram from "@/components/charts/CumulativeFlowDiagram"
import VelocityChart from "@/components/charts/VelocityChart"
import { Board } from "@/types"

import BurnUpChart from "./BurnUpChart"

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
      Icon: WaterOutlined
    },
    velocity: {
      displayName: "Velocity",
      component: VelocityChart,
      Icon: SpeedOutlined
    },
    burnUp: {
      displayName: "Burn Up",
      component: BurnUpChart,
      Icon: LocalFireDepartmentOutlined
    }
  }

  if (!charts[chartName as keyof typeof charts]) {
    chartName = "cumulativeFlow"
  }

  const selectedChart = charts[chartName as keyof typeof charts]
  const ChartComponent = selectedChart.component

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          height: "100%",
          width: "220px",
          borderRight: "2px solid #d1d5db"
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ marginBottom: 1.5, paddingTop: 3, width: "100%", textAlign: "center" }}
          >
            Charts
          </Typography>

          <Divider
            flexItem
            sx={{ borderBottomWidth: 2, marginX: 2, opacity: chartName === "cumulativeFlow" ? 0 : 1 }}
          />
        </Box>
        {Object.entries(charts).map(([name, { displayName, Icon }]) => (
          <Box
            key={name}
            sx={{
              ":hover": { filter: "brightness(0.96)" },
              backgroundColor: name === chartName ? "#e0e0e2" : "white"
            }}
          >
            <Link to={name} key={name} style={{ color: "#213547" }}>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 0.5, paddingX: 3, paddingY: 2, fontSize: 18 }}
                key={name}
              >
                <Icon />
                {displayName}
              </Typography>
            </Link>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          marginLeft: "220px",
          minWidth: "1200px"
        }}
      >
        <Paper>
          <Stack direction="column" justifyContent="center" alignItems="center" sx={{ padding: 2 }} spacing={1}>
            <Typography variant="h6">{selectedChart.displayName}</Typography>
            <ChartComponent boardId={board.boardid} />
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}

export default Charts
