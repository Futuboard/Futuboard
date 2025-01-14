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
} from "@mdxeditor/editor"
import React from "react"

interface DescriptionEditFieldProps {
    description: string
    setValue: (name: "description", value: string, options?: Partial<{
        shouldValidate: boolean;
        shouldDirty: boolean;
        shouldTouch: boolean;
    }> | undefined) => void
}

const DescriptionEditField: React.FC<DescriptionEditFieldProps> = ({description, setValue}) => {
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
                      <CodeToggle/>
                      <InsertTable />
                    </>
                  )
                }),
                linkPlugin(),
                linkDialogPlugin(),
                tablePlugin()
              ]}
        onChange={(markdown) => (setValue("description", markdown))}
        ref={ref}
    />
    )
}

export default DescriptionEditField

