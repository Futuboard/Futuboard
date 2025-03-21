import { Grid } from "@mui/material"
import { ReactElement } from "react"
import { ResponsiveContainer } from "recharts"

type ChartContainerProps = {
  children: ReactElement<any, string> // eslint-disable-line
}

const ChartContainer: React.FC<ChartContainerProps> = ({ children }) => {
  return (
    <Grid item sx={{ width: "1100px", height: "650px" }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </Grid>
  )
}

export default ChartContainer
