import { Droppable } from "@hello-pangea/dnd"
import { Box, Typography } from "@mui/material"
import { useParams } from "react-router"

import { BOARD_NOTES_OFFSET, BOARD_NOTES_TRANSITION_MS } from "@/constants"
import { Column as ColumnType } from "@/types"

import { useGetColumnsByBoardIdQuery } from "../../state/apiSlice"
import { AddMagnetButton } from "../general/Toolbar"

import Column from "./Column"
import CreateColumnButton from "./CreateColumnButton"
import ShareButton from "./ShareButton"
import { DOCKED_EDITOR_DRAGGABLE_ID, dockedEditorIndex, useTicketEditorDock } from "./ticketEditorDock"
import { DockedEditorDraggable } from "./TicketEditorFrames"

/** The columns, with the docked ticket editor (if any) at its place among them; indexes count both. */
const boardItems = (columns: ColumnType[], editorIndex: number | null) => {
  const items = columns.map((column, index) => (
    <Column
      key={column.columnid}
      column={column}
      index={editorIndex !== null && index >= editorIndex ? index + 1 : index}
    />
  ))
  if (editorIndex !== null) {
    items.splice(editorIndex, 0, <DockedEditorDraggable key={DOCKED_EDITOR_DRAGGABLE_ID} index={editorIndex} />)
  }
  return items
}

interface BoardProps {
  isBoardNotesOpen: boolean
}

const Board: React.FC<BoardProps> = ({ isBoardNotesOpen }) => {
  const { id = "default-id" } = useParams()
  const { data: columns, isLoading, isSuccess } = useGetColumnsByBoardIdQuery(id)
  const { docked } = useTicketEditorDock()

  if (isLoading) {
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
          <Typography>Add collaborators:</Typography>
          <ShareButton />
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
            margin: `25px 620px 25px ${25 + (isBoardNotesOpen ? BOARD_NOTES_OFFSET : 0)}px`,
            transition: `${BOARD_NOTES_TRANSITION_MS}ms ease`
          }}
        >
          {isSuccess && boardItems(columns, docked ? dockedEditorIndex(columns, docked) : null)}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  )
}

export default Board
