import { Box, GlobalStyles } from "@mui/material"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import AccessBoardForm from "@/components/board/AccessBoardForm"
import { cacheTagTypes } from "@/constants"
import { boardsApi, useGetBoardQuery, useLoginMutation } from "@/state/apiSlice"
import { getAuth, setBoardId } from "@/state/auth"
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

  const id = params.id || ""
  const { data: board, isLoading } = useGetBoardQuery(id || "", { skip: !id || !isBoardIdSet })
  const [isOpenInReadOnly, setIsOpenInReadOnly] = useState(false)

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

  if (isLoading || !board) {
    return null
  }

  const shouldShowContent = hasAuth || loginTryData?.success || isOpenInReadOnly

  return (
    <Box sx={{ height: "calc(100vh - 65px)", paddingTop: "65px" }}>
      <GlobalStyles styles={{ ":root": { backgroundColor: board.background_color || "white" } }} />
      {shouldShowContent ? (
        children({ board })
      ) : (
        <AccessBoardForm board={board} tryLogin={tryLogin} handleOpenInReadOnly={() => setIsOpenInReadOnly(true)} />
      )}
    </Box>
  )
}

export default LoggedInContainer
