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
import { Button, ButtonGroup, Fab, Fade, Paper, Tooltip } from "@mui/material"
import { useEffect, useState } from "react"

import { useUpdateBoardNotesMutation } from "@/state/apiSlice"

interface BoardNotesProps {
  boardId: string
  content: string
  onChange: (markdown: string) => void
}

const BoardNotes: React.FC<BoardNotesProps> = ({ boardId, content, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [updateBoardNotes] = useUpdateBoardNotesMutation()
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setNotes(content)
  }, [content])

  const openNotes = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)

    if (content != notes) {
      try {
        onChange(notes)
        await updateBoardNotes({ boardId: boardId, notes: notes })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
    setNotes(content)
  }

  const open = Boolean(anchorEl)

  return (
    <div>
      <Fade in={open} unmountOnExit>
        <ButtonGroup
          sx={{ position: "fixed", bottom: "1.75rem", right: "1.75rem", zIndex: 1001 }}
          variant="contained"
          color="info"
        >
          <Button onClick={openNotes} endIcon={<StickyNote2 />}>
            Save
          </Button>
          <Button onClick={handleClose} endIcon={<CloseIcon />}>
            Cancel
          </Button>
        </ButtonGroup>
      </Fade>
      <Fade in={!open} unmountOnExit>
        <Tooltip title="open notes" placement="left" arrow>
          <Fab sx={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 1001 }} onClick={openNotes} color="info">
            <StickyNote2 />
          </Fab>
        </Tooltip>
      </Fade>

      <Fade in={Boolean(anchorEl)} unmountOnExit>
        <Paper
          sx={{
            width: "520px",
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            top: "calc(65px + 1rem)",
            zIndex: 1000
          }}
          elevation={16}
        >
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
        </Paper>
      </Fade>
    </div>
  )
}

export default BoardNotes
