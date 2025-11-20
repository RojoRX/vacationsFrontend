// ** MUI Import
import { useTheme } from '@mui/material/styles'
import Box, { BoxProps } from '@mui/material/Box'
import { keyframes } from '@mui/system'

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
`

const FallbackSpinner = ({ sx }: { sx?: BoxProps['sx'] }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        ...sx
      }}
    >
      <Box
        component="img"
        src="/images/logos/uatf.png"
        alt="Logo UATF"
        width={250}   // ajusta según lo necesites
        height={152}   // ajusta según lo necesites
        sx={{
          objectFit: 'contain',
          animation: `${pulse} 1.2s ease-in-out infinite`
        }}
      />
    </Box>
  )
}

export default FallbackSpinner
