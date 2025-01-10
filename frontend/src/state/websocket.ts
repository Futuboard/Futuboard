import { getId } from "@/services/Utils"
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

  constructor() {
    this.clientId = getId()
    this.socket = null
    this.boardId = ""
    this.onMessageHandler = () => null
    this.onResetHandler = () => null
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

    return new Promise<WebSocket>((resolve) => {
      const newSocket = new WebSocket(import.meta.env.VITE_WEBSOCKET_ADDRESS + this.boardId)

      newSocket.onopen = () => {
        resolve(newSocket)
      }
    })
  }

  private async getCurrentOrNewWebSocket() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.onResetHandler()
      const newSocket = await this.getNewWebSocket()
      newSocket.onmessage = this.onMessageHandler
      return newSocket
    }
    return this.socket
  }

  public close() {
    if (this.socket) {
      this.socket.close()
    }
  }

  public async invalidateCacheOfOtherUsers(tags: CacheInvalidationTag[]) {
    this.socket = await this.getCurrentOrNewWebSocket()
    const message: CacheInvalidationMessage = { clientId: this.clientId, tags }
    this.socket.send(JSON.stringify(message))
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
}

export const webSocketContainer = new WebSocketContainer()
