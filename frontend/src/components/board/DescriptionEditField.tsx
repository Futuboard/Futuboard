import "@mdxeditor/editor/style.css"
import {
  CreateLink,
  linkDialogPlugin,
  linkPlugin,
  MDXEditor,
  MDXEditorMethods,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  CodeToggle,
  InsertTable,
  tablePlugin,
  listsPlugin,
  quotePlugin,
  headingsPlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  ListsToggle,
  Separator
} from "@mdxeditor/editor"
import React from "react"
import { Box } from "@mui/material"

interface DescriptionEditFieldProps {
  description: string
  onChange: (markdown: string) => void
}

const DescriptionEditField: React.FC<DescriptionEditFieldProps> = ({ description, onChange }) => {
  const ref = React.useRef<MDXEditorMethods>(null)

  return (
    <Box
      className="description"
      sx={{
        border: "none",
        borderRadius: "3pt",
        outlineStyle: "solid",
        outlineColor: "#c4c4c4",
        outlineWidth: "1px",
        "&:hover": {
          outlineColor: "#1a1a1a"
        },
        "&:focus-within": {
          outlineColor: "#1976d2",
          outlineWidth: "2px"
        }
      }}
    >
      <MDXEditor
        placeholder="Description"
        markdown={description}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <>
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
        onChange={(markdown) => onChange(markdown)}
        ref={ref}
        contentEditableClassName="md-editor-contenteditable"
      />
    </Box>
  )
}

export default DescriptionEditField
