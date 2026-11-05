import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  headingsPlugin,
  InsertTable,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin
} from "@mdxeditor/editor"
import { StickyNote2 } from "@mui/icons-material"
import CloseIcon from "@mui/icons-material/Close"
import { Box, Button, ButtonGroup, Divider, Fab, Fade, Paper, Slide, Tooltip } from "@mui/material"
import { useEffect, useState } from "react"

import { BOARD_NOTES_TRANSITION_MS } from "@/constants"
import { useUpdateBoardNotesMutation } from "@/state/apiSlice"

import { KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE } from "./ticketEditorDock"

interface BoardNotesProps {
  boardId: string
  content: string
  open: boolean
  handleSetOpen: (value: boolean) => void
}

const BoardNotes: React.FC<BoardNotesProps> = ({ boardId, content, open, handleSetOpen }) => {
  const [updateBoardNotes] = useUpdateBoardNotesMutation()
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setNotes(content)
  }, [content])

  const saveNotes = async () => {
    if (content != notes) {
      try {
        await updateBoardNotes({ boardId: boardId, notes: notes })
      } catch (error) {
        console.error(error)
      }
    }
    handleSetOpen(false)
  }

  const handleClose = () => {
    handleSetOpen(false)
    setNotes(content)
  }

  return (
    <>
      <Fade in={!open} unmountOnExit>
        <Tooltip title="Open Notes" placement="left" arrow>
          <Fab
            sx={{
              position: "fixed",
              bottom: " 1rem",
              left: "1rem"
            }}
            onClick={() => handleSetOpen(true)}
            color="info"
            {...{ [KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE]: "" }}
          >
            <StickyNote2 />
          </Fab>
        </Tooltip>
      </Fade>

      <Slide in={open} unmountOnExit direction="right" timeout={BOARD_NOTES_TRANSITION_MS} easing={"ease"}>
        <Paper
          sx={{
            width: "520px",
            maxWidth: "100vw",
            position: "fixed",
            left: "0",
            top: "65px",
            display: "flex",
            flexDirection: "column",
            zIndex: 1100
          }}
          variant="outlined"
          {...{ [KEEP_TICKET_EDITOR_OPEN_ATTRIBUTE]: "" }}
        >
          <Box>
            <MDXEditor
              placeholder="Shared notes for the board"
              markdown={notes}
              onChange={setNotes}
              trim={false}
              plugins={[
                toolbarPlugin({
                  toolbarContents: () => (
                    <>
                      <BlockTypeSelect />
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
              contentEditableClassName="md-editor-contenteditable-notes"
            />
          </Box>
          <Divider variant="middle" />
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", padding: 1 }}>
            <ButtonGroup color="primary">
              <Button onClick={saveNotes} endIcon={<StickyNote2 />} variant="contained">
                Save
              </Button>
              <Button onClick={handleClose} endIcon={<CloseIcon />} variant="outlined">
                Cancel
              </Button>
            </ButtonGroup>
          </Box>
        </Paper>
      </Slide>
    </>
  )
}

export default BoardNotes
