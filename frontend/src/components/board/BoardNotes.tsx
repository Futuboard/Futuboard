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
import { Box, Button, ButtonGroup, Fab, Fade, Paper, Tooltip } from "@mui/material"
import { useEffect, useState } from "react"

import { useUpdateBoardNotesMutation } from "@/state/apiSlice"

interface BoardNotesProps {
  boardId: string
  content: string
  onChange: (markdown: string) => void
}

const BoardNotes: React.FC<BoardNotesProps> = ({ boardId, content, onChange }) => {
  const [open, setOpen] = useState(false)
  const [updateBoardNotes] = useUpdateBoardNotesMutation()
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setNotes(content)
  }, [content])

  const saveNotes = async () => {
    if (content != notes) {
      try {
        onChange(notes)
        await updateBoardNotes({ boardId: boardId, notes: notes })
      } catch (error) {
        console.error(error)
      }
    }
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
    setNotes(content)
  }

  return (
    <div>
      <Fade in={!open} unmountOnExit>
        <Tooltip title="open notes" placement="left" arrow>
          <Fab
            sx={{ position: "fixed", bottom: "0.75rem", right: "0.75rem", zIndex: 1001 }}
            onClick={() => setOpen(true)}
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
            bottom: "1rem",
            right: "1rem",
            top: "calc(65px + 1rem)",
            zIndex: 1000,
            justifyContent: "flex-start",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end"
          }}
          elevation={16}
        >
          <Box sx={{ overflow: "auto" }}>
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
          <ButtonGroup sx={{ margin: "13px 13px 0 0" }} variant="contained" color="info">
            <Button onClick={saveNotes} endIcon={<StickyNote2 />}>
              Save
            </Button>
            <Button onClick={handleClose} endIcon={<CloseIcon />}>
              Cancel
            </Button>
          </ButtonGroup>
        </Paper>
      </Fade>
    </div>
  )
}

export default BoardNotes
