import { Button, Stack } from "@mui/material"
import { useDispatch, useSelector } from "react-redux"

import { disableScope, setScope } from "@/state/scope"
import { RootState } from "@/state/store"

// To try out the ticket selection demo, first create two scopes for a board and then set the scope IDs below.
// When the IDs have been set, and a board is open for which the scopes were created,
// clicking on tickets when a scope is selected should highlight them.
const scope1 = "scopeid1"
const scope2 = "scopeid2"

const ScopeDemo = () => {
  // Gets the global state "scope"
  const scopeId = useSelector((state: RootState) => state.scope)

  // Used to communicate with the global state
  const dispatch = useDispatch()

  return (
    <Stack spacing={2} alignItems="center" sx={{ backgroundColor: "white" }}>
      <Stack direction="row" spacing={2}>
        {/* dispatch(disableScope()) sets state.scope into "" */}
        <Button variant={scopeId === "" ? "contained" : "outlined"} onClick={() => dispatch(disableScope())}>
          None
        </Button>
        {/* dispatch(setScope("scopeid")) sets state.scope into "scopeid" */}
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
