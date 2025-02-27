import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
import { Button, Grid, MenuItem, Popover, Select } from "@mui/material"
import { DateCalendar } from "@mui/x-date-pickers"
import dayjs from "dayjs"
import { useState } from "react"

interface DateSelectorProps {
  startValue: dayjs.Dayjs
  endValue: dayjs.Dayjs
  timeUnitValue: string
  onSubmitStart: (startDate: dayjs.Dayjs) => void
  onSubmitEnd: (endDate: dayjs.Dayjs) => void
  onSubmitTimeUnit: (timeUnit: string) => void
}

const DateSelector: React.FC<DateSelectorProps> = ({
  startValue,
  endValue,
  timeUnitValue,
  onSubmitStart,
  onSubmitEnd,
  onSubmitTimeUnit
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const [startDate, setStartDate] = useState(startValue)
  const [endDate, setEndDate] = useState(endValue)
  const [timeUnit, setTimeUnit] = useState(timeUnitValue)

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

  const timeUnitOptions = ["day", "week", "month", "year"]

  return (
    <div>
      <Button variant="outlined" onClick={(event) => setAnchorEl(event.currentTarget)} endIcon={<CalendarMonthIcon />}>
        {startValue.format("DD.MM.YYYY")} - {endValue.format("DD.MM.YYYY")}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        transformOrigin={{ vertical: 0, horizontal: 400 }}
      >
        <Grid container sx={{ alignItems: "center", justifyContent: "space-evenly", width: 800 }}>
          <Grid item xs={5}>
            <DateCalendar
              value={startDate}
              onChange={(date) => setStartDate(date || startDate)}
              maxDate={endDate}
              disableHighlightToday={true}
            />
          </Grid>
          <Grid item xs={5}>
            <DateCalendar value={endDate} onChange={(date) => setEndDate(date || endDate)} minDate={startDate} />
          </Grid>
          <Grid item xs height="300px" container direction="column" justifyContent="space-between">
            <Grid item xs={6}>
              <Select
                sx={{ width: 100 }}
                value={timeUnit}
                onChange={(unit) => setTimeUnit(unit.target.value as string)}
              >
                {timeUnitOptions.map((timeUnit) => (
                  <MenuItem key={timeUnit} value={timeUnit}>
                    {timeUnit}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={4}>
              <Button sx={{ width: 100 }} onClick={onSubmit} variant="contained">
                Submit
              </Button>
              <Button sx={{ width: 100, marginTop: 1 }} variant="outlined" color="error" onClick={handleClose}>
                Close
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Popover>
    </div>
  )
}

export default DateSelector
