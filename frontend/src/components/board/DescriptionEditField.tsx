import "@mdxeditor/editor/style.css"
import {
  CreateLink,
  linkDialogPlugin,
  linkPlugin,
  MDXEditor,
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
import { Box } from "@mui/material"
import React from "react"

interface DescriptionEditFieldProps {
  description: string
  onChange: (markdown: string) => void
}

const DescriptionEditField: React.FC<DescriptionEditFieldProps> = ({ description, onChange }) => {
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
        contentEditableClassName="md-editor-contenteditable-description"
      />
    </Box>
  )
}

export default DescriptionEditField
