import { Button, ButtonGroup, CircularProgress, Divider, Grid, Paper, Stack, Typography } from "@mui/material"
import dayjs from "dayjs"
import React, { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { useGetCumulativeFlowDiagramDataQuery } from "@/state/apiSlice"
import { TimeUnit } from "@/types"

import DateSelector from "./DateSelector"

interface CumulativeFlowDiagramProps {
  boardId: string
}

const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ boardId }) => {
  const [queryparams, setQueryparams] = useState<{
    start: dayjs.Dayjs | undefined
    end: dayjs.Dayjs | undefined
    timeUnit: TimeUnit
  }>({ start: dayjs().subtract(30, "day"), end: dayjs(), timeUnit: "day" })

  const { data: data, isLoading: isLoading } = useGetCumulativeFlowDiagramDataQuery({
    boardId: boardId,
    timeUnit: queryparams.timeUnit,
    start: queryparams.start?.format("YYYY-MM-DD"),
    end: queryparams.end?.format("YYYY-MM-DD")
  })

  const [shortcut, setShortcut] = useState("month")
  const [highlightedArea, setHighlightedArea] = useState("")

  const handleSubmit = (start: dayjs.Dayjs | undefined, end: dayjs.Dayjs | undefined, timeUnit: TimeUnit) => {
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

  const tickFormatter = (tick: string) => {
    if (queryparams.timeUnit == "month") {
      return dayjs(tick).format("MMMM YYYY")
    } else if (queryparams.timeUnit == "year") {
      return dayjs(tick).format("YYYY")
    } else return dayjs(tick).format("DD.MM.YYYY")
  }

  interface AreaToolTipProps {
    active: boolean
    payload: Array<{ [key: string]: string }>
    label: string
  }

  const AreaToolTip: React.FC<AreaToolTipProps> = ({ active, payload, label }) => {
    if (active && payload) {
      return (
        <Paper>
          <Stack padding={1}>
            <Typography variant="h6">{tickFormatter(label)}</Typography>
            <Divider />
            <Stack direction="column-reverse">
              {payload.map((val: { [key: string]: string }) => (
                <Typography key={val.name} color={val.fill} fontWeight={val.name == highlightedArea ? 900 : "normal"}>
                  {val.name}: {val.value}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )
    }
  }

  if (isLoading) {
    return (
      <Paper sx={{ textAlign: "center", typography: "h5", padding: 10 }}>
        <CircularProgress />
      </Paper>
    )
  }

  if (!data?.columns || !data?.data) {
    return <Paper sx={{ textAlign: "center", typography: "h5", padding: 10 }}>No data</Paper>
  }

  const dataLength = data?.data.length
  const maxArealabelLength = 20

  const gradient: string[] = ["#448aff", "#1565c0", "#009688", "#8bc34a", "#ffc107", "#ff9800", "#f44336", "#ad1457"]
  const shortcutOptions = ["week", "month", "3 months", "6 months", "year", "max"]
  const timeUnitChoices = ["day", "week", "month", "year"]

  const lastTick = Object.keys(data.data[dataLength - 1])
  lastTick.pop()
  lastTick.reverse()
  const lastVals = Object.values(data.data[dataLength - 1])
  lastVals.pop()
  lastVals.reverse()

  const startIndex = lastVals.findIndex((val) => val != 0)
  lastVals.splice(0, startIndex)
  lastTick.splice(0, startIndex)
  let sum = 0

  //add the value to the sum for the rest of the labels, remove half of value so the label is in the center of the area.
  const labelYvalues = lastVals.map((val) => {
    sum += val
    return sum - 0.5 * val
  })

  const yAxisDomain = Math.round(sum * 1.1)

  return (
    <Paper>
      <Grid container direction="column" justifyContent="center" alignItems="center" sx={{ padding: 2 }} spacing={1}>
        <Grid item>
          <Typography variant="h6">Cumulative Flow</Typography>
        </Grid>
        <Grid item sx={{ width: "1100px", height: "700px" }}>
          <ResponsiveContainer width="105%" height="100%">
            <AreaChart
              data={data?.data}
              margin={{
                right: 40
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickFormatter={tickFormatter} />
              <YAxis
                domain={[0, yAxisDomain]}
                yAxisId={0}
                allowDataOverflow={true}
                ticks={labelYvalues}
                tickFormatter={(val) => {
                  const label = lastTick[labelYvalues.indexOf(val)]
                  return label.length > maxArealabelLength
                    ? label.substring(0, maxArealabelLength - 3).trim() + "..."
                    : label
                }}
                orientation="right"
                minTickGap={-1}
                interval="preserveStartEnd"
                tick={{ fontSize: 10, fontWeight: 700, width: 200 }}
                axisLine={false}
                width={130}
              />
              <YAxis
                type="number"
                yAxisId={1}
                domain={[0, yAxisDomain]}
                tickCount={Math.max(labelYvalues.length / 2, 4)}
                allowDataOverflow={true}
                style={{ fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip
                offset={20}
                content={({ active, payload, label }) => (
                  <AreaToolTip
                    active={active || false}
                    payload={payload as Array<{ [key: string]: string }>}
                    label={label}
                  />
                )}
              />
              {data?.columns
                .map((name, index) => (
                  <Area
                    type="linear"
                    key={name}
                    dataKey={name}
                    stackId="1"
                    stroke={gradient[index % gradient.length]}
                    fill={gradient[index % gradient.length]}
                    yAxisId={index == 0 || data.columns.length - 1 ? 1 : 0}
                    onMouseEnter={() => setHighlightedArea(name)}
                    onMouseLeave={() => setHighlightedArea("")}
                  ></Area>
                ))
                .reverse()}
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
                    handleSubmit(queryparams.start, queryparams.end, event.currentTarget.textContent as TimeUnit)
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
