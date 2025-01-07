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

  public connectToBoard(boardId: string, waitTime: number = 0) {
    const isDifferentBoard = this.lastBoardId !== boardId

    if (isDifferentBoard) {
      this.close()
      this.socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_ADDRESS + boardId)
      this.lastBoardId = boardId
      this.socket.onclose = () => {
        // Attempt to reconnect, if disconnects and same board
        if (this.lastBoardId == boardId) {
          this.lastBoardId = ""

          // Added wait time, so we don't spam reconnects
          const newWaitTime = waitTime + 1000
          setTimeout(() => this.connectToBoard(boardId, newWaitTime), newWaitTime)
        }
      }
      setTimeout(() => this.close(), 30_000)
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
