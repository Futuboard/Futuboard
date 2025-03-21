import { Divider, Paper, Stack, Typography } from "@mui/material"

interface ChartToolTipProps {
  active: boolean
  payload: Array<{ [key: string]: string }>
  label: string
  labelFormatter: (label: string) => string
  isReverse?: boolean
  highlightedItem?: string
}

const ChartToolTip: React.FC<ChartToolTipProps> = ({
  active,
  payload,
  label,
  labelFormatter,
  isReverse,
  highlightedItem
}) => {
  if (active && payload) {
    return (
      <Paper>
        <Stack padding={1}>
          <Typography variant="h6" sx={{ paddingRight: 2 }}>
            {labelFormatter(label)}
          </Typography>
          <Divider sx={{ marginBottom: 1, marginTop: 0.25 }} />
          <Stack direction={isReverse ? "column-reverse" : "column"}>
            {payload.map((val: { [key: string]: string }) => (
              <Typography key={val.name} color={val.fill} fontWeight={val.name == highlightedItem ? 900 : "normal"}>
                {val.name}: {val.value}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Paper>
    )
  }
}

export default ChartToolTip
