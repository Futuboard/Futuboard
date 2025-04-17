import { Autocomplete, Box, Button, ButtonGroup, CircularProgress, Stack, TextField } from "@mui/material"
import dayjs from "dayjs"
import React, { useEffect, useState } from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts"

import { countUnitOptions } from "@/constants"
import { useGetBurnUpChartDataQuery, useGetScopesQuery } from "@/state/apiSlice"
import { CountUnit, Scope, TimeUnit } from "@/types"

import ChartContainer from "./ChartContainer"
import ChartToolTip from "./ChartToolTip"

interface BurnUpChartProps {
  boardId: string
}

const BurnUpChart: React.FC<BurnUpChartProps> = ({ boardId }) => {
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null)
  const [queryparams, setQueryparams] = useState<{
    timeUnit: TimeUnit
    countUnit: CountUnit
  }>({ timeUnit: "day", countUnit: "size" })

  const { data: scopeData, isLoading: isScopeLoading } = useGetScopesQuery(boardId)

  const {
    data: data,
    isLoading: isLoading,
    refetch
  } = useGetBurnUpChartDataQuery(
    {
      boardId,
      scopeId: selectedScope?.scopeid || "",
      timeUnit: queryparams.timeUnit,
      countUnit: queryparams.countUnit
    },
    { skip: !selectedScope }
  )

  useEffect(() => {
    if (selectedScope) {
      refetch()
    }
  }, [queryparams, refetch, selectedScope])

  useEffect(() => {
    if (scopeData && scopeData.length > 0) {
      const updatedSelectedScope = scopeData.find((scope) => scope.scopeid == selectedScope?.scopeid)
      if (updatedSelectedScope) {
        setSelectedScope(updatedSelectedScope)
      } else {
        setSelectedScope(scopeData[0])
      }
    }
  }, [scopeData]) // eslint-disable-line react-hooks/exhaustive-deps

  const setTimeUnit = (timeUnit: TimeUnit) => {
    setQueryparams((params) => ({ ...params, timeUnit }))
  }

  const setCountUnit = (countUnit: CountUnit) => {
    setQueryparams((params) => ({ ...params, countUnit }))
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

  if (isScopeLoading || !scopeData || scopeData.length == 0) {
    return <Box sx={{ typography: "h5", padding: 10 }}>No data</Box>
  }

  const timeUnitChoices = ["day", "week", "month", "year"]

  return (
    <>
      {!data?.data || data?.data.length == 0 ? (
        <Box sx={{ typography: "h5", padding: 10 }}>No data for this scope</Box>
      ) : (
        <ChartContainer>
          <LineChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickFormatter={tickFormatter} />
            <YAxis />
            <Tooltip
              offset={20}
              content={({ active, payload, label }) => (
                <ChartToolTip
                  active={active || false}
                  payload={payload as Array<{ [key: string]: string }>}
                  label={label}
                  labelFormatter={tickFormatter}
                />
              )}
            />
            <Line type="linear" dataKey="scope" stroke="#03a9f4" fill="#03a9f4" dot={false} strokeWidth={2} />
            <Line type="linear" dataKey="done" fill="#f44336" stroke="#f44336" dot={false} strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      )}

      <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ marginBottom: 1 }}>
        <Autocomplete
          disableClearable
          options={scopeData}
          getOptionLabel={(option) => option.title}
          sx={{ width: 200 }}
          renderInput={(params) => <TextField {...params} label="Scope" />}
          value={selectedScope || undefined}
          onChange={(_, newValue) => {
            setSelectedScope(newValue)
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 0.5, color: "#666666" }}>
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
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 0.5, color: "#666666" }}>
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
        </Box>
      </Stack>
    </>
  )
}

export default BurnUpChart
