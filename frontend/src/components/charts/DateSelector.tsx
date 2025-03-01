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
  onChange: (startDate: dayjs.Dayjs | undefined, endDate: dayjs.Dayjs | undefined, timeUnit: timeUnitOptions) => void
}

const DateSelector: React.FC<DateSelectorProps> = ({
  startValue,
  endValue,
  timeUnitValue,
  shortcutValue,
  onChange
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const timeUnitChoices = ["day", "week", "month", "year"]

  const shortcutOptions = ["week", "month", "3 months", "6 months", "year", "max"]

  const [shortcut, setShortcut] = useState(shortcutValue)

  const open = Boolean(anchorEl)

  const handleShortCut = (event: React.MouseEvent<HTMLElement>) => {
    setShortcut(event.currentTarget.textContent as string)
    switch (event.currentTarget.textContent) {
      case "week":
        onChange(dayjs().subtract(1, "w"), dayjs(), timeUnitValue)

        break
      case "month":
        onChange(dayjs().subtract(1, "month"), dayjs(), timeUnitValue)
        break
      case "3 months":
        onChange(dayjs().subtract(3, "month"), dayjs(), timeUnitValue)

        break
      case "6 months":
        onChange(dayjs().subtract(6, "month"), dayjs(), timeUnitValue)
        break
      case "year":
        onChange(dayjs().subtract(1, "year"), dayjs(), timeUnitValue)
        break
      default:
        onChange(undefined, dayjs(), timeUnitValue)
    }
  }

  const getCalendarView = () => {
    if (timeUnitValue == "month" || timeUnitValue == "year") {
      return timeUnitValue
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
        onClose={() => setAnchorEl(null)}
        open={open}
        anchorEl={anchorEl}
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
          <Grid item xs={4}>
            <DateCalendar
              displayWeekNumber={timeUnitValue == "week"}
              view={getCalendarView()}
              value={startValue}
              onChange={(date: dayjs.Dayjs) => {
                if (date.isAfter(endValue?.subtract(1, "d"))) {
                  onChange(date, date.add(1, "d"), timeUnitValue)
                } else {
                  setShortcut("")
                  onChange(date, endValue, timeUnitValue)
                }
              }}
              disableHighlightToday={true}
            />
          </Grid>
          <Grid item xs={4}>
            <DateCalendar
              displayWeekNumber={timeUnitValue == "week"}
              view={getCalendarView()}
              value={endValue}
              onChange={(date) => {
                setShortcut("")
                onChange(startValue, date, timeUnitValue)
              }}
              minDate={startValue?.add(1, "day")}
            />
          </Grid>
          <Grid item>
            <Stack height="280px" alignItems="stretch" justifyContent="space-between">
              <FormControl>
                <InputLabel id="timeunitselect">time unit</InputLabel>
                <Select
                  label="time unit"
                  labelId="timeunitselect"
                  value={timeUnitValue}
                  onChange={(event) => {
                    onChange(startValue, endValue, event.target.value as timeUnitOptions)
                  }}
                >
                  {timeUnitChoices.map((timeUnit) => (
                    <MenuItem key={timeUnit} value={timeUnit}>
                      {timeUnit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ButtonGroup orientation="vertical" color="primary">
                {shortcutOptions.map((choice) => (
                  <Button key={choice} variant={choice == shortcut ? "contained" : "outlined"} onClick={handleShortCut}>
                    {choice}
                  </Button>
                ))}
              </ButtonGroup>
            </Stack>
          </Grid>
        </Grid>
      </Popover>
    </div>
  )
}

export default DateSelector
