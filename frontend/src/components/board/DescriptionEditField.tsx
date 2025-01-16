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

interface DescriptionEditFieldProps {
  description: string
  onChange: (markdown: string) => void
}

const DescriptionEditField: React.FC<DescriptionEditFieldProps> = ({ description, onChange }) => {
  const ref = React.useRef<MDXEditorMethods>(null)

  return (
    <MDXEditor
      placeholder="Description"
      className="description"
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
      contentEditableClassName="content"
    />
  )
}

export default DescriptionEditField
