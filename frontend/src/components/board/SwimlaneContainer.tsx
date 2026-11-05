import { UnfoldLess, UnfoldMore } from "@mui/icons-material"
import { Box, IconButton, Skeleton, TextField, Tooltip } from "@mui/material"
import Paper from "@mui/material/Paper"
import { useEffect, useState } from "react"

import {
  useGetSwimlaneColumnsByColumnIdQuery,
  useUpdateSwimlaneColumnMutation,
  useGetActionsByColumnIdQuery,
  useGetTaskListByColumnIdQuery
} from "@/state/apiSlice"
import type { Column, SwimlaneColumn } from "@/types"

import Swimlane, { SwimlaneFit } from "./Swimlane"
import { DEFAULT_ROW_HEIGHT } from "./swimlaneRowFit"

const SwimlaneColumnTitleComponent: React.FC<{ swimlanecolumn: SwimlaneColumn }> = ({ swimlanecolumn }) => {
  const [updateSwimlaneColumn] = useUpdateSwimlaneColumnMutation()

  const [isEditing, setIsEditing] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(swimlanecolumn.title)

  useEffect(() => {
    setCurrentTitle(swimlanecolumn.title)
  }, [swimlanecolumn.title])

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = async () => {
    setIsEditing(false)
    if (currentTitle === swimlanecolumn.title) {
      return
    }
    const updatedSwimlaneColumn = { ...swimlanecolumn, title: currentTitle }
    await updateSwimlaneColumn({ swimlaneColumn: updatedSwimlaneColumn })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleBlur()
    }
  }

  return (
    <Box
      onClick={handleClick}
      sx={{
        width: 208,
        paddingRight: 1,
        paddingLeft: 1,
        height: 45,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <TextField
        variant="standard"
        name="swimlaneColumnTitle"
        value={currentTitle}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={handleBlur}
        InputProps={{
          disableUnderline: !isEditing,
          sx: { fontSize: "1.5rem" },
          inputProps: { style: { textAlign: "center" } }
        }}
      />
    </Box>
  )
}

/** The fit-all button at the top right of the swimlane board (see swimlaneRowFit.ts). */
export interface SwimlaneFitAll {
  active: boolean
  onClick: (buttonElement: HTMLElement) => void
}

/**
 * Small button lined up with the swimlane column titles (vertically) and the right edge of the row cells
 * (horizontally).
 */
const FitAllRowsButton: React.FC<{ fitAll: SwimlaneFitAll }> = ({ fitAll }) => {
  const { active } = fitAll
  const title = active ? "Back to the default row heights" : "Fit all rows and their actions on screen"
  return (
    <Box
      sx={{
        position: "absolute",
        right: "25px", // the rows' right padding: the button's right edge meets the cells' right edge
        // centred on the letters of the titles: their box is 45px high from 25px down, but the letters sit
        // 4px above its middle (the box also holds descenders and the input's bottom padding)
        top: "21px",
        height: "45px",
        display: "flex",
        alignItems: "center"
      }}
    >
      <Tooltip title={title} describeChild>
        <IconButton
          aria-label={title}
          onClick={(event) => fitAll.onClick(event.currentTarget)}
          sx={{
            width: "20px",
            height: "20px",
            padding: 0,
            borderRadius: "3px",
            backgroundColor: active ? "rgba(22, 95, 199, 0.9)" : "rgba(255, 255, 255, 0.95)",
            color: active ? "white" : "rgba(0, 0, 0, 0.7)",
            border: "1px solid rgba(0, 0, 0, 0.25)",
            "&:hover": { backgroundColor: active ? "rgb(22, 95, 199)" : "white" }
          }}
        >
          {active ? <UnfoldLess sx={{ fontSize: "16px" }} /> : <UnfoldMore sx={{ fontSize: "16px" }} />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

/** Row layout owned by the Column, so backlog cards and swimlane rows share the same heights. */
export interface SwimlaneRowLayout {
  rowHeights: Record<string, number>
  onNeededHeightChange: (ticketId: string, neededHeight: number) => void
  /** a button at the end of the scrollbar of cells hiding content fits that row */
  fit: SwimlaneFit
  /** a button at the top right of the board fits all rows on screen */
  fitAll: SwimlaneFitAll
}

interface SwimlaneContainerProps {
  column: Column
  rowLayout: SwimlaneRowLayout
}

const SwimlaneContainer: React.FC<SwimlaneContainerProps> = ({ column, rowLayout }) => {
  const { data: swimlaneColumns, isSuccess } = useGetSwimlaneColumnsByColumnIdQuery(column.columnid)
  const { data: taskList } = useGetTaskListByColumnIdQuery({ columnId: column.columnid })
  const tasks = taskList
  const { data: actions } = useGetActionsByColumnIdQuery(column.columnid)

  return (
    <>
      <Paper
        elevation={4}
        data-swimlane-container
        sx={{
          minHeight: "85vh",
          backgroundColor: "#E5DBD9",
          padding: "4px",
          border: "2px solid #000",
          borderBottom: "5px solid #000",
          borderColor: "rgba(0, 0, 0, 0.12)"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            paddingLeft: "25px",
            paddingRight: "25px",
            paddingTop: "25px",
            paddingBottom: "23px",
            position: "relative"
          }}
        >
          {isSuccess ? (
            swimlaneColumns &&
            swimlaneColumns.map((swimlaneColumn) => (
              <SwimlaneColumnTitleComponent swimlanecolumn={swimlaneColumn} key={swimlaneColumn.swimlanecolumnid} />
            ))
          ) : (
            <Skeleton variant="rectangular" width="96%" height={44} />
          )}
          <FitAllRowsButton fitAll={rowLayout.fitAll} />
        </Box>

        {tasks && tasks.length ? (
          isSuccess && actions ? (
            <div data-swimlane-rows>
              {tasks.map((task) => (
                <Swimlane
                  key={task.ticketid}
                  task={task}
                  swimlaneColumns={swimlaneColumns}
                  columnid={column.columnid}
                  actions={actions.filter((a) => a.ticketid == task.ticketid)}
                  rowHeight={rowLayout.rowHeights[task.ticketid]}
                  onNeededHeightChange={rowLayout.onNeededHeightChange}
                  fit={rowLayout.fit}
                />
              ))}
            </div>
          ) : (
            <Skeleton variant="rectangular" width="100%" height={tasks.length * DEFAULT_ROW_HEIGHT} />
          )
        ) : (
          <div style={{ textAlign: "center", paddingTop: "15px", color: "#2D3748" }}>No cards yet</div>
        )}
      </Paper>
    </>
  )
}

export default SwimlaneContainer
