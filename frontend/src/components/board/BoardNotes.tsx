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
import { Box, Button, ButtonGroup, Divider, Fab, Fade, Paper, Tooltip } from "@mui/material"
import { useEffect, useState } from "react"

import { useUpdateBoardNotesMutation } from "@/state/apiSlice"

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
        <Tooltip title="open notes" placement="left" arrow>
          <Fab
            sx={{
              position: "fixed",
              bottom: "calc(100% - 100vh + 1.5rem)",
              left: "calc(100% - 100vw + 1.5rem)",
              zIndex: 1001
            }}
            onClick={() => handleSetOpen(true)}
            color="info"
          >
            <StickyNote2 />
          </Fab>
        </Tooltip>
      </Fade>

      <Fade in={open} unmountOnExit>
        <Paper
          sx={{
            width: "520px",
            position: "fixed",
            left: "calc(100% - 100vw + 1.75rem)",
            top: "calc(65px + 1.5rem)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column"
          }}
          elevation={16}
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
            <ButtonGroup variant="contained" color="info">
              <Button onClick={saveNotes} endIcon={<StickyNote2 />}>
                Save
              </Button>
              <Button onClick={handleClose} endIcon={<CloseIcon />}>
                Cancel
              </Button>
            </ButtonGroup>
          </Box>
        </Paper>
      </Fade>
    </>
  )
}

export default BoardNotes
