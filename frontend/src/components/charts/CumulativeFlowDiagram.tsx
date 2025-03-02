import { Button, ButtonGroup, Grid, Paper, rgbToHex, Stack, Typography } from "@mui/material"
import dayjs from "dayjs"
import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { useGetCumulativeFlowDiagramDataQuery } from "@/state/apiSlice"
import { timeUnitTypes } from "@/types"

import DateSelector from "./DateSelector"

interface CumulativeFlowDiagramProps {
  boardId: string
}

const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ boardId }) => {
  const [queryparams, setQueryparams] = useState<{
    start: dayjs.Dayjs | undefined
    end: dayjs.Dayjs | undefined
    timeUnit: timeUnitTypes
  }>({ start: dayjs().subtract(30, "day"), end: dayjs(), timeUnit: "day" })

  const { data: data } = useGetCumulativeFlowDiagramDataQuery({
    boardId: boardId,
    timeUnit: queryparams.timeUnit,
    start: queryparams.start?.format("YYYY-MM-DD"),
    end: queryparams.end?.format("YYYY-MM-DD")
  })

  const [shortcut, setShortcut] = useState("month")

  if (!data?.columns) {
    return <Paper sx={{ textAlign: "center", typography: "h5", padding: 10 }}>No data</Paper>
  }

  const tickFormatter = (tick: string) => {
    if (queryparams.timeUnit == "month") {
      return dayjs(tick).format("MM.YYYY")
    } else if (queryparams.timeUnit == "year") {
      return dayjs(tick).format("YYYY")
    } else return dayjs(tick).format("DD.MM.YYYY")
  }

  const handleSubmit = (start: dayjs.Dayjs | undefined, end: dayjs.Dayjs | undefined, timeUnit: timeUnitTypes) => {
    if (timeUnit == queryparams.timeUnit) {
      setShortcut("")
    }

    setQueryparams({
      start: start,
      end: end,
      timeUnit: timeUnit
    })
  }

  const handleShortCut = (event: React.MouseEvent<HTMLElement>) => {
    switch (event.currentTarget.textContent) {
      case "week":
        handleSubmit(dayjs().subtract(1, "w"), dayjs(), queryparams.timeUnit)
        break
      case "month":
        handleSubmit(dayjs().subtract(1, "month"), dayjs(), queryparams.timeUnit)
        break
      case "3 months":
        handleSubmit(dayjs().subtract(3, "month"), dayjs(), queryparams.timeUnit)
        break
      case "6 months":
        handleSubmit(dayjs().subtract(6, "month"), dayjs(), queryparams.timeUnit)
        break
      case "year":
        handleSubmit(dayjs().subtract(1, "year"), dayjs(), queryparams.timeUnit)
        break
      default:
        handleSubmit(undefined, dayjs(), queryparams.timeUnit)
    }
    setShortcut(event.currentTarget.textContent as string)
  }

  const gradient: string[] = []
  const length = data.columns.length

  for (let i = 0; i < length; i++) {
    const red = Math.round(255 - i * (255 / length))
    const blue = Math.round(i * (255 / length))
    gradient.push(rgbToHex(`rgb(${red},0,${blue})`))
  }

  const shortcutOptions = ["week", "month", "3 months", "6 months", "year", "max"]
  const timeUnitChoices = ["day", "week", "month", "year"]

  return (
    <Paper>
      <Grid container direction="column" justifyContent="center" alignItems="center" sx={{ padding: 2 }} spacing={1}>
        <Grid item>
          <Typography variant="h6">Cumulative Flow</Typography>
        </Grid>
        <Grid item sx={{ width: "1100px", height: "700px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data?.data}
              margin={{
                right: 40
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickFormatter={tickFormatter} />
              <YAxis type="number" domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
              <Tooltip labelFormatter={tickFormatter} itemStyle={{ color: "black" }} />
              {data?.columns.map((name, index) => (
                <Area
                  type="linear"
                  key={name}
                  dataKey={name}
                  stackId="1"
                  stroke={gradient[index + 2] || "#040042"}
                  fill={gradient[index]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Grid>
        <Grid item>
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <ButtonGroup color="primary">
              {shortcutOptions.map((choice) => (
                <Button key={choice} variant={choice == shortcut ? "contained" : "outlined"} onClick={handleShortCut}>
                  {choice}
                </Button>
              ))}
            </ButtonGroup>
            <ButtonGroup size="small">
              {timeUnitChoices.map((timeUnit) => (
                <Button
                  variant={timeUnit == queryparams.timeUnit ? "contained" : "outlined"}
                  key={timeUnit}
                  value={timeUnit}
                  onClick={(event) => {
                    handleSubmit(queryparams.start, queryparams.end, event.currentTarget.textContent as timeUnitTypes)
                  }}
                >
                  {timeUnit}
                </Button>
              ))}
            </ButtonGroup>
          </Stack>
        </Grid>
        <Grid item>
          <DateSelector
            startValue={queryparams.start}
            endValue={queryparams.end}
            timeUnitValue={queryparams.timeUnit}
            onChange={handleSubmit}
            shortcutValue={shortcut}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

export default CumulativeFlowDiagram
