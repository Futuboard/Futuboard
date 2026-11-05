import { Droppable } from "@hello-pangea/dnd"
import { Add, UnfoldLess, UnfoldMore } from "@mui/icons-material"
import { Box, IconButton, Paper, Popover, Tooltip } from "@mui/material"
import { useCallback, useEffect, useRef, useState } from "react"

import { getId } from "@/services/utils"
import { usePostActionMutation } from "@/state/apiSlice"
import { Action as ActionType, NewAction, SwimlaneColumn, Task } from "@/types"

import Action from "./Action"
import ActionCreationForm from "./ActionCreationForm"
import { useActionTitleLayout } from "./actionTitleLayout"
import { CELL_SCROLLBAR_WIDTH, DEFAULT_ROW_HEIGHT, ROW_VERTICAL_PADDING } from "./swimlaneRowFit"

/** Per-row fit control (see swimlaneRowFit.ts). */
export interface SwimlaneFit {
  /** All rows are fitted by the swimlane header button: the per-row buttons are hidden meanwhile */
  allRowsFitted: boolean
  /** Rows fitted by their own button: ticket id -> the cell whose button fitted it (shows the restore button) */
  fittedRows: Record<string, string>
  onToggleRow: (ticketId: string, cellKey: string, cellElement: HTMLElement) => void
}

/** The cell border, outside the scroll container whose content height is measured. */
const CELL_BORDER_Y = 2

/**
 * Scrollbar of the cells: plain (no arrow buttons), and when the fit button is
 * shown its track ends above the button, so the button takes the bottom end of the scrollbar.
 * Chromium and Safari only; other browsers keep their own scrollbar under the button.
 */
const fitScrollbarStyle = (reserveButton: boolean) => ({
  "&::-webkit-scrollbar": { width: `${CELL_SCROLLBAR_WIDTH}px` },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginBottom: reserveButton ? `${CELL_SCROLLBAR_WIDTH + 1}px` : 0
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    borderRadius: `${CELL_SCROLLBAR_WIDTH / 2}px`,
    border: "3px solid transparent",
    backgroundClip: "content-box"
  },
  "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "rgba(0, 0, 0, 0.45)" }
})

/** Small square ▲▼ button at the bottom end of a scrolling cell's scrollbar. */
const FitRowsButton: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <Tooltip title={active ? "Back to the default row height" : "Show all actions of this row"}>
    <IconButton
      aria-label={active ? "restore row height" : "fit row to its actions"}
      onClick={onClick}
      sx={{
        position: "absolute",
        // the bottom end of the scrollbar, which the scrollbar track leaves free
        right: 0,
        bottom: 0,
        width: `${CELL_SCROLLBAR_WIDTH}px`,
        height: `${CELL_SCROLLBAR_WIDTH}px`,
        minWidth: 0,
        padding: 0,
        zIndex: 1,
        borderRadius: 0,
        backgroundColor: active ? "rgba(22, 95, 199, 0.9)" : "rgba(0, 0, 0, 0.12)",
        color: active ? "white" : "rgba(0, 0, 0, 0.75)",
        "&:hover": { backgroundColor: active ? "rgb(22, 95, 199)" : "rgba(0, 0, 0, 0.22)" }
      }}
    >
      {active ? <UnfoldLess sx={{ fontSize: "13px" }} /> : <UnfoldMore sx={{ fontSize: "13px" }} />}
    </IconButton>
  </Tooltip>
)

interface SwimlaneActionListProps {
  taskId: string
  swimlanecolumn: SwimlaneColumn
  actionList: ActionType[]
  onFullHeightChange: (swimlanecolumnid: string, fullHeight: number) => void
  fit: SwimlaneFit
}

const SwimlaneActionList: React.FC<SwimlaneActionListProps> = ({
  taskId,
  swimlanecolumn,
  actionList,
  onFullHeightChange,
  fit
}) => {
  const containerRef = useRef<HTMLElement | null>(null)
  const contentKey = actionList.map((a) => `${a.actionid}:${a.title}:${a.users.length}`).join("|")
  const { titleLines, fullHeight, scrollbarWidth, hidesContent } = useActionTitleLayout(containerRef, contentKey)

  const cellKey = `${taskId}/${swimlanecolumn.swimlanecolumnid}`
  // Shown where content is scrolled away: at the end of the cell's scrollbar. While the row is fitted, only
  // in the cell that fitted it (the fitted row keeps room for it under the content).
  const rowFittedBy = fit.fittedRows[taskId]
  const showFitButton =
    !fit.allRowsFitted && (rowFittedBy ? rowFittedBy === cellKey : hidesContent && scrollbarWidth > 0)

  useEffect(() => {
    // outer height of the cell needed to show all of it (fullHeight is measured inside the border)
    onFullHeightChange(swimlanecolumn.swimlanecolumnid, fullHeight + CELL_BORDER_Y)
  }, [onFullHeightChange, swimlanecolumn.swimlanecolumnid, fullHeight])

  return (
    // The cell (grid item, with the border) holds the scroll container and, outside it, the fit button,
    // so the button doesn't scroll with the actions. Border-box sizing keeps its outer size the same.
    <Droppable
      droppableId={swimlanecolumn.swimlanecolumnid + "/" + taskId + "/" + swimlanecolumn.columnid}
      type={"SWIMLANE" + "/" + taskId}
    >
      {(provided, snapshot) => (
        <Box
          sx={{
            position: "relative",
            minWidth: 0,
            minHeight: 0,
            boxSizing: "border-box",
            border: snapshot.isDraggingOver ? "1px solid rgba(22, 95, 199)" : "1px solid rgba(0, 0, 0, 0.12)",
            backgroundColor: snapshot.isDraggingOver ? "rgba(22, 95, 199, 0.1)" : undefined
          }}
        >
          <Box
            ref={(element: HTMLElement | null) => {
              provided.innerRef(element)
              containerRef.current = element
            }}
            {...provided.droppableProps}
            sx={{
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              height: "100%",
              padding: "2px",
              alignContent: "center",
              overflowX: "hidden",
              ...fitScrollbarStyle(showFitButton)
            }}
            data-testid={`action-list-${swimlanecolumn.ordernum}`}
          >
            {actionList &&
              actionList.map((action, index) => (
                <Action key={action.actionid} action={action} index={index} titleLines={titleLines[action.actionid]} />
              ))}
            {provided.placeholder}
          </Box>
          {showFitButton && (
            <FitRowsButton
              active={Boolean(rowFittedBy)}
              onClick={() => containerRef.current && fit.onToggleRow(taskId, cellKey, containerRef.current)}
            />
          )}
        </Box>
      )}
    </Droppable>
  )
}

const CreateActionButton: React.FC<{ taskId: string; swimlanecolumnid: string; columnid: string }> = ({
  taskId,
  swimlanecolumnid,
  columnid
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [createAction] = usePostActionMutation()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleOnSubmit = async (data: { actionTitle: string; resetActionTitle: () => void }) => {
    const action: NewAction = {
      title: data.actionTitle,
      columnid: columnid,
      actionid: getId(),
      ticketid: taskId,
      swimlanecolumnid,
      order: 0
    }
    data.resetActionTitle()
    await createAction({ action })
  }

  const open = Boolean(anchorEl)
  const popOverid = open ? "popover" : undefined

  return (
    <div>
      <IconButton sx={{ marginTop: "10px" }} size={"small"} onClick={handleClick} aria-label="add action">
        <Add sx={{ fontSize: "15px" }} />
      </IconButton>
      <Popover
        disableRestoreFocus
        id={popOverid}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        transformOrigin={{
          vertical: 10,
          horizontal: 230
        }}
      >
        <Paper sx={{ height: "fit-content", padding: "20px", width: "200px" }}>
          <ActionCreationForm onSubmit={handleOnSubmit} onCancel={handleClose} />
        </Paper>
      </Popover>
    </div>
  )
}

interface SwimlaneProps {
  task: Task
  swimlaneColumns: SwimlaneColumn[]
  actions: ActionType[]
  columnid: string
  /** Outer row height. Undefined means the default height. */
  rowHeight?: number
  /** Reports the outer row height needed to show every action of this row in full. */
  onNeededHeightChange: (ticketId: string, neededHeight: number) => void
  /** Fit buttons of the row's cells (see swimlaneRowFit.ts). */
  fit: SwimlaneFit
}

const Swimlane: React.FC<SwimlaneProps> = ({
  task,
  swimlaneColumns,
  actions,
  columnid,
  rowHeight,
  onNeededHeightChange,
  fit
}) => {
  const [cellHeights, setCellHeights] = useState<Record<string, number>>({})

  const handleCellFullHeight = useCallback((swimlanecolumnid: string, fullHeight: number) => {
    setCellHeights((previous) =>
      previous[swimlanecolumnid] === fullHeight ? previous : { ...previous, [swimlanecolumnid]: fullHeight }
    )
  }, [])

  const neededHeight = Math.max(0, ...Object.values(cellHeights)) + ROW_VERTICAL_PADDING
  useEffect(() => {
    onNeededHeightChange(task.ticketid, neededHeight)
  }, [onNeededHeightChange, task.ticketid, neededHeight])

  const height = rowHeight ?? DEFAULT_ROW_HEIGHT

  return (
    <Box sx={{ display: "flex" }}>
      {swimlaneColumns && (
        <CreateActionButton
          taskId={task.ticketid}
          swimlanecolumnid={swimlaneColumns[0].swimlanecolumnid}
          columnid={columnid}
        />
      )}
      <Box
        sx={{
          height: `${height - ROW_VERTICAL_PADDING}px`,
          paddingBottom: "9px",
          paddingTop: "9px",
          paddingRight: "25px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          width: "100%"
        }}
      >
        {swimlaneColumns &&
          swimlaneColumns.map((swimlaneColumn, index) => (
            <SwimlaneActionList
              key={index}
              taskId={task.ticketid}
              swimlanecolumn={swimlaneColumn}
              actionList={actions.filter((action) => action.swimlanecolumnid == swimlaneColumn.swimlanecolumnid)}
              onFullHeightChange={handleCellFullHeight}
              fit={fit}
            />
          ))}
      </Box>
    </Box>
  )
}

export default Swimlane
