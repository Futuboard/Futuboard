import { Box, Skeleton, Typography } from "@mui/material"
import Paper from "@mui/material/Paper"
import { useEffect, useState } from "react"

import {
  useGetSwimlaneColumnsByColumnIdQuery,
  useUpdateSwimlaneColumnMutation,
  useGetActionsByColumnIdQuery,
  useGetTaskListByColumnIdQuery
} from "@/state/apiSlice"
import type { Column, SwimlaneColumn } from "@/types"

import Swimlane from "./Swimlane"

const SwimlaneColumnTitleComponent: React.FC<{ swimlanecolumn: SwimlaneColumn }> = ({ swimlanecolumn }) => {
  const [updateSwimlaneColumn] = useUpdateSwimlaneColumnMutation()

  const [isEditing, setIsEditing] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(swimlanecolumn.title)

  useEffect(() => {
    setCurrentTitle(swimlanecolumn.title)
  }, [swimlanecolumn.title])

  const handleDoubleClick = () => {
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
    <Box onDoubleClick={handleDoubleClick}>
      {isEditing ? (
        <Box sx={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
          <input
            name="swimlaneColumnTitle"
            autoFocus
            value={currentTitle}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            onBlur={handleBlur}
            style={{ width: "100%", fontSize: "1.5rem", backgroundColor: "transparent", color: "black" }}
          />
        </Box>
      ) : (
        <Typography variant={"h5"} noWrap gutterBottom>
          {currentTitle}
        </Typography>
      )}
    </Box>
  )
}

interface SwimlaneContainerProps {
  column: Column
}

const SwimlaneContainer: React.FC<SwimlaneContainerProps> = ({ column }) => {
  const { data: swimlaneColumns, isSuccess } = useGetSwimlaneColumnsByColumnIdQuery(column.columnid)
  const { data: taskList } = useGetTaskListByColumnIdQuery({ boardId: column.boardid, columnId: column.columnid })
  const tasks = taskList
  const { data: actions } = useGetActionsByColumnIdQuery(column.columnid)

  return (
    <>
      <Paper
        elevation={4}
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
            paddingBottom: "23px"
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
        </Box>

        {tasks && tasks.length ? (
          isSuccess && actions ? (
            tasks.map((task) => (
              <Swimlane
                key={task.ticketid}
                task={task}
                swimlaneColumns={swimlaneColumns}
                columnid={column.columnid}
                actions={actions.filter((a) => a.ticketid == task.ticketid)}
              />
            ))
          ) : (
            <Skeleton variant="rectangular" width="100%" height={tasks.length * (120 + 18)} />
          )
        ) : (
          <div style={{ textAlign: "center", paddingTop: "15px", color: "#2D3748" }}>No cards yet</div>
        )}
      </Paper>
    </>
  )
}

export default SwimlaneContainer
