/**
 * Ticket editor placement: a floating overlay that can be dragged around and resized from any edge or
 * corner, or docked into the board's row of columns, pushing the columns to its right further right. It
 * docks right after the column of the ticket being edited and can then be dragged between any columns by
 * its title row, like a column. The docked editor's width fits the space left on screen when it is docked
 * or pushed, and can be adjusted by dragging its right edge (its height follows the board).
 *
 * Only one ticket editor can be docked at a time. The dock state comes from useTicketEditorDockState (one
 * per board, kept by BoardContainer) through TicketEditorDockProvider; Board renders the docked editor's
 * Draggable slot among the columns, and the ticket's Task renders the editor into that slot. The state
 * also remembers the sizes the editor was given while the board is open.
 */
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd"
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react"

import { BOARD_NOTES_OFFSET, BOARD_NOTES_TRANSITION_MS } from "@/constants"

/** Width of an opened swimlane board. */
export const SWIMLANE_BOARD_WIDTH = 900
/** Widest automatic width of the docked editor: the width of the opened swimlane board. */
export const DOCKED_EDITOR_WIDTH = SWIMLANE_BOARD_WIDTH
/** Narrowest frames in which the form fits without a horizontal scrollbar (the original popover width). */
export const DOCKED_EDITOR_MIN_WIDTH = 420
/** Space on each side of the docked editor, like a column card's. */
export const DOCKED_EDITOR_MARGIN = 20
/** Draggable id of the docked editor in the board's list of columns. */
export const DOCKED_EDITOR_DRAGGABLE_ID = "docked-ticket-editor"
/** Room kept on the right of the docked editor when it is fitted on screen (its width handle sits there). */
export const DOCKED_EDITOR_RIGHT_GAP = 24
export const DOCKED_EDITOR_MAX_WIDTH = 2400
/**
 * Distance kept from the top of the board's scroll area (under the toolbar) while the docked editor sticks
 * during vertical scroll: the board's top margin, so it starts level with the columns.
 */
export const DOCKED_EDITOR_STICKY_TOP = 25
/** Height of the fixed toolbar above the board's scroll area. */
export const BOARD_TOOLBAR_HEIGHT = 64
/** Space kept under the docked editor (the board's horizontal scrollbar). */
export const DOCKED_EDITOR_BOTTOM_GAP = 24
/** Margin between the floating editor and the screen edges. */
export const FLOATING_EDITOR_MARGIN = 8
/** Part of the floating editor that stays on screen when it is dragged towards an edge. */
export const FLOATING_EDITOR_MIN_VISIBLE = 80
/** Default size of the floating editor: 1.5 times as wide as the original ticket popover (400px), about
 * as high as it was. Smaller screens get at most the screen height. */
export const FLOATING_EDITOR_WIDTH = 600
export const FLOATING_EDITOR_HEIGHT = 760
export const FLOATING_EDITOR_MIN_WIDTH = 400
/** Room kept between the floating editor and the right and bottom screen edges, for its resize grip. */
export const FLOATING_EDITOR_GRIP_ROOM = 30
export const FLOATING_EDITOR_MIN_HEIGHT = 320
/**
 * Smallest height of the description editor in a ticket editor frame; below it, the form would need to
 * scroll as a whole. Low enough that the form fits a short laptop screen.
 */
export const TICKET_EDITOR_MIN_DESCRIPTION_HEIGHT = 64

/**
 * Elements with this attribute (the editor frames, the board notes panel and its button) don't close a
 * floating ticket editor when clicked, so the notes can be used beside it.
 */
export const KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE = "data-keep-ticket-editor-open"
/** Attribute on the editor's scrolling panel; its value is the placement, "floating" or "docked". */
export const TICKET_EDITOR_PANEL_ATTRIBUTE = "data-ticket-editor-panel"
/** Attribute on the part of the editor that drags a floating editor (its title row). */
export const TICKET_EDITOR_DRAG_HANDLE_ATTRIBUTE = "data-editor-drag-handle"

export type TicketEditorPlacement = "floating" | "docked"

export interface DockedTicket {
  ticketId: string
  columnId: string
  /** The column the editor stands after in the board (it can be moved like a column); null: before all */
  afterColumnId: string | null
}

/**
 * Index of the docked editor among the board's columns: after its column, or after the ticket's column
 * if that one is gone, or at the end.
 */
export const dockedEditorIndex = (columns: { columnid: string }[], docked: DockedTicket) => {
  if (docked.afterColumnId === null) return 0
  for (const columnId of [docked.afterColumnId, docked.columnId]) {
    const index = columns.findIndex((column) => column.columnid === columnId)
    if (index >= 0) return index + 1
  }
  return columns.length
}

/** Size given to the floating editor by hand. */
export interface FloatingEditorSize {
  width: number
  height: number
}

/**
 * Something left of the docked editor is about to move the board by `shift` px (positive: to the right)
 * with a CSS transition of `durationMs` ("ease"): the notes panel, or a column opening its swimlanes.
 * `source` is an element of the column that moves, or null for the whole board (the notes panel); the
 * docked editor only reacts when the source comes before it on the board.
 */
export type BoardPushListener = (source: HTMLElement | null, shift: number, durationMs: number) => void

/** Which ticket is docked and where: used by every Task and Column, so it changes rarely. */
export interface TicketEditorDockContextValue {
  docked: DockedTicket | null
  dock: (ticketId: string, columnId: string) => void
  /** Clears the dock if it still belongs to this ticket. */
  undock: (ticketId: string) => void
  /** Moves the docked editor after another column (null: before all) */
  moveDock: (afterColumnId: string | null) => void
  /** The docked editor's slot registers the drag handle props of its Draggable here */
  setDragHandle: (props: DraggableProvidedDragHandleProps | null) => void
  slot: HTMLElement | null
  setSlot: (element: HTMLElement | null) => void
  /** Tells the docked editor the board is about to move (stable function) */
  pushBoard: BoardPushListener
  /** Subscribes to board pushes; returns the unsubscribe function (stable function) */
  onBoardPush: (listener: BoardPushListener) => () => void
}

/**
 * Sizes of the editor frames: kept apart from the dock state because they change on every pointer move
 * while resizing, and only the frames and the slot use them, not the whole board.
 */
export interface TicketEditorSizeContextValue {
  dockedWidth: number
  setDockedWidth: (width: number) => void
  floatingSize: FloatingEditorSize | null
  setFloatingSize: (size: FloatingEditorSize) => void
}

const noop = () => {}

export const TicketEditorDockContext = createContext<TicketEditorDockContextValue>({
  docked: null,
  dock: noop,
  undock: noop,
  moveDock: noop,
  setDragHandle: noop,
  slot: null,
  setSlot: noop,
  pushBoard: noop,
  onBoardPush: () => noop
})

export const TicketEditorSizeContext = createContext<TicketEditorSizeContextValue>({
  dockedWidth: DOCKED_EDITOR_WIDTH,
  setDockedWidth: noop,
  floatingSize: null,
  setFloatingSize: noop
})

/** Drag handle props for the docked editor's title row (it moves the editor like a column header). */
export const TicketEditorDragHandleContext = createContext<DraggableProvidedDragHandleProps | null>(null)

export const useTicketEditorDock = () => useContext(TicketEditorDockContext)
export const useTicketEditorDragHandle = () => useContext(TicketEditorDragHandleContext)
export const useTicketEditorSizes = () => useContext(TicketEditorSizeContext)

/**
 * State of the ticket editor dock for one board. Kept by the board container, which also needs it when a
 * column or the docked editor is dropped, and handed to TicketEditorDockProvider.
 */
export const useTicketEditorDockState = (notesOpen: boolean) => {
  const [docked, setDocked] = useState<DockedTicket | null>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [dragHandle, setDragHandle] = useState<DraggableProvidedDragHandleProps | null>(null)
  const [dockedWidth, setDockedWidth] = useState(DOCKED_EDITOR_WIDTH)
  const [floatingSize, setFloatingSize] = useState<FloatingEditorSize | null>(null)

  const dock = useCallback(
    (ticketId: string, columnId: string) => setDocked({ ticketId, columnId, afterColumnId: columnId }),
    []
  )
  const undock = useCallback(
    (ticketId: string) => setDocked((current) => (current?.ticketId === ticketId ? null : current)),
    []
  )
  const moveDock = useCallback(
    (afterColumnId: string | null) => setDocked((current) => current && { ...current, afterColumnId }),
    []
  )

  const pushListeners = useRef(new Set<BoardPushListener>())
  const pushBoard = useCallback<BoardPushListener>(
    (source, shift, durationMs) => pushListeners.current.forEach((listener) => listener(source, shift, durationMs)),
    []
  )
  const onBoardPush = useCallback((listener: BoardPushListener) => {
    pushListeners.current.add(listener)
    return () => {
      pushListeners.current.delete(listener)
    }
  }, [])

  // The notes panel pushes the whole board right while it's open. Runs before the board's margin
  // transition has moved it, so the docked editor can measure where the board is now.
  const notesWereOpen = useRef(notesOpen)
  useLayoutEffect(() => {
    if (notesOpen === notesWereOpen.current) return
    notesWereOpen.current = notesOpen
    pushBoard(null, notesOpen ? BOARD_NOTES_OFFSET : -BOARD_NOTES_OFFSET, BOARD_NOTES_TRANSITION_MS)
  }, [notesOpen, pushBoard])

  const dockValue = useMemo(
    () => ({ docked, dock, undock, moveDock, setDragHandle, slot, setSlot, pushBoard, onBoardPush }),
    [docked, dock, undock, moveDock, slot, pushBoard, onBoardPush]
  )
  const sizeValue = useMemo(
    () => ({ dockedWidth, setDockedWidth, floatingSize, setFloatingSize }),
    [dockedWidth, floatingSize]
  )
  return { dockValue, sizeValue, dragHandle }
}

export type TicketEditorDockState = ReturnType<typeof useTicketEditorDockState>
