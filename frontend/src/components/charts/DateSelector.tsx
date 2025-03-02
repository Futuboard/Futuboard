import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
import { Button, ButtonGroup, Grid, Popover, Stack, Typography } from "@mui/material"
import { DateCalendar } from "@mui/x-date-pickers"
import dayjs from "dayjs"
import { useState } from "react"

import { timeUnitTypes } from "@/types"

interface DateSelectorProps {
  startValue: dayjs.Dayjs | undefined
  endValue: dayjs.Dayjs | undefined
  timeUnitValue: timeUnitTypes
  shortcutValue?: string
  onChange: (startDate: dayjs.Dayjs | undefined, endDate: dayjs.Dayjs | undefined, timeUnit: timeUnitTypes) => void
}

const DateSelector: React.FC<DateSelectorProps> = ({ startValue, endValue, timeUnitValue, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const timeUnitChoices = ["day", "week", "month", "year"]

  const open = Boolean(anchorEl)

  const getCalendarView = (): ("day" | "month" | "year")[] => {
    if (timeUnitValue == "year") {
      return ["year", "month"]
    } else if (timeUnitValue == "month") {
      return ["month", "year"]
    } else {
      return ["day", "month"]
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
            width: 800,
            height: 350,
            alignItems: "center",
            justifyContent: "space-evenly",
            direction: "row"
          }}
        >
          <Grid item xs>
            <DateCalendar
              displayWeekNumber={timeUnitValue == "week"}
              focusedView={getCalendarView()[0]}
              views={getCalendarView()}
              value={startValue}
              onChange={(date: dayjs.Dayjs) => {
                if (date.isAfter(endValue?.subtract(1, "d"))) {
                  onChange(date, date.add(1, "d"), timeUnitValue)
                } else {
                  onChange(date, endValue, timeUnitValue)
                }
              }}
              disableHighlightToday={true}
            />
          </Grid>
          <Grid item xs>
            <DateCalendar
              displayWeekNumber={timeUnitValue == "week"}
              views={getCalendarView()}
              value={endValue}
              onChange={(date) => {
                onChange(startValue, date, timeUnitValue)
              }}
              minDate={startValue?.add(1, "day")}
            />
          </Grid>
          <Grid item marginRight={2}>
            <Stack justifyItems="center" alignItems="center" spacing={1}>
              <Typography variant="subtitle2">Time unit</Typography>
              <ButtonGroup orientation="vertical" color="primary">
                {timeUnitChoices.map((choice) => (
                  <Button
                    key={choice}
                    variant={choice == timeUnitValue ? "contained" : "outlined"}
                    onClick={(choice) =>
                      onChange(startValue, endValue, choice.currentTarget.textContent as timeUnitTypes)
                    }
                  >
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
