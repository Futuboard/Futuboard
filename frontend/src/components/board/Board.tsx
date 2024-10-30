import { Droppable } from "@hello-pangea/dnd"
import { Box, Typography } from "@mui/material"
import { useParams } from "react-router"

import { useGetColumnsByBoardIdQuery } from "../../state/apiSlice"

import Column from "./Column"
import CopyToClipboardButton from "./CopyToClipBoardButton"
import CreateColumnButton from "./CreateColumnButton"
import { AddUserButton } from "./Toolbar"

const Board: React.FC = () => {
  const { id = "default-id" } = useParams()

  const { data: columns, isLoading, isSuccess } = useGetColumnsByBoardIdQuery(id)

  if (isLoading) {
    return <Typography>Loading columns...</Typography>
  }

  if (isSuccess && columns.length === 0) {
    //const boardtitle = useGetBoardQuery(id)
    //console.log(boardtitle)
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
        {/*
                <Typography sx={{ marginBottom: 1 }}>
                    Return to home by clicking:
                    <svg style={{ width: "1.5rem", height: "1.5rem", color: "#2D3748" }} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M11.3 3.3a1 1 0 0 1 1.4 0l6 6 2 2a1 1 0 0 1-1.4 1.4l-.3-.3V19a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-3h-2v3c0 .6-.4 1-1 1H7a2 2 0 0 1-2-2v-6.6l-.3.3a1 1 0 0 1-1.4-1.4l2-2 6-6Z" clipRule="evenodd"/>
                    </svg>
                </Typography>
                */}
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, marginBottom: 1 }}>
          <Typography>Add a column:</Typography>
          <CreateColumnButton boardId={id} />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, marginBottom: 1 }}>
          <Typography>Add a user:</Typography>
          <AddUserButton />
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
          sx={{ display: "inline-flex", height: "100vh", width: "fit-content", margin: "4rem 25px 25px 25px" }}
        >
          {isSuccess && columns.map((column, index) => <Column key={column.columnid} column={column} index={index} />)}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  )
}

export default Board
