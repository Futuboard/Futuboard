import { Box, Skeleton, Typography } from "@mui/material"
import Paper from "@mui/material/Paper"
import { useContext, useEffect, useState } from "react"

import { WebsocketContext } from "@/pages/BoardContainer"
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
  const sendMessage = useContext(WebsocketContext)

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
    if (sendMessage !== null) {
      sendMessage("Swimlane column updated")
    }
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
      sx={{ width: swimlanecolumn.title == "" ? "100%" : "fit-content", overflow: "hidden" }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
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
          margin: "25px 0px",
          width: "800px",
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
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: "30px",
            paddingTop: "20px",
            paddingLeft: "30px"
          }}
        >
          {isSuccess ? (
            swimlaneColumns &&
            swimlaneColumns.map((swimlaneColumn) => (
              <Box
                key={swimlaneColumn.swimlanecolumnid}
                sx={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: "0",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden"
                }}
              >
                <SwimlaneColumnTitleComponent swimlanecolumn={swimlaneColumn} />
              </Box>
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
                actions={actions.filter((a) => a.ticketid == task.ticketid)}
              />
            ))
          ) : (
            <Skeleton variant="rectangular" width="100%" height={tasks.length * 129} />
          )
        ) : (
          <div style={{ textAlign: "center", paddingTop: "15px", color: "#2D3748" }}>No cards yet</div>
        )}
      </Paper>
    </>
  )
}

export default SwimlaneContainer
