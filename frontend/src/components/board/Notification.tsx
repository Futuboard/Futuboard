import Alert, { AlertColor } from "@mui/material/Alert"
import LinearProgress from "@mui/material/LinearProgress"
import { useEffect, useState } from "react"

import { setNotification } from "@/state/notification"
import { store } from "@/state/store"

const fullNotifcationTime = 5000

const Notification = () => {
  const [notificationText, setNotificationText] = useState("")
  const [noticationColor, setNotificationColor] = useState<AlertColor>("info")
  const [notificationTime, setNotificationTime] = useState<number>(0)
  const [intervalId, setIntervalId] = useState<number | null>(null)

  store.subscribe(() => {
    const newText = store.getState().notification.text
    if (newText === notificationText) {
      return
    }

    setNotificationText(newText)
    setNotificationColor(store.getState().notification.type as AlertColor)
    setNotificationTime(fullNotifcationTime)
  })

  const closeNotification = () => {
    store.dispatch(setNotification({ text: "", type: "info" }))
    if (intervalId) {
      clearInterval(intervalId)
    }
  }

  useEffect(() => {
    // The Mui Alert component transitions with a delay, so the -500 ms makes the notification only dissapear when the bar is visibly at 0%
    if (notificationTime <= -500) {
      closeNotification()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationTime])

  useEffect(() => {
    if (!notificationText) {
      return
    }

    const newInterValId = setInterval(() => {
      setNotificationTime((oldTime) => oldTime - 20)
    }, 20)
    setIntervalId(newInterValId)
    return () => {
      clearInterval(newInterValId)
    }
  }, [notificationText])

  if (!notificationText) {
    return null
  }

  return (
    <Alert
      severity={noticationColor}
      onClose={closeNotification}
      sx={{ position: "fixed", top: 65, right: 0, zIndex: 9999 }}
    >
      {notificationText}
      <LinearProgress
        variant="determinate"
        color={noticationColor}
        value={(notificationTime * 100) / fullNotifcationTime}
        sx={{ marginTop: 1 }}
      />
    </Alert>
  )
}

export default Notification
