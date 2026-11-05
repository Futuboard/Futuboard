import "@mdxeditor/editor/style.css"
import {
  CreateLink,
  linkDialogPlugin,
  linkPlugin,
  MDXEditor,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  CodeToggle,
  InsertTable,
  tablePlugin,
  listsPlugin,
  quotePlugin,
  headingsPlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  ListsToggle,
  Separator
} from "@mdxeditor/editor"
import { Box } from "@mui/material"
import React, { useLayoutEffect, useRef } from "react"

import { TICKET_EDITOR_MIN_DESCRIPTION_HEIGHT, TICKET_EDITOR_PANEL_ATTRIBUTE } from "./ticketEditorDock"

interface DescriptionEditFieldProps {
  description: string
  onChange: (markdown: string) => void
  /** Change it when the field moves to another frame (e.g. the ticket editor is docked) to refit it. */
  layoutKey?: string
}

const DEFAULT_EDITOR_HEIGHT = 330
const MIN_EDITOR_HEIGHT = 120

const px = (value: string) => parseFloat(value) || 0

/** Max height of a dialog paper in px. MUI sets it as calc(100% - Npx) of the dialog container. */
const maxPaperHeight = (paper: HTMLElement, container: HTMLElement) => {
  const style = getComputedStyle(paper)
  const byMargins = container.clientHeight - px(style.marginTop) - px(style.marginBottom)
  const maxHeight = style.maxHeight
  const calc = /calc\(100% - ([\d.]+)px\)/.exec(maxHeight)
  if (calc) return Math.min(byMargins, container.clientHeight - parseFloat(calc[1]))
  if (maxHeight.endsWith("px")) return Math.min(byMargins, parseFloat(maxHeight))
  return byMargins
}

interface FitTarget {
  /** The frame the field is in; it may be left behind (detached) while the field moves to another one */
  frame: HTMLElement
  /** Elements whose size changes call for a refit */
  observed: HTMLElement[]
  /** Height the editor may take, given its current height */
  availableHeight: (editable: HTMLElement) => number
  /** The editor fills all of its space instead of growing with its text */
  fill: boolean
  /** Smallest editor height */
  minHeight: number
}

/** A ticket editor frame (ticketEditorDock): it has a fixed height, which the editor fills. */
const ticketEditorFitTarget = (box: HTMLElement, placement: string | undefined): FitTarget | null => {
  const panel = box.closest<HTMLElement>(`[${TICKET_EDITOR_PANEL_ATTRIBUTE}]`)
  const form = box.closest<HTMLElement>("form")
  // While docking, the field can still sit in the old floating frame, detached from the page
  if (!panel || !form || panel.getAttribute(TICKET_EDITOR_PANEL_ATTRIBUTE) !== placement) return null
  return {
    frame: panel,
    observed: [box, panel, ...Array.from(form.querySelectorAll<HTMLElement>(":scope > * > *"))],
    availableHeight: (editable) => {
      const style = getComputedStyle(panel)
      const chrome =
        px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth)
      // The room the form takes in the panel, measured from the panel's content top: not offsetHeight,
      // which includes the form grid's negative top margin that collapses out of the form
      const contentTop = panel.getBoundingClientRect().top + px(style.borderTopWidth) + px(style.paddingTop)
      const formRoom = form.getBoundingClientRect().bottom - contentTop + panel.scrollTop
      // Everything in the form except the editor's own height; doesn't depend on the editor height
      const otherContent = formRoom - editable.offsetHeight
      return Math.floor(panel.offsetHeight - chrome - otherContent)
    },
    fill: true,
    minHeight: TICKET_EDITOR_MIN_DESCRIPTION_HEIGHT
  }
}

/** A MUI dialog: the paper grows up to its max height. */
const dialogFitTarget = (box: HTMLElement): FitTarget | null => {
  const paper = box.closest<HTMLElement>(".MuiDialog-paper")
  const scroller = box.closest<HTMLElement>(".MuiDialogContent-root")
  const container = paper?.parentElement
  if (!paper || !scroller || !container) return null
  return {
    observed: [box, container, ...Array.from(scroller.children as HTMLCollectionOf<HTMLElement>)],
    availableHeight: (editable) => {
      // Everything in the dialog except the editor's own height; doesn't depend on the editor height
      const otherContent = scroller.scrollHeight - editable.offsetHeight
      const outsideScroller = paper.offsetHeight - scroller.clientHeight
      return Math.floor(maxPaperHeight(paper, container) - outsideScroller - otherContent)
    },
    frame: paper,
    fill: false,
    minHeight: MIN_EDITOR_HEIGHT
  }
}

/**
 * Inside a dialog, let the editor grow with its text until the dialog reaches the screen height; inside a
 * ticket editor frame, fill the frame's height. Beyond that only the editor scrolls: the rest of the form
 * (and its buttons) stays visible.
 */
const useFitEditorToFrame = (boxRef: React.RefObject<HTMLElement>, layoutKey: string | undefined) => {
  useLayoutEffect(() => {
    let observer: ResizeObserver | null = null
    let frame = 0
    let attempts = 0
    let cleanupResize = () => {}

    const setUp = () => {
      const box = boxRef.current
      const target = box && (layoutKey ? ticketEditorFitTarget(box, layoutKey) : dialogFitTarget(box))
      if (!box || !target || !target.frame.isConnected) {
        // The form may be moving into its frame (docking): try again on the next frames
        if (box && attempts++ < 30) frame = requestAnimationFrame(setUp)
        return
      }
      const fit = () => {
        if (!target.frame.isConnected) return
        const editable = box.querySelector<HTMLElement>(".md-editor-contenteditable-description")
        if (!editable) return
        const maxHeight = Math.max(target.minHeight, target.availableHeight(editable))
        editable.style.maxHeight = `${maxHeight}px`
        editable.style.minHeight = `${target.fill ? maxHeight : Math.min(DEFAULT_EDITOR_HEIGHT, maxHeight)}px`
        editable.style.boxSizing = "border-box"
      }
      fit()
      // Refit when the editor, the frame, the viewport or any other part of the form (e.g. a growing Name
      // field or validation text) changes size
      observer = new ResizeObserver(fit)
      target.observed.forEach((element) => observer?.observe(element))
      window.addEventListener("resize", fit)
      cleanupResize = () => window.removeEventListener("resize", fit)
    }

    setUp()
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      cleanupResize()
    }
  }, [boxRef, layoutKey])
}

const DescriptionEditField: React.FC<DescriptionEditFieldProps> = ({ description, onChange, layoutKey }) => {
  const boxRef = useRef<HTMLDivElement>(null)
  useFitEditorToFrame(boxRef, layoutKey)

  return (
    <Box
      ref={boxRef}
      className="description"
      sx={{
        border: "none",
        borderRadius: "3pt",
        outlineStyle: "solid",
        outlineColor: "#c4c4c4",
        outlineWidth: "1px",
        "&:hover": {
          outlineColor: "#1a1a1a"
        },
        "&:focus-within": {
          outlineColor: "#1976d2",
          outlineWidth: "2px"
        }
      }}
    >
      <MDXEditor
        placeholder="Description"
        markdown={description}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <Separator />
                <CodeToggle />
                <InsertTable />
              </>
            )
          }),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          listsPlugin(),
          quotePlugin(),
          headingsPlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin()
        ]}
        onChange={(markdown) => onChange(markdown)}
        contentEditableClassName="md-editor-contenteditable-description"
      />
    </Box>
  )
}

export default DescriptionEditField
