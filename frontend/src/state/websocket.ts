import { getId } from "@/services/utils"
import { CacheInvalidationTag } from "@/types"

type CacheInvalidationMessage = {
  clientId: string
  tags: CacheInvalidationTag[]
}
class WebSocketContainer {
  private socket: WebSocket | null
  private clientId: string
  private boardId: string
  private onMessageHandler: (event: MessageEvent) => void
  private onResetHandler: () => void
  private sendNotification: (message: string) => void
  private lastConnectionFailed: boolean

  constructor() {
    this.clientId = getId()
    this.socket = null
    this.boardId = ""
    this.onMessageHandler = () => null
    this.onResetHandler = () => null
    this.sendNotification = () => null
    this.lastConnectionFailed = false

    // Automatically reconnect to the websocket if the connection is lost. Check every 10 seconds.
    setInterval(async () => {
      if (
        !this.socket ||
        (this.socket.readyState !== WebSocket.OPEN && this.socket.readyState !== WebSocket.CONNECTING)
      ) {
        // This notification was mostly just annoying, and doesn't really matter to the user, so disabled it for now.
        // this.sendNotification("Board connection interrupted. Reconnecting automatically...")
        try {
          this.socket = await this.getNewWebSocket()
          this.socket.onmessage = this.onMessageHandler
          this.onResetHandler()
        } catch (error) {
          // Send notification only if if notification fails twice in a row.
          if (this.lastConnectionFailed) {
            this.sendNotification("Failed to connect to the board. Please check your internet connection.")
          } else {
            this.lastConnectionFailed = true
          }
        }
      }
    }, 10_000)
  }

  public async connectToBoard(newBoardId: string) {
    const isDifferentBoard = this.boardId !== newBoardId

    if (isDifferentBoard) {
      this.boardId = newBoardId
      this.socket = await this.getNewWebSocket()
    }
  }

  private async getNewWebSocket() {
    this.close()

    return new Promise<WebSocket>((resolve, reject) => {
      const newSocket = new WebSocket(import.meta.env.VITE_WEBSOCKET_ADDRESS + this.boardId)

      newSocket.onopen = () => {
        resolve(newSocket)
      }

      newSocket.onerror = (error) => {
        reject(error)
      }
    })
  }

  public close() {
    if (this.socket) {
      this.socket.close()
    }
  }

  public invalidateCacheOfOtherUsers(tags: CacheInvalidationTag[]) {
    if (this.socket) {
      const message: CacheInvalidationMessage = { clientId: this.clientId, tags }
      this.socket.send(JSON.stringify(message))
    }
  }

  public setOnMessageHandler(invalidateLocalCache: (tags: CacheInvalidationTag[]) => void) {
    this.onMessageHandler = (event) => {
      const data = JSON.parse(event.data)
      const { tags, clientId: messageClientId } = JSON.parse(data) as CacheInvalidationMessage

      if (messageClientId !== this.clientId) {
        invalidateLocalCache(tags)
      }
    }

    if (this.socket) {
      this.socket.onmessage = this.onMessageHandler
    }
  }

  public setResetHandler(resetHandler: () => void) {
    this.onResetHandler = resetHandler
  }

  public setSendNotificationHandler(sendNotification: (message: string) => void) {
    this.sendNotification = sendNotification
  }
}

export const webSocketContainer = new WebSocketContainer()
