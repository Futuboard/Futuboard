import { Box, GlobalStyles } from "@mui/material"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useLocation, useParams } from "react-router-dom"

import AccessBoardForm from "@/components/board/AccessBoardForm"
import ToolBar from "@/components/board/Toolbar"
import CumulativeFlowDiagram from "@/components/charts/CumulativeFlowDiagram"
import VelocityChart from "@/components/charts/VelocityChart"
import { cacheTagTypes } from "@/constants"
import { boardsApi, useGetBoardQuery, useLoginMutation } from "@/state/apiSlice"
import { setBoardId } from "@/state/auth"
import { setNotification } from "@/state/notification"
import { webSocketContainer } from "@/state/websocket"

const Charts: React.FC = () => {
  const dispatch = useDispatch()
  const params = useParams()
  const [isBoardIdSet, setIsBoardIdset] = useState(false)
  const [tryLogin] = useLoginMutation()
  const [hasTriedEmptyPasswordLogin, setHasTriedEmptyPasswordLogin] = useState(false)
  const location = useLocation()

  const id = params.id || ""
  const { data: board, isSuccess: isLoggedIn, isLoading } = useGetBoardQuery(id || "", { skip: !id || !isBoardIdSet })

  useEffect(() => {
    const inner = async () => {
      if (!id) return
      dispatch(setBoardId(id))
      setIsBoardIdset(true)
      await webSocketContainer.connectToBoard(id)
      webSocketContainer.setOnMessageHandler((tags) => {
        dispatch(boardsApi.util.invalidateTags(tags))
      })
      webSocketContainer.setResetHandler(() => {
        dispatch(boardsApi.util.invalidateTags([...cacheTagTypes]))
      })
      webSocketContainer.setSendNotificationHandler((message) => {
        dispatch(setNotification({ text: message, type: "info" }))
      })
    }
    inner()
  }, [id, dispatch])

  useEffect(() => {
    if (!id) return
    const inner = async () => {
      await tryLogin({ boardId: id, password: "" })
      setHasTriedEmptyPasswordLogin(true)
    }
    inner()
  }, [id, tryLogin])

  useEffect(() => {
    document.title = board?.title ? "Charts - " + board?.title : "Futuboard"
  }, [board])

  if (isLoading || !hasTriedEmptyPasswordLogin) {
    return null
  }

  if (!isLoggedIn) {
    return (
      <>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh"
          }}
        >
          <AccessBoardForm id={id} />
        </Box>
      </>
    )
  }

  //         <VelocityChart boardId={id} />

  /*
          <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignItems: "center",
            width: "300px",
            backgroundColor: "white",
            height: "100%"
          }}
        >
          {chartTypes.map((chartType) => (
            <Typography variant="h6">{chartType.name}</Typography>
          ))}
        </Box>
        */

  const chartName = location.pathname.split("/").pop()

  const charts = {
    cumulativeFlow: CumulativeFlowDiagram,
    velocity: VelocityChart
  }

  const ChartComponent = charts[chartName as keyof typeof charts] || CumulativeFlowDiagram

  return (
    <Box sx={{ height: "calc(100vh - 65px)", paddingTop: "65px" }}>
      <GlobalStyles styles={{ ":root": { backgroundColor: board.background_color || "white" } }} />
      <ToolBar boardId={id} title={`Charts - ${board?.title}`} chartToolbar={true} />
      <Box sx={{ position: "relative", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%"
          }}
        >
          <ChartComponent boardId={id} />
        </Box>
      </Box>
    </Box>
  )
}

export default Charts
