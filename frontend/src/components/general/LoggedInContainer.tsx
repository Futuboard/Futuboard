import { Box, GlobalStyles } from "@mui/material"
import { useEffect, useReducer, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import AccessBoardForm from "@/components/board/AccessBoardForm"
import { cacheTagTypes } from "@/constants"
import { boardsApi, useGetBoardQuery, useLoginMutation } from "@/state/apiSlice"
import { getAuth, getIsInReadMode, setBoardId, setIsInReadMode } from "@/state/auth"
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
  const [tryLogin, { data: loginTryData }] = useLoginMutation()
  const [, forceUpdateComponent] = useReducer((x) => x + 1, 0)

  const id = params.id || ""
  const { data: board, isLoading } = useGetBoardQuery(id || "", { skip: !id || !isBoardIdSet })

  const isInReadMode = getIsInReadMode(id)

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
    const prefix = titlePrefix ? titlePrefix + " - " : ""
    document.title = board?.title ? prefix + board?.title + " - Futuboard" : "Futuboard"
  }, [board, titlePrefix])

  const hasAuth = Boolean(getAuth(id))

  const handleOpenInReadOnly = () => {
    setIsInReadMode(id, true)

    // Force update the component to fetch new localstorage value
    forceUpdateComponent()
  }

  if (isLoading || !board || !id) {
    return null
  }

  const shouldShowContent = hasAuth || loginTryData?.success || isInReadMode || !board.needs_password

  return (
    <Box sx={{ height: "calc(100vh - 65px)", paddingTop: "65px" }}>
      <GlobalStyles styles={{ ":root": { backgroundColor: board.background_color || "white" } }} />
      {shouldShowContent ? (
        children({ board })
      ) : (
        <AccessBoardForm board={board} tryLogin={tryLogin} handleOpenInReadOnly={handleOpenInReadOnly} />
      )}
    </Box>
  )
}

export default LoggedInContainer
