import { DraggableStateSnapshot, DraggableStyle } from "@hello-pangea/dnd"

// Tracks whether a drag-and-drop operation is in progress, so layout code can avoid
// changing element sizes mid-drag (@hello-pangea/dnd caches dimensions at drag start).
let dragInProgress = false

export const setDragInProgress = (value: boolean) => {
  dragInProgress = value
}

export const isDragInProgress = () => dragInProgress

/**
 * Style for user magnet Draggables that skips the drop animation (the magnet would otherwise fly
 * to a misleading spot). Keeps the library's transform and only shortens the transition, as the
 * @hello-pangea/dnd docs recommend: the library finishes a drop on the transform's transitionend.
 * Replacing the transform (the old `scale(0)` hack) left drops pending until the next scroll or
 * mouse move, so new magnets didn't show up locally or for other users until then.
 *
 * The magnet is also hidden while it settles: the drop target's spot the library moves it to isn't
 * where the magnet ends up (an action shows its magnets at the bottom right), so it would flash there
 * for a frame before appearing in its real place.
 */
export const skipDropAnimationStyle = (style: DraggableStyle | undefined, snapshot: DraggableStateSnapshot) => {
  if (!snapshot.isDropAnimating) {
    return style
  }
  return { ...style, transitionDuration: "0.001s", opacity: 0 }
}
