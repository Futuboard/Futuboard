import { ReactElement } from "react"
import { ResponsiveContainer } from "recharts"

type ChartContainerProps = {
  children: ReactElement<any, string> // eslint-disable-line
}

const ChartContainer: React.FC<ChartContainerProps> = ({ children }) => {
  return (
    <div className="chart-container">
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  )
}

export default ChartContainer
