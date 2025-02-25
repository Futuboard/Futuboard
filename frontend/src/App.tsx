import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import "./App.css"

import Router from "./Router"

const App = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Router />
    </LocalizationProvider>
  )
}

export default App
