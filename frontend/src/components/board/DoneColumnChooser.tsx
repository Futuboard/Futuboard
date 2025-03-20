import { Stack } from "@mui/material"
import { Scope, Column } from "@/types"
import { useSetDoneColumnsMutation } from "@/state/apiSlice"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"

interface DoneColumnChooserProps {
  scope: Scope
  columns: Column[]
}

const DoneColumnChooser: React.FC<DoneColumnChooserProps> = ({ columns, scope }) => {
  const [updateDoneColumns] = useSetDoneColumnsMutation()

  const handleChange = (_: React.SyntheticEvent, columns: Column[]) => {
    const ids = columns.map((c) => c.columnid)
    updateDoneColumns({ scopeid: scope.scopeid, columnidlist: ids })
  }

  return (
    <div>
      <Stack spacing={3} sx={{ width: 300 }}>
        <Autocomplete
          multiple
          disablePortal
          id="tags-outlined"
          options={columns}
          onChange={handleChange}
          value={scope.done_columns}
          getOptionLabel={(option) => option.title}
          renderInput={(params) => <TextField {...params} label="Done Columns" />}
        />
      </Stack>
    </div>
  )
}

export default DoneColumnChooser
