import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
import { Button, ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Popover, Select, Stack } from "@mui/material"
import { DateCalendar } from "@mui/x-date-pickers"
import dayjs from "dayjs"
import { useState } from "react"

import { timeUnitOptions } from "@/types"

interface DateSelectorProps {
  startValue: dayjs.Dayjs | undefined
  endValue: dayjs.Dayjs | undefined
  timeUnitValue: timeUnitOptions
  shortcutValue?: string
  onSubmitStart: (startDate: dayjs.Dayjs | undefined) => void
  onSubmitEnd: (endDate: dayjs.Dayjs | undefined) => void
  onSubmitTimeUnit: (timeUnit: timeUnitOptions) => void
}

const DateSelector: React.FC<DateSelectorProps> = ({
  startValue,
  endValue,
  timeUnitValue,
  onSubmitStart,
  shortcutValue,
  onSubmitEnd,
  onSubmitTimeUnit
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const timeUnitChoices = ["day", "week", "month", "year"]

  const shortcutOptions = ["week", "month", "3 months", "6 months", "year", "max"]

  const [startDate, setStartDate] = useState<dayjs.Dayjs | undefined>(startValue)
  const [endDate, setEndDate] = useState<dayjs.Dayjs | undefined>(endValue)
  const [timeUnit, setTimeUnit] = useState<timeUnitOptions>(timeUnitValue)
  const [shortcut, setShortcut] = useState(shortcutValue)

  const handleClose = () => {
    setAnchorEl(null)
    setStartDate(startValue)
    setEndDate(endValue)
    setTimeUnit(timeUnitValue)
  }

  const open = Boolean(anchorEl)

  const onSubmit = () => {
    onSubmitStart(startDate)
    onSubmitEnd(endDate)
    onSubmitTimeUnit(timeUnit)
  }

  const handleShortCut = (event: React.MouseEvent<HTMLElement>) => {
    setShortcut(event.currentTarget.textContent as string)
    setEndDate(dayjs())
    switch (event.currentTarget.textContent) {
      case "week":
        setStartDate(dayjs().subtract(1, "w"))
        break
      case "month":
        setStartDate(dayjs().subtract(1, "month"))
        break
      case "3 months":
        setStartDate(dayjs().subtract(3, "month"))
        break
      case "6 months":
        setStartDate(dayjs().subtract(6, "month"))
        break
      case "year":
        setStartDate(dayjs().subtract(1, "y"))
        break
      default:
        setStartDate(undefined)
    }
  }

  const getCalendarView = () => {
    if (timeUnit == "month" || timeUnit == "year") {
      return timeUnit
    } else {
      return "day"
    }
  }

  return (
    <div>
      <Button variant="outlined" onClick={(event) => setAnchorEl(event.currentTarget)} endIcon={<CalendarMonthIcon />}>
        {startValue?.format("DD.MM.YYYY")} - {endValue?.format("DD.MM.YYYY")}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        transformOrigin={{ vertical: 0, horizontal: 450 }}
      >
        <Grid
          container
          spacing={1}
          sx={{
            width: 900,
            height: 350,
            alignItems: "center",
            justifyContent: "space-evenly",
            direction: "row"
          }}
        >
          <Grid item>
            <ButtonGroup orientation="vertical" color="primary">
              {shortcutOptions.map((choice) => (
                <Button variant={choice == shortcut ? "contained" : "outlined"} onClick={handleShortCut}>
                  {choice}
                </Button>
              ))}
            </ButtonGroup>
          </Grid>
          <Grid item xs={4}>
            <DateCalendar
              displayWeekNumber={timeUnit == "week"}
              view={getCalendarView()}
              value={startDate || null}
              onChange={(date: dayjs.Dayjs) => {
                if (date.isAfter(endDate?.subtract(1, "d"))) {
                  setEndDate(date.add(1, "day"))
                }
                setShortcut("")
                setStartDate(date || startDate)
              }}
              disableHighlightToday={true}
            />
          </Grid>
          <Grid item xs={4}>
            <DateCalendar
              displayWeekNumber={timeUnit == "week"}
              view={getCalendarView()}
              value={endDate}
              onChange={(date) => {
                setShortcut("")
                setEndDate(date || endDate)
              }}
              minDate={startDate?.add(1, "day")}
            />
          </Grid>
          <Grid item>
            <Stack height="280px" alignItems="stretch" justifyContent="space-between">
              <FormControl>
                <InputLabel id="timeunitselect">time unit</InputLabel>
                <Select
                  label="time unit"
                  labelId="timeunitselect"
                  value={timeUnit}
                  onChange={(unit) => setTimeUnit(unit.target.value as timeUnitOptions)}
                >
                  {timeUnitChoices.map((timeUnit) => (
                    <MenuItem key={timeUnit} value={timeUnit}>
                      {timeUnit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack spacing={1}>
                <Button onClick={onSubmit} variant="contained">
                  Submit
                </Button>
                <Button variant="outlined" color="error" onClick={handleClose}>
                  Close
                </Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Popover>
    </div>
  )
}

export default DateSelector
