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
import { Fab, Fade, Paper, Tooltip } from "@mui/material"
import { useState } from "react"

import { useUpdateBoardNotesMutation } from "@/state/apiSlice"

interface BoardNotesProps {
  boardId: string
  content: string
  onChange: (markdown: string) => void
}

const BoardNotes: React.FC<BoardNotesProps> = ({ boardId, content, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [updateBoardNotes] = useUpdateBoardNotesMutation()
  const [notes, setNotes] = useState(content)

  const openNotes = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)

    if (content != notes) {
      onChange(notes)
      updateBoardNotes({ boardId: boardId, notes: notes })
    }
  }

  const open = Boolean(anchorEl)

  return (
    <div>
      <Fab sx={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 1401 }} onClick={openNotes} color="info">
        {anchorEl ? (
          <Fade in={open}>
            <CloseIcon />
          </Fade>
        ) : (
          <Tooltip title="open notes" placement="left">
            <Fade in={!open}>
              <StickyNote2 />
            </Fade>
          </Tooltip>
        )}
      </Fab>
      <Fade in={Boolean(anchorEl)} unmountOnExit>
        <Paper
          sx={{
            width: "520px",
            position: "fixed",
            bottom: "0.75rem",
            right: "0.75rem",
            top: "calc(65px + 0.75rem)",
            zIndex: 1400
          }}
          elevation={16}
        >
          <MDXEditor
            placeholder="Share notes for the board"
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
