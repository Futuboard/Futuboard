import { Visibility, VisibilityOff } from "@mui/icons-material/"
import FormControl from "@mui/material/FormControl"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import InputLabel from "@mui/material/InputLabel"
import OutlinedInput from "@mui/material/OutlinedInput"
import { useState } from "react"
import { UseFormRegisterReturn } from "react-hook-form"

interface AddPasswordFieldProps {
  register: UseFormRegisterReturn
}

const PasswordField: React.FC<AddPasswordFieldProps> = ({ register }) => {
  const [showPassword, setShowPassword] = useState(false)

  const handleClickShowPassword = () => setShowPassword((show) => !show)

  return (
    <FormControl sx={{ width: "90%" }}>
      <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
      <OutlinedInput
        type={showPassword ? "Text" : "Password"}
        {...register}
        endAdornment={
          <InputAdornment position="end">
            <IconButton onClick={handleClickShowPassword} edge="end">
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
        label="Password"
      />
    </FormControl>
  )
}

export default PasswordField
