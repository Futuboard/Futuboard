import BoardContainer from "@pages/BoardContainer"
import Home from "@pages/Home"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import Notification from "./components/board/Notification"
import Admin from "./pages/Admin"
import Charts from "./pages/Charts"

const Router = () => {
  return (
    <BrowserRouter>
      <Notification />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/board/:id" element={<BoardContainer />} />
        <Route path="/board/:id/charts/*" element={<Charts />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Router
