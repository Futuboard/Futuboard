import Alert, { AlertColor } from "@mui/material/Alert"
import LinearProgress from "@mui/material/LinearProgress"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { setNotification } from "@/state/notification"
import { store, RootState } from "@/state/store"

const fullNotifcationTime = 5000

const Notification = () => {
  const [notificationTime, setNotificationTime] = useState<number>(fullNotifcationTime)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const notification = useSelector((state: RootState) => state.notification)

  const closeNotification = () => {
    store.dispatch(setNotification({ text: "", type: "info" }))
    if (intervalId) {
      clearInterval(intervalId)
    }
    setNotificationTime(fullNotifcationTime)
  }

  useEffect(() => {
    // The Mui Alert component transitions with a delay, so the -500 ms makes the notification only dissapear when the bar is visibly at 0%
    if (notificationTime <= -500) {
      closeNotification()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationTime])

  useEffect(() => {
    if (!notification.text) {
      return
    }

    setNotificationTime(fullNotifcationTime + 500)

    const newInterValId = setInterval(() => {
      setNotificationTime((oldTime) => oldTime - 200)
    }, 200)

    setIntervalId(newInterValId)

    return () => {
      clearInterval(newInterValId)
    }
  }, [notification])

  if (!notification.text) {
    return null
  }

  return (
    <Alert
      severity={notification.type as AlertColor}
      onClose={closeNotification}
      sx={{ position: "fixed", top: 65, right: 0, zIndex: 9999 }}
    >
      {notification.text}
      <LinearProgress
        variant="determinate"
        color={notification.type as AlertColor}
        value={Math.min((notificationTime * 100) / fullNotifcationTime, 100)}
        sx={{ marginTop: 1 }}
      />
    </Alert>
  )
}

export default Notification
