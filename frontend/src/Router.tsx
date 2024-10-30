import BoardContainer from "@pages/BoardContainer"
import Home from "@pages/Home"
import { BrowserRouter, Route, Routes } from "react-router-dom"

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:id" element={<BoardContainer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Router
