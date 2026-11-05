/** Components of the ticket editor dock, see ticketEditorDock.ts. */
import { Draggable, DraggableProvided } from "@hello-pangea/dnd"
import { OpenInFull } from "@mui/icons-material"
import { Box, Paper, Portal } from "@mui/material"
import React, { useCallback, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import {
  BOARD_TOOLBAR_HEIGHT,
  DOCKED_EDITOR_BOTTOM_GAP,
  DOCKED_EDITOR_DRAGGABLE_ID,
  DOCKED_EDITOR_MARGIN,
  DOCKED_EDITOR_MAX_WIDTH,
  DOCKED_EDITOR_MIN_WIDTH,
  DOCKED_EDITOR_RIGHT_GAP,
  DOCKED_EDITOR_STICKY_TOP,
  DOCKED_EDITOR_WIDTH,
  FLOATING_EDITOR_MARGIN,
  FLOATING_EDITOR_MIN_HEIGHT,
  FLOATING_EDITOR_MIN_VISIBLE,
  FLOATING_EDITOR_MIN_WIDTH,
  FLOATING_EDITOR_HEIGHT,
  FLOATING_EDITOR_WIDTH,
  KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE,
  TICKET_EDITOR_DRAG_HANDLE_ATTRIBUTE,
  TICKET_EDITOR_MIN_DESCRIPTION_HEIGHT,
  TICKET_EDITOR_PANEL_ATTRIBUTE,
  FLOATING_EDITOR_GRIP_ROOM,
  TicketEditorDockContext,
  TicketEditorDockState,
  TicketEditorDragHandleContext,
  TicketEditorSizeContext,
  useTicketEditorDock,
  useTicketEditorSizes
} from "./ticketEditorDock"

export const TicketEditorDockProvider: React.FC<{ children: React.ReactNode; state: TicketEditorDockState }> = ({
  children,
  state
}) => (
  <TicketEditorDockContext.Provider value={state.dockValue}>
    <TicketEditorSizeContext.Provider value={state.sizeValue}>
      <TicketEditorDragHandleContext.Provider value={state.dragHandle}>
        {children}
      </TicketEditorDragHandleContext.Provider>
    </TicketEditorSizeContext.Provider>
  </TicketEditorDockContext.Provider>
)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Follows the pointer from a pointerdown until it is released, reporting the distance moved. Returns false
 * (and does nothing) for buttons other than the main one.
 */
const followPointer = (event: React.PointerEvent<HTMLElement>, onMove: (dx: number, dy: number) => void) => {
  if (event.button !== 0) return false
  event.preventDefault() // no text selection while dragging
  event.stopPropagation()
  const element = event.currentTarget
  const startX = event.clientX
  const startY = event.clientY
  element.setPointerCapture(event.pointerId)
  const move = (moveEvent: PointerEvent) => {
    // The release can be missed (e.g. the capture was lost): a plain hover must not keep resizing
    if (moveEvent.buttons === 0) {
      end()
      return
    }
    onMove(moveEvent.clientX - startX, moveEvent.clientY - startY)
  }
  const end = () => {
    element.removeEventListener("pointermove", move)
    element.removeEventListener("pointerup", end)
    element.removeEventListener("pointercancel", end)
    element.removeEventListener("lostpointercapture", end)
  }
  element.addEventListener("pointermove", move)
  element.addEventListener("pointerup", end)
  element.addEventListener("pointercancel", end)
  element.addEventListener("lostpointercapture", end)
  return true
}

/** Side or corner of an editor frame, by compass direction: "e" is the right edge, "se" the bottom right corner. */
type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

/** Width of the invisible strip that resizes a frame, centred on its edge. */
const RESIZE_HANDLE_THICKNESS = 12

const RESIZE_CURSORS: Record<ResizeEdge, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize"
}

/**
 * Invisible strip centred on an edge, or square on a corner, of an editor frame. Hovering it shows the
 * resize cursor; nothing else is drawn.
 */
const ResizeHandle: React.FC<{
  edge: ResizeEdge
  label: string
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
}> = ({ edge, label, onPointerDown }) => {
  const reach = RESIZE_HANDLE_THICKNESS / 2 // as far outside the frame as inside
  const corner = edge.length === 2
  const placement: Record<string, string | number> = {}
  if (edge.includes("n")) placement.top = `-${reach}px`
  if (edge.includes("s")) placement.bottom = `-${reach}px`
  if (edge.includes("e")) placement.right = `-${reach}px`
  if (edge.includes("w")) placement.left = `-${reach}px`
  if (corner) {
    placement.width = placement.height = `${2 * RESIZE_HANDLE_THICKNESS}px`
  } else if (edge === "e" || edge === "w") {
    Object.assign(placement, { top: 0, bottom: 0, width: `${RESIZE_HANDLE_THICKNESS}px` })
  } else {
    Object.assign(placement, { left: 0, right: 0, height: `${RESIZE_HANDLE_THICKNESS}px` })
  }
  return (
    <Box
      role="separator"
      aria-label={label}
      title={label}
      onPointerDown={onPointerDown}
      sx={{
        position: "absolute",
        zIndex: corner ? 3 : 2,
        touchAction: "none",
        cursor: RESIZE_CURSORS[edge],
        ...placement
      }}
    />
  )
}

/** Visible grip just outside the floating editor's bottom right corner: press and drag to resize. */
const ResizeGrip: React.FC<{ onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void }> = ({
  onPointerDown
}) => (
  <Box
    role="separator"
    aria-label="Drag to resize"
    title="Drag to resize"
    onPointerDown={onPointerDown}
    sx={{
      position: "absolute",
      right: "-26px",
      bottom: "-26px",
      width: "22px",
      height: "22px",
      zIndex: 3,
      touchAction: "none",
      cursor: "nwse-resize",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      backgroundColor: "white",
      color: "rgba(0, 0, 0, 0.6)",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.3)",
      "&:hover": { color: "rgba(0, 0, 0, 0.87)" }
    }}
  >
    {/* the diagonal arrows run from top left to bottom right, like the resize */}
    <OpenInFull sx={{ fontSize: "14px", transform: "rotate(90deg)" }} />
  </Box>
)

/**
 * Space in the board's row of columns that holds the docked ticket editor. It is a Draggable like the
 * columns: the editor's title row is its drag handle, so it can be moved between any columns.
 */
const DockedEditorSlot: React.FC<{ provided: DraggableProvided }> = ({ provided }) => {
  const { setSlot, setDragHandle } = useTicketEditorDock()
  const { dockedWidth } = useTicketEditorSizes()
  const { innerRef } = provided
  const ref = useCallback(
    (element: HTMLElement | null) => {
      innerRef(element)
      setSlot(element)
    },
    [innerRef, setSlot]
  )
  // The handle props only change with the drag-and-drop context
  const handleContextId = provided.dragHandleProps?.["data-rfd-drag-handle-context-id"]
  useLayoutEffect(() => {
    setDragHandle(provided.dragHandleProps ?? null)
    return () => setDragHandle(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleContextId, setDragHandle])

  return (
    <Box
      ref={ref}
      {...provided.draggableProps}
      data-docked-editor-slot
      sx={{
        position: "relative",
        flexShrink: 0,
        width: `${dockedWidth}px`,
        marginX: `${DOCKED_EDITOR_MARGIN}px`
      }}
    >
      {/* The real handle is the editor's title row, which arrives in the slot a moment later; the library
          checks for a handle in its Draggable as soon as it mounts, so keep an empty one here. After a
          keyboard drag the library focuses the first handle it finds, this one: pass focus to the title row. */}
      <Box
        {...provided.dragHandleProps}
        tabIndex={-1}
        aria-hidden
        onFocus={(event) =>
          event.currentTarget.parentElement
            ?.querySelector<HTMLElement>(`[${TICKET_EDITOR_DRAG_HANDLE_ATTRIBUTE}]`)
            ?.focus()
        }
        sx={{ position: "absolute", width: 0, height: 0 }}
      />
    </Box>
  )
}

/** The docked editor's place among the board's columns (see dockedEditorIndex). */
export const DockedEditorDraggable: React.FC<{ index: number }> = ({ index }) => (
  <Draggable draggableId={DOCKED_EDITOR_DRAGGABLE_ID} index={index}>
    {(provided) => <DockedEditorSlot provided={provided} />}
  </Draggable>
)

/** The nearest ancestor that scrolls horizontally: the board. */
const horizontalScrollParent = (element: HTMLElement) => {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const overflowX = getComputedStyle(parent).overflowX
    if (overflowX === "auto" || overflowX === "scroll") return parent
  }
  return null
}

/**
 * The docked editor's frame, rendered into the slot. It takes the slot's height, which the row of the
 * board gives it (the swimlane board, or the column card), without adding to it, and sticks to the top
 * of the board when it scrolls down. Its right edge adjusts its width.
 *
 * When docked, its width fits the space left on screen with the board scrolled to its start, so
 * everything left of it (notes, columns, an opened swimlane board) stays in view. If there isn't enough
 * room, it gets its minimum width and the board scrolls just enough to show it.
 */
export const DockedEditorFrame: React.FC<{ slot: HTMLElement; hostRef: (element: HTMLElement | null) => void }> = ({
  slot,
  hostRef
}) => {
  const { onBoardPush } = useTicketEditorDock()
  const { dockedWidth, setDockedWidth } = useTicketEditorSizes()
  const dockedWidthRef = useRef(dockedWidth)
  dockedWidthRef.current = dockedWidth

  /**
   * Fits the width to the space on screen (at most maxWidth) and scrolls the board just enough to show it.
   * boardShift: how far the slot is about to move (see BoardPushListener), so the width is fitted to where
   * it ends up and can animate along with it. Returns the new width.
   * scroll: also scroll the board just enough to show the editor (with the board scrolled to its start).
   */
  const fitToScreen = useCallback(
    (maxWidth: number, boardShift = 0, scroll = true) => {
      const board = horizontalScrollParent(slot)
      if (!board) {
        slot.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
        return dockedWidthRef.current
      }
      const viewRight = board.getBoundingClientRect().left + board.clientWidth
      // where the slot is (or will be) with the board scrolled to its start
      const slotLeft = slot.getBoundingClientRect().left + board.scrollLeft + boardShift
      const width = Math.round(
        clamp(
          viewRight - slotLeft - DOCKED_EDITOR_RIGHT_GAP,
          DOCKED_EDITOR_MIN_WIDTH,
          Math.max(DOCKED_EDITOR_MIN_WIDTH, maxWidth)
        )
      )
      setDockedWidth(width)
      if (scroll) {
        board.scrollTo({
          left: Math.max(0, slotLeft + width + DOCKED_EDITOR_RIGHT_GAP - viewRight),
          behavior: "smooth"
        })
      }
      return width
    },
    [slot, setDockedWidth]
  )

  // Fitted when docked; afterwards the width is the user's to adjust
  useLayoutEffect(() => {
    fitToScreen(DOCKED_EDITOR_WIDTH)
  }, [fitToScreen])

  // When something left of the editor pushes the board right (the notes panel, a column's swimlanes),
  // the editor shrinks (never grows) to stay on screen. When it moves back, the editor grows back to the
  // width it had before, as far as the screen allows. The width changes along with the push, with the
  // same duration and easing.
  const clearTransition = useRef<ReturnType<typeof setTimeout>>()
  const stopWidthTransition = useCallback(() => {
    clearTimeout(clearTransition.current)
    slot.style.transition = ""
  }, [slot])
  // the slot can outlive this editor (another ticket docks into it): don't leave the transition behind
  useLayoutEffect(() => stopWidthTransition, [stopWidthTransition])

  const widthBeforePush = useRef<number | null>(null)
  useLayoutEffect(
    () =>
      onBoardPush((source, shift, durationMs) => {
        // only what comes before the editor on the board moves it
        if (source && !(source.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING)) return
        // shortcut: the target is where the slot is now plus the shift, so a second push while the first is
        // still moving can under-fit; the next undo gives the width back
        stopWidthTransition()
        slot.style.transition = `width ${durationMs}ms ease`
        if (shift > 0) {
          widthBeforePush.current ??= dockedWidthRef.current
          fitToScreen(dockedWidthRef.current, shift, false)
        } else if (widthBeforePush.current !== null) {
          const width = fitToScreen(widthBeforePush.current, shift, false)
          if (width >= widthBeforePush.current) widthBeforePush.current = null
        }
        // only these width changes animate; drags by hand follow the pointer directly. Once the board has
        // moved (and can scroll that far), bring the editor into view if it ended up off screen.
        clearTransition.current = setTimeout(() => {
          slot.style.transition = ""
          const board = horizontalScrollParent(slot)
          if (!board) return
          const viewRight = board.getBoundingClientRect().left + board.clientWidth
          const overflow = slot.getBoundingClientRect().right + DOCKED_EDITOR_RIGHT_GAP - viewRight
          if (overflow > 0) board.scrollTo({ left: board.scrollLeft + overflow, behavior: "smooth" })
        }, durationMs + 50)
      }),
    [onBoardPush, slot, fitToScreen, stopWidthTransition]
  )

  const handleResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    stopWidthTransition() // a drag right after a push follows the pointer, not an animation
    const startWidth = dockedWidth
    followPointer(event, (dx) =>
      setDockedWidth(Math.round(clamp(startWidth + dx, DOCKED_EDITOR_MIN_WIDTH, DOCKED_EDITOR_MAX_WIDTH)))
    )
  }

  return createPortal(
    <Box sx={{ position: "absolute", inset: 0 }} {...{ [KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE]: "" }}>
      <Box
        sx={{
          position: "sticky",
          top: `${DOCKED_EDITOR_STICKY_TOP}px`,
          height: "100%",
          maxHeight: `calc(100vh - ${BOARD_TOOLBAR_HEIGHT + DOCKED_EDITOR_STICKY_TOP + DOCKED_EDITOR_BOTTOM_GAP}px)`
        }}
      >
        <Paper
          elevation={4}
          {...{ [TICKET_EDITOR_PANEL_ATTRIBUTE]: "docked" }}
          sx={{
            [`& [${TICKET_EDITOR_DRAG_HANDLE_ATTRIBUTE}]`]: { cursor: "grab" },
            boxSizing: "border-box",
            height: "100%",
            overflowY: "auto",
            padding: "20px",
            border: "2px solid #000",
            borderBottom: "5px solid #000",
            borderColor: "rgba(0, 0, 0, 0.12)"
          }}
        >
          <div ref={hostRef} />
        </Paper>
        <ResizeHandle edge="e" label="Drag to adjust the width" onPointerDown={handleResizeStart} />
      </Box>
    </Box>,
    slot
  )
}

const isInteractive = (element: Element) =>
  Boolean(element.closest("button, a, input, textarea, select, [contenteditable='true'], [role='button']"))

/**
 * Smallest height of the floating frame that shows the whole form with the description at its minimum, so
 * the frame itself never needs a second scrollbar next to the description's.
 */
const smallestFormHeight = (frame: HTMLElement, frameHeight: number) => {
  const panel = frame.querySelector<HTMLElement>(`[${TICKET_EDITOR_PANEL_ATTRIBUTE}]`)
  const editable = panel?.querySelector<HTMLElement>(".md-editor-contenteditable-description")
  if (!panel || !editable) return FLOATING_EDITOR_MIN_HEIGHT
  const content = panel.scrollHeight + (frameHeight - panel.clientHeight) // content, padding and borders
  return Math.max(
    FLOATING_EDITOR_MIN_HEIGHT,
    Math.ceil(content - editable.offsetHeight + TICKET_EDITOR_MIN_DESCRIPTION_HEIGHT)
  )
}

const FLOATING_RESIZE_EDGES: ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"]

/**
 * The floating editor's frame: an overlay over the board that doesn't dim or block it. Drag it by its
 * title row, resize it freely from any edge or corner, within the screen; it stays partly on screen. It
 * starts centred with a fixed size (FLOATING_EDITOR_WIDTH x FLOATING_EDITOR_HEIGHT, at most the screen),
 * which doesn't follow its content: the description fills the height, so the buttons stay at the bottom.
 * The size it is given is kept for the next ticket opened on the board.
 */
export const FloatingEditorFrame: React.FC<{ hostRef: (element: HTMLElement | null) => void }> = ({ hostRef }) => {
  const { floatingSize, setFloatingSize } = useTicketEditorSizes()
  // Top-left corner once moved or resized; centred until then
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const handleMoveStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as Element
    if (!target.closest(`[${TICKET_EDITOR_DRAG_HANDLE_ATTRIBUTE}]`) || isInteractive(target)) return
    const rect = frameRef.current!.getBoundingClientRect()
    followPointer(event, (dx, dy) =>
      setPosition({
        // keep the title row reachable and some of the editor on screen
        left: clamp(
          rect.left + dx,
          FLOATING_EDITOR_MIN_VISIBLE - rect.width,
          window.innerWidth - FLOATING_EDITOR_MIN_VISIBLE
        ),
        top: clamp(rect.top + dy, 0, window.innerHeight - 48)
      })
    )
  }

  const handleResizeStart = (edge: ResizeEdge) => (event: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current!
    const rect = frame.getBoundingClientRect()
    const margin = FLOATING_EDITOR_MARGIN
    const moved = followPointer(event, (dx, dy) => {
      // re-measured on every move: a narrower frame wraps the title and Name more
      const minHeight = smallestFormHeight(frame, frame.offsetHeight)
      let { left, top, width, height } = rect
      if (edge.includes("e"))
        // the minimum wins when the editor sits near the screen edge
        width = clamp(
          rect.width + dx,
          FLOATING_EDITOR_MIN_WIDTH,
          Math.max(FLOATING_EDITOR_MIN_WIDTH, window.innerWidth - FLOATING_EDITOR_GRIP_ROOM - left)
        )
      if (edge.includes("w")) {
        left = clamp(rect.left + dx, Math.min(margin, rect.left), rect.right - FLOATING_EDITOR_MIN_WIDTH)
        width = rect.right - left
      }
      if (edge.includes("s")) {
        height = clamp(
          rect.height + dy,
          minHeight,
          Math.max(minHeight, window.innerHeight - FLOATING_EDITOR_GRIP_ROOM - top)
        )
      }
      if (edge.includes("n")) {
        top = clamp(rect.top + dy, Math.min(margin, rect.top), rect.bottom - minHeight)
        height = rect.bottom - top
      }
      // the title row (the move handle) stays on screen; any edge may need more height for the form
      top = Math.max(0, top)
      height = Math.max(height, minHeight)
      setPosition({ left, top })
      setFloatingSize({
        width: Math.round(width),
        height: Math.round(height)
      })
    })
    // from now on placed by its top-left corner, so resizing doesn't move the opposite edges
    if (moved) setPosition({ left: rect.left, top: rect.top })
  }

  const size = floatingSize ?? { width: FLOATING_EDITOR_WIDTH, height: FLOATING_EDITOR_HEIGHT }

  // After any size change, with the layout up to date: a form that needs more height (e.g. a title that
  // wraps more in a narrower frame) gets it, so the frame never scrolls next to the description
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const minHeight = smallestFormHeight(frame, frame.offsetHeight)
    if (size.height < minHeight) setFloatingSize({ width: size.width, height: minHeight })
  }, [size.width, size.height, setFloatingSize])
  return (
    <Portal>
      <Box
        ref={frameRef}
        onPointerDown={handleMoveStart}
        {...{ [KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE]: "" }}
        sx={{
          position: "fixed",
          ...(position
            ? { left: `${position.left}px`, top: `${position.top}px` }
            : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }),
          zIndex: (theme) => theme.zIndex.modal,
          width: `${size.width}px`,
          // room for the resize grip outside the bottom right corner, also when centred
          maxWidth: `calc(100vw - ${2 * FLOATING_EDITOR_GRIP_ROOM}px)`,
          height: `${size.height}px`,
          maxHeight: `calc(100vh - ${2 * FLOATING_EDITOR_GRIP_ROOM}px)`,
          display: "flex",
          [`& [${TICKET_EDITOR_DRAG_HANDLE_ATTRIBUTE}]`]: { cursor: "move", userSelect: "none" }
        }}
      >
        <Paper
          elevation={24}
          {...{ [TICKET_EDITOR_PANEL_ATTRIBUTE]: "floating" }}
          sx={{
            boxSizing: "border-box",
            width: "100%",
            overflowY: "auto",
            padding: "20px"
          }}
        >
          <div ref={hostRef} />
        </Paper>
        {FLOATING_RESIZE_EDGES.map((edge) => (
          <ResizeHandle key={edge} edge={edge} label="Drag to resize" onPointerDown={handleResizeStart(edge)} />
        ))}
        <ResizeGrip onPointerDown={handleResizeStart("se")} />
      </Box>
    </Portal>
  )
}
