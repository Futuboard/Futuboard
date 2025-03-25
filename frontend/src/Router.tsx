import Home from "@pages/Home"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import Notification from "./components/board/Notification"
import Admin from "./pages/Admin"
import BoardPage from "./pages/BoardPage"
import ChartsPage from "./pages/ChartsPage"

const Router = () => {
  return (
    <BrowserRouter>
      <Notification />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/board/:id" element={<BoardPage />} />
        <Route path="/board/:id/charts/*" element={<ChartsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Router
