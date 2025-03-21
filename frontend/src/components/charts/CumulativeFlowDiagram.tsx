import { Box, Button, ButtonGroup, CircularProgress, InputLabel, Stack } from "@mui/material"
import dayjs from "dayjs"
import React, { useEffect, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

import { countUnitOptions } from "@/constants"
import { useGetCumulativeFlowDiagramDataQuery } from "@/state/apiSlice"
import { CountUnit, TimeUnit } from "@/types"

import ChartContainer from "./ChartContainer"
import ChartToolTip from "./ChartToolTip"
import DateSelector from "./DateSelector"

interface CumulativeFlowDiagramProps {
  boardId: string
}

const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ boardId }) => {
  const [queryparams, setQueryparams] = useState<{
    start: dayjs.Dayjs | undefined
    end: dayjs.Dayjs | undefined
    timeUnit: TimeUnit
    countUnit: CountUnit
  }>({ start: dayjs().subtract(30, "day"), end: dayjs(), timeUnit: "day", countUnit: "size" })

  const {
    data: data,
    isLoading: isLoading,
    refetch
  } = useGetCumulativeFlowDiagramDataQuery({
    boardId: boardId,
    timeUnit: queryparams.timeUnit,
    start: queryparams.start?.format("YYYY-MM-DD"),
    end: queryparams.end?.format("YYYY-MM-DD"),
    countUnit: queryparams.countUnit
  })

  const [shortcut, setShortcut] = useState("month")
  const [highlightedArea, setHighlightedArea] = useState("")

  useEffect(() => {
    refetch()
  }, [queryparams, refetch])

  const setStart = (start: dayjs.Dayjs | undefined) => {
    setQueryparams((params) => ({ ...params, start }))
  }

  const setEnd = (end: dayjs.Dayjs | undefined) => {
    setQueryparams((params) => ({ ...params, end }))
  }

  const setTimeUnit = (timeUnit: TimeUnit) => {
    setQueryparams((params) => ({ ...params, timeUnit }))
  }

  const setCountUnit = (countUnit: CountUnit) => {
    setQueryparams((params) => ({ ...params, countUnit }))
  }

  const handleDateSelectorChange = (
    start: dayjs.Dayjs | undefined,
    end: dayjs.Dayjs | undefined,
    timeUnit: TimeUnit
  ) => {
    setQueryparams({
      start: start,
      end: end,
      timeUnit: timeUnit,
      countUnit: queryparams.countUnit
    })
    setShortcut("")
  }

  const handleShortCut = (event: React.MouseEvent<HTMLElement>) => {
    switch (event.currentTarget.textContent) {
      case "week":
        setStart(dayjs().subtract(1, "w"))
        break
      case "month":
        setStart(dayjs().subtract(1, "month"))
        break
      case "3 months":
        setStart(dayjs().subtract(3, "month"))
        break
      case "6 months":
        setStart(dayjs().subtract(6, "month"))
        break
      case "year":
        setStart(dayjs().subtract(1, "year"))
        break
      case "max":
        setStart(undefined)
        break
    }
    setEnd(dayjs())
    setShortcut(event.currentTarget.textContent as string)
  }

  const tickFormatter = (tick: string) => {
    if (queryparams.timeUnit == "month") {
      return dayjs(tick).format("MMMM YYYY")
    } else if (queryparams.timeUnit == "year") {
      return dayjs(tick).format("YYYY")
    } else return dayjs(tick).format("DD.MM.YYYY")
  }

  if (isLoading) {
    return (
      <Box sx={{ typography: "h5", paddingX: 10, paddingY: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data?.columns || !data?.data || data?.data.length == 0) {
    return <Box sx={{ typography: "h5", padding: 10 }}>No data</Box>
  }

  const dataLength = data?.data.length
  const maxArealabelLength = 20

  const gradient: string[] = ["#448aff", "#1565c0", "#009688", "#8bc34a", "#ffc107", "#ff9800", "#f44336", "#ad1457"]
  const shortcutOptions = ["week", "month", "3 months", "6 months", "year", "max"]
  const timeUnitChoices = ["day", "week", "month", "year"]

  const lastTick = Object.keys(data.data[dataLength - 1])
    .filter((label) => label !== "name")
    .reverse()
  const lastVals = Object.values(data.data[dataLength - 1])
    .filter((number) => typeof number == "number")
    .reverse()

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
    <>
      <ChartContainer>
        <AreaChart data={data?.data}>
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
              <ChartToolTip
                active={active || false}
                payload={payload as Array<{ [key: string]: string }>}
                label={label}
                labelFormatter={tickFormatter}
                highlightedItem={highlightedArea}
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
      </ChartContainer>

      <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ marginBottom: 1 }}>
        <InputLabel sx={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 0.5 }}>
          Time frame
          <ButtonGroup color="primary">
            {shortcutOptions.map((choice) => (
              <Button key={choice} variant={choice == shortcut ? "contained" : "outlined"} onClick={handleShortCut}>
                {choice}
              </Button>
            ))}
          </ButtonGroup>
        </InputLabel>
        <InputLabel sx={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 0.5 }}>
          Time unit
          <ButtonGroup size="small">
            {timeUnitChoices.map((timeUnit) => (
              <Button
                variant={timeUnit == queryparams.timeUnit ? "contained" : "outlined"}
                key={timeUnit}
                value={timeUnit}
                onClick={(event) => {
                  setTimeUnit(event.currentTarget.value as TimeUnit)
                }}
              >
                {timeUnit}
              </Button>
            ))}
          </ButtonGroup>
        </InputLabel>
        <InputLabel sx={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 0.5 }}>
          Count unit
          <ButtonGroup size="small">
            {countUnitOptions.map((unit) => (
              <Button
                variant={unit == queryparams.countUnit ? "contained" : "outlined"}
                key={unit}
                value={unit}
                onClick={(event) => {
                  setCountUnit(event.currentTarget.value as CountUnit)
                }}
              >
                {unit}
              </Button>
            ))}
          </ButtonGroup>
        </InputLabel>
      </Stack>
      <DateSelector
        startValue={queryparams.start}
        endValue={queryparams.end}
        timeUnitValue={queryparams.timeUnit}
        onChange={handleDateSelectorChange}
        shortcutValue={shortcut}
      />
    </>
  )
}

export default CumulativeFlowDiagram
