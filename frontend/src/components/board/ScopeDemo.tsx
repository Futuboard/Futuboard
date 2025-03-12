import { Button, Stack } from "@mui/material"
import { useDispatch, useSelector } from "react-redux"

import { disableScope, setScope } from "@/state/scope"
import { RootState } from "@/state/store"

// Set already made scope IDs here
const scope1 = "f330ef5f-b12b-4125-b59b-fa100e24ca9e"
const scope2 = "c3a4c692-1594-4839-bb40-f1371975d2d8"

const ScopeDemo = () => {
  const scopeId = useSelector((state: RootState) => state.scope)

  const dispatch = useDispatch()

  return (
    <Stack spacing={2} alignItems="center" sx={{ backgroundColor: "white" }}>
      <Stack direction="row" spacing={2}>
        <Button variant={scopeId === "" ? "contained" : "outlined"} onClick={() => dispatch(disableScope())}>
          None
        </Button>
        <Button variant={scopeId === scope1 ? "contained" : "outlined"} onClick={() => dispatch(setScope(scope1))}>
          scope1
        </Button>
        <Button variant={scopeId === scope2 ? "contained" : "outlined"} onClick={() => dispatch(setScope(scope2))}>
          scope2
        </Button>
      </Stack>
    </Stack>
  )
}

export default ScopeDemo
