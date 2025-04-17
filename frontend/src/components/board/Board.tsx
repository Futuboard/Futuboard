import { Droppable } from "@hello-pangea/dnd"
import { Box, Typography } from "@mui/material"
import { AnyAction } from "@reduxjs/toolkit"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router"

import { boardsApi, useGetAllTasksQuery, useGetColumnsByBoardIdQuery } from "../../state/apiSlice"
import { AddMagnetButton } from "../general/Toolbar"

import Column from "./Column"
import CopyToClipboardButton from "./CopyToClipBoardButton"
import CreateColumnButton from "./CreateColumnButton"

interface BoardProps {
  isBoardNotesOpen: boolean
}

const Board: React.FC<BoardProps> = ({ isBoardNotesOpen }) => {
  const { id = "default-id" } = useParams()
  const dispatch = useDispatch()
  const { data: columns, isLoading, isSuccess } = useGetColumnsByBoardIdQuery(id)
  const { isSuccess: isSuccess2 } = useGetAllTasksQuery({ boardId: id })
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (columns && columns.length > 0 && !isDone) {
      setIsDone(true)
      const columnIds = columns?.map((column) => column.columnid) || []
      for (const columnId of columnIds) {
        dispatch(boardsApi.util.upsertQueryData("getTaskListByColumnId", { columnId }, []) as unknown as AnyAction)
      }
    }
  }, [columns, isDone, dispatch])

  if (isLoading || !isSuccess2) {
    return <Typography>Loading columns...</Typography>
  }

  if (isSuccess && columns.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, marginBottom: 1 }}>
          <Typography>Add a column:</Typography>
          <CreateColumnButton boardId={id} />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, marginBottom: 1 }}>
          <Typography>Add a magnet:</Typography>
          <AddMagnetButton />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, marginBottom: 1 }}>
          <Typography>Copy board link:</Typography>
          <CopyToClipboardButton />
        </Box>
      </Box>
    )
  }

  return (
    <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
      {(provided) => (
        <Box
          {...provided.droppableProps}
          ref={provided.innerRef}
          sx={{
            display: "inline-flex",
            margin: isBoardNotesOpen ? "25px 620px 25px 545px" : "25px 620px 25px 25px",
            transition: "0.4s"
          }}
        >
          {isSuccess && columns.map((column, index) => <Column key={column.columnid} column={column} index={index} />)}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  )
}

export default Board
