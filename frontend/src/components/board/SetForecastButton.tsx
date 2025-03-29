import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import { useState } from "react"

import { useSetScopeForecastMutation } from "@/state/apiSlice"
import { Scope as Scopetype } from "@/types"

interface SetScopeForecastButtonProps {
  scope: Scopetype
}

const SetScopeForecastButton: React.FC<SetScopeForecastButtonProps> = ({ scope }) => {
  const [setScopeForecast] = useSetScopeForecastMutation()
  const [open, setOpen] = useState(false)
  const isForecastSet = Boolean(scope.forecast_set_date)

  const handleClick = () => {
    if (isForecastSet) {
      setOpen(true)
    } else {
      setForecast()
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const setForecast = () => {
    setScopeForecast({ scopeid: scope.scopeid })
    setOpen(false)
  }

  return (
    <div>
      <Button onClick={handleClick} type="submit" color={"primary"} variant="contained">
        {isForecastSet ? "Update Forecast" : "Set Forecast"}
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{"Confirm Forecast Update"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The forecast for this scope has already been set. Do you want to update it?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={setForecast} type="submit" color="primary" variant="contained">
            Update Forecast
          </Button>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default SetScopeForecastButton
