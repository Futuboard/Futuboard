import BoardContainer from "@pages/BoardContainer"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Home from '@pages/Home'

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
