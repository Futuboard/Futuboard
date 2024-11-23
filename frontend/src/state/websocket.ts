import { getId } from "@/services/Utils"
import { CacheInvalidationTag } from "@/types"

type CacheInvalidationMessage = {
  clientId: string
  tags: CacheInvalidationTag[]
}
class WebSocketContainer {
  private socket: WebSocket | null
  private clientId: string
  private lastBoardId: string

  constructor() {
    this.clientId = getId()
    this.socket = null
    this.lastBoardId = ""
  }

  public connectToBoard(boardId: string) {
    const isDifferentBoard = this.lastBoardId !== boardId

    if (isDifferentBoard) {
      if (this.socket) {
        this.socket.close()
      }
      this.socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_ADDRESS + boardId)
      this.lastBoardId = boardId
    }
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

  public onMessage(invalidateLocalCache: (tags: CacheInvalidationTag[]) => void) {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        const { tags, clientId: messageClientId } = JSON.parse(data) as CacheInvalidationMessage

        if (messageClientId !== this.clientId) {
          invalidateLocalCache(tags)
        }
      }
    }
  }
}

export const webSocketContainer = new WebSocketContainer()
