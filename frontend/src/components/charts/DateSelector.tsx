import { Button, Grid, MenuItem, Popover, Select } from "@mui/material"
import { DateCalendar } from "@mui/x-date-pickers"
import { useState } from "react"
import dayjs from "dayjs"
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"

interface DateSelectorProps {
  onSubmitStart: (startDate: string) => void
  onSubmitEnd: (endDate: string) => void
  onSubmitTimeUnit: (timeUnit: string) => void
}

const DateSelector: React.FC<DateSelectorProps> = ({ onSubmitStart, onSubmitEnd, onSubmitTimeUnit }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  const onSubmit = () => {
    onSubmitStart(startDate.format("YYYY-MM-DD"))
    onSubmitEnd(endDate.format("YYYY-MM-DD"))
    onSubmitTimeUnit(timeUnit)
  }

  const [startDate, setStartDate] = useState(dayjs().subtract(30, "day"))
  const [endDate, setEndDate] = useState(dayjs())
  const [timeUnit, setTimeUnit] = useState("day")

  const timeUnitOptions = ["minute", "hour", "day", "week", "month", "year"]

  return (
    <div>
      <Button variant="outlined" onClick={(event) => setAnchorEl(event.currentTarget)} endIcon={<CalendarMonthIcon />}>
        {startDate.format("MM.DD.YYYY")} - {endDate.format("MM.DD.YYYY")}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
      >
        <Grid container alignItems="center" justifyContent="space-evenly">
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
