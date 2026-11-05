/**
 * Swimlane row heights. Rows have a default height; a cell whose actions don't fit shows a small square
 * ▲▼ button at the end of its scrollbar that grows that row until its actions show in full (at most the
 * screen height); the same button (now ▼▲) puts the row back. A small ▲▼ button at the top right of the
 * swimlane board shares the screen height between all rows of the column by how much each row needs, so
 * every row and its actions fit on screen; pressed again it restores the default heights.
 */

/**
 * Outer height of one swimlane row, which is also the height of one backlog card slot
 * (card 100px + padding, borders, margin and the List padding). Keeping these equal is what keeps
 * backlog cards aligned with their swimlane rows.
 */
export const DEFAULT_ROW_HEIGHT = 138
/** Vertical padding of a swimlane row around its action cells. */
export const ROW_VERTICAL_PADDING = 18
/** Backlog card height that corresponds to DEFAULT_ROW_HEIGHT. */
export const DEFAULT_CARD_HEIGHT = 100
/**
 * Smallest row height: enough for a one-line backlog card and one action with a name magnet in
 * each cell. Anything beyond that scrolls inside the cell.
 */
export const MIN_ROW_HEIGHT = 76
/** Width of the cells' scrollbar, and size of the square fit button at its end. */
export const CELL_SCROLLBAR_WIDTH = 14
/** Room kept under the content of a row fitted by its own button, for the restore button. */
export const FIT_BUTTON_ROOM = CELL_SCROLLBAR_WIDTH + 2

/** Space kept free under the rows when balancing (column border, horizontal scrollbar). */
const BALANCE_BOTTOM_GAP = 32

/** Height the rows may use together: from the top of the first row down to the bottom of the viewport. */
export const availableRowsHeight = (rowsTop: number, viewportHeight: number) =>
  // rows scrolled above the screen don't add room: a fitted row stays within the screen height
  Math.floor(viewportHeight - Math.max(0, rowsTop) - BALANCE_BOTTOM_GAP)

/**
 * Height of a row fitted by its own button: what it needs to show its actions in full plus room for the
 * restore button under them, at least the default height and at most the height the rows may use together.
 */
export const fitRowHeight = (neededHeight: number | undefined, budget: number) =>
  Math.max(
    DEFAULT_ROW_HEIGHT,
    Math.min(Math.ceil(neededHeight ?? DEFAULT_ROW_HEIGHT) + FIT_BUTTON_ROOM, Math.max(MIN_ROW_HEIGHT, budget))
  )

/** Largest integer level in [low, high] for which cost(level) <= budget (cost must be non-decreasing). */
const maxLevelWithin = (low: number, high: number, budget: number, cost: (level: number) => number) => {
  let best = low
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (cost(mid) <= budget) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return best
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

/**
 * Shares `budget` px between the rows by need (outer height that shows a row's actions in full).
 *  - Too little room: rows that need little get what they need (at least MIN_ROW_HEIGHT), the
 *    biggest rows are capped at one common height and scroll. If even MIN_ROW_HEIGHT for every row
 *    doesn't fit, every row gets MIN_ROW_HEIGHT.
 *  - Enough room: every row gets what it needs, and rows that need less than the default are raised
 *    back towards the default height with the space that is left.
 */
export const balanceRowHeights = (
  ticketIds: string[],
  neededHeights: Record<string, number>,
  budget: number
): Record<string, number> => {
  const needs = ticketIds.map((id) => Math.max(MIN_ROW_HEIGHT, Math.ceil(neededHeights[id] ?? DEFAULT_ROW_HEIGHT)))
  let heights: number[]

  if (sum(needs) > budget) {
    const level = maxLevelWithin(MIN_ROW_HEIGHT, Math.max(...needs), budget, (level) =>
      sum(needs.map((need) => Math.min(need, level)))
    )
    heights = needs.map((need) => Math.min(need, level))
  } else {
    const leftover = budget - sum(needs)
    const level = maxLevelWithin(MIN_ROW_HEIGHT, DEFAULT_ROW_HEIGHT, leftover, (level) =>
      sum(needs.map((need) => Math.max(0, level - need)))
    )
    heights = needs.map((need) => Math.max(need, level))
  }

  return Object.fromEntries(ticketIds.map((id, index) => [id, heights[index]]))
}
