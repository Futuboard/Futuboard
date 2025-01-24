import Alert from "@mui/material/Alert"
import { useState } from "react"

import { setNotification } from "@/state/notification"
import { store } from "@/state/store"

const Notification = () => {
  const [notificationText, setNotificationText] = useState("")

  store.subscribe(() => {
    setNotificationText(store.getState().notification.text)
    setTimeout(() => {
      setNotificationText("")
    }, 5000)
  })

  const closeNotification = () => {
    store.dispatch(setNotification({ text: "", type: "info" }))
  }

  if (!notificationText) {
    return null
  }

  return (
    <Alert severity="info" onClose={closeNotification} sx={{ position: "fixed", top: 65, right: 0, zIndex: 9999 }}>
      {notificationText}
    </Alert>
  )
}

export default Notification
