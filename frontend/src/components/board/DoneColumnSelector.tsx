import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"

import { useSetDoneColumnsMutation } from "@/state/apiSlice"
import { Scope, Column } from "@/types"

interface DoneColumnSelectorProps {
  scope: Scope
  columns: Column[]
}

const DoneColumnSelector: React.FC<DoneColumnSelectorProps> = ({ columns, scope }) => {
  const [updateDoneColumns] = useSetDoneColumnsMutation()

  const handleChange = (_: React.SyntheticEvent, columns: Column[]) => {
    updateDoneColumns({ scope, columns })
  }

  return (
    <Autocomplete
      multiple
      disablePortal
      id="tags-outlined"
      options={columns}
      disableCloseOnSelect
      disableClearable
      onChange={handleChange}
      value={scope.done_columns}
      filterSelectedOptions
      isOptionEqualToValue={(option, value) => option.columnid === value.columnid}
      getOptionLabel={(option) => option.title}
      renderInput={(params) => <TextField {...params} label="Done Columns" />}
      sx={{ width: 300 }}
    />
  )
}

export default DoneColumnSelector
