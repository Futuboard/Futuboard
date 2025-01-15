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
  tablePlugin
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
      markdown={description}
      plugins={[
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <BoldItalicUnderlineToggles />
              <CreateLink />
              <CodeToggle />
              <InsertTable />
            </>
          )
        }),
        linkPlugin(),
        linkDialogPlugin(),
        tablePlugin()
      ]}
      onChange={(markdown) => onChange(markdown)}
      ref={ref}
    />
  )
}

export default DescriptionEditField
