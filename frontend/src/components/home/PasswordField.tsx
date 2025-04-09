import { Visibility, VisibilityOff } from "@mui/icons-material/"
import { Typography } from "@mui/material"
import FormControl from "@mui/material/FormControl"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import InputLabel from "@mui/material/InputLabel"
import OutlinedInput from "@mui/material/OutlinedInput"
import { useState } from "react"
import { UseFormRegisterReturn } from "react-hook-form"

interface AddPasswordFieldProps {
  register: UseFormRegisterReturn
  errorText?: string
  label?: string
}

const PasswordField: React.FC<AddPasswordFieldProps> = ({ register, errorText, label = "Board Password" }) => {
  const [showPassword, setShowPassword] = useState(false)

  const handleClickShowPassword = () => setShowPassword((show) => !show)

  return (
    <FormControl>
      <InputLabel htmlFor="outlined-adornment-password">{label}</InputLabel>
      <OutlinedInput
        type={showPassword ? "Text" : "Password"}
        error={Boolean(errorText)}
        {...register}
        endAdornment={
          <InputAdornment position="end">
            <IconButton onClick={handleClickShowPassword} edge="end">
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
        label={label}
      />
      <Typography variant="caption" color="error">
        {errorText || ""}
      </Typography>
    </FormControl>
  )
}

export default PasswordField
