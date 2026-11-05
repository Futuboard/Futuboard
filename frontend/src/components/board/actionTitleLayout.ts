import { RefObject, useLayoutEffect, useState } from "react"

import { isDragInProgress } from "@/services/dragState"

import { COLLAPSED_TITLE_MAX_HEIGHT } from "./Action"

export interface ActionTitleLayout {
  /** Title line count per action id. Actions not listed keep the default truncation. */
  titleLines: Record<string, number>
  /** Outer height the cell would need to show every action with its full title. */
  fullHeight: number
  /** Width of the cell's vertical scrollbar, 0 when it doesn't scroll (or uses overlay scrollbars). */
  scrollbarWidth: number
  /** True when part of the cell is hidden: a truncated title or cards scrolled out of view. */
  hidesContent: boolean
}

// Slack for sub-pixel rounding, so expanding titles never adds a scrollbar
const ROUNDING_SLACK = 1

const px = (value: string) => parseFloat(value) || 0

/**
 * Hands out the free vertical space of a swimlane cell to its action titles.
 * First, every title that fits completely is expanded, in order. Then the space that is left goes
 * to the first remaining titles as whole extra lines. If the default (truncated) cards already
 * fill the cell, nothing changes and the cell scrolls as before.
 *
 * Every measurement is independent of the current allocation (full title height comes from
 * scrollHeight, card chrome is card height minus visible title height), so re-running it on its
 * own output gives the same result and can't oscillate.
 */
export const computeActionTitleLayout = (container: HTMLElement): ActionTitleLayout => {
  const containerStyle = getComputedStyle(container)
  const paddingY = px(containerStyle.paddingTop) + px(containerStyle.paddingBottom)
  const borderY = px(containerStyle.borderTopWidth) + px(containerStyle.borderBottomWidth)
  const borderX = px(containerStyle.borderLeftWidth) + px(containerStyle.borderRightWidth)
  const scrollbarWidth = Math.max(0, Math.round(container.offsetWidth - container.clientWidth - borderX))
  const available = container.clientHeight - paddingY

  const cards = Array.from(container.querySelectorAll<HTMLElement>(":scope > [data-action-card]"))

  let collapsedTotal = 0
  let fullTotal = 0
  const candidates: { id: string; collapsed: number; full: number; lineHeight: number }[] = []

  for (const card of cards) {
    const margin = px(getComputedStyle(card).marginTop) + px(getComputedStyle(card).marginBottom)
    const title = card.querySelector<HTMLElement>("[data-action-title]")
    if (!title) {
      // e.g. the card is in edit mode
      collapsedTotal += card.offsetHeight + margin
      fullTotal += card.offsetHeight + margin
      continue
    }
    const lineHeight = px(getComputedStyle(title).lineHeight)
    const full = title.scrollHeight
    const chrome = card.offsetHeight - title.offsetHeight + margin
    const hasUsers = card.dataset.actionHasUsers === "true"
    const collapsed = Math.min(full, hasUsers ? lineHeight : COLLAPSED_TITLE_MAX_HEIGHT)

    collapsedTotal += chrome + collapsed
    fullTotal += chrome + full
    const id = card.dataset.actionCard
    if (id && lineHeight > 0 && full - collapsed > 1) {
      candidates.push({ id, collapsed, full, lineHeight })
    }
  }

  const titleLines: Record<string, number> = {}
  let free = available - collapsedTotal - ROUNDING_SLACK

  if (free > 0) {
    for (const c of candidates) {
      const extra = c.full - c.collapsed
      if (extra <= free) {
        titleLines[c.id] = Infinity
        free -= extra
      }
    }
    for (const c of candidates) {
      if (titleLines[c.id] !== undefined) continue
      const lines = Math.floor((c.collapsed + free) / c.lineHeight)
      if (lines * c.lineHeight > c.collapsed + 1) {
        titleLines[c.id] = lines
        free -= lines * c.lineHeight - c.collapsed
      }
    }
  }

  // Include the slack, so a cell given exactly fullHeight really shows every title in full
  const hidesContent =
    container.scrollHeight > container.clientHeight + 1 || candidates.some((c) => titleLines[c.id] !== Infinity)

  return {
    titleLines,
    fullHeight: Math.ceil(fullTotal + paddingY + borderY + ROUNDING_SLACK) + 1,
    scrollbarWidth,
    hidesContent
  }
}

const layoutKey = (layout: ActionTitleLayout) => JSON.stringify(layout)

/**
 * Keeps the title layout of a swimlane cell up to date when its size, its cards or their content
 * change. `contentKey` should change whenever the actions in the cell change.
 */
export const useActionTitleLayout = (containerRef: RefObject<HTMLElement>, contentKey: string) => {
  const [layout, setLayout] = useState<ActionTitleLayout>({
    titleLines: {},
    fullHeight: 0,
    scrollbarWidth: 0,
    hidesContent: false
  })

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      if (isDragInProgress()) return
      const next = computeActionTitleLayout(container)
      setLayout((previous) => (layoutKey(previous) === layoutKey(next) ? previous : next))
    }

    update()
    // Watch the cell and its cards: covers swimlane resizes, edit mode, magnets and late font loads
    const observer = new ResizeObserver(update)
    observer.observe(container)
    container.querySelectorAll(":scope > [data-action-card]").forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [containerRef, contentKey])

  return layout
}
