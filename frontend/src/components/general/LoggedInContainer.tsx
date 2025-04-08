import { Box, GlobalStyles } from "@mui/material"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import AccessBoardForm from "@/components/board/AccessBoardForm"
import { cacheTagTypes } from "@/constants"
import { addVisitedBoard } from "@/services/utils"
import { boardsApi, useGetBoardQuery, useLoginMutation } from "@/state/apiSlice"
import { setBoardId } from "@/state/auth"
import { setNotification } from "@/state/notification"
import { webSocketContainer } from "@/state/websocket"
import { Board } from "@/types"

type LoggedInContainerProps = {
  children: ({ board }: { board: Board }) => React.ReactNode
  titlePrefix?: string
}

const LoggedInContainer: React.FC<LoggedInContainerProps> = ({ children, titlePrefix = "" }) => {
  const dispatch = useDispatch()
  const params = useParams()
  const [isBoardIdSet, setIsBoardIdset] = useState(false)
  const [tryLogin] = useLoginMutation()
  const [hasTriedEmptyPasswordLogin, setHasTriedEmptyPasswordLogin] = useState(false)

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
    const prefix = titlePrefix ? titlePrefix + " - " : ""
    document.title = board?.title ? prefix + board?.title + "- Futuboard" : "Futuboard"
  }, [board, titlePrefix])

  useEffect(() => {
    if (isLoggedIn) {
      addVisitedBoard({ boardid: id, title: board.title })
    }
  }, [id, isLoggedIn, board?.title])

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

  return (
    <Box sx={{ height: "calc(100vh - 65px)", paddingTop: "65px" }}>
      <GlobalStyles styles={{ ":root": { backgroundColor: board.background_color || "white" } }} />
      {children({ board })}
    </Box>
  )
}

export default LoggedInContainer
