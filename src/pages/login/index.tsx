// ** React Imports
import { useState, ReactNode, MouseEvent } from 'react'

// ** Next Imports
import Link from 'next/link'

// ** MUI Components
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Box, { BoxProps } from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import useMediaQuery from '@mui/material/useMediaQuery'
import OutlinedInput from '@mui/material/OutlinedInput'
import { styled, useTheme } from '@mui/material/styles'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import Typography, { TypographyProps } from '@mui/material/Typography'
import MuiFormControlLabel, { FormControlLabelProps } from '@mui/material/FormControlLabel'
import Image from 'next/image'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'
import useBgColor from 'src/@core/hooks/useBgColor'
import { useSettings } from 'src/@core/hooks/useSettings'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import FooterIllustrationsV2 from 'src/views/pages/auth/FooterIllustrationsV2'
import { CircularProgress } from '@mui/material'

// ** Styled Components
const LoginIllustrationWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  padding: theme.spacing(20),
  paddingRight: '0 !important',
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(10)
  }
}))

const LoginIllustration = styled('img')(({ theme }) => ({
  maxWidth: '48rem',
  [theme.breakpoints.down('xl')]: {
    maxWidth: '38rem'
  },
  [theme.breakpoints.down('lg')]: {
    maxWidth: '30rem'
  }
}))

const RightWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    maxWidth: 400
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: 450
  }
}))

const BoxWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.down('md')]: {
    maxWidth: 400
  }
}))

const TypographyStyled = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontWeight: 600,
  letterSpacing: '0.18px',
  marginBottom: theme.spacing(1.5),
  [theme.breakpoints.down('md')]: { marginTop: theme.spacing(8) }
}))

const FormControlLabel = styled(MuiFormControlLabel)<FormControlLabelProps>(({ theme }) => ({
  '& .MuiFormControlLabel-label': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary
  }
}))

const schema = yup.object().shape({
  username: yup.string().required('El usuario o CI es obligatorio'),
  password: yup
    .string()
    .min(5, 'La contraseña debe tener al menos 5 caracteres')
    .required('La contraseña es obligatoria')
})


const defaultValues = {
  password: '',
  username: ''
}

interface FormData {

  // email: string
  password: string
  username: string
}

const LoginPage = () => {
  const [rememberMe, setRememberMe] = useState<boolean>(true)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false) // ← ESTADO DE CARGA

  // ** Hooks
  const auth = useAuth()
  const theme = useTheme()
  const { settings } = useSettings()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  // ** Vars
  const { skin } = settings

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
    clearErrors // ← LIMPIAR ERRORES PREVIOS
  } = useForm({
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    resolver: yupResolver(schema)
  })



  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return // ← EVITA MÚLTIPLES ENVÍOS

    setIsSubmitting(true)
    clearErrors() // ← LIMPIA ERRORES PREVIOS

    const { username, password } = data

    try {
      await auth.login({ username, password, rememberMe })
      // La redirección se maneja automáticamente en auth.login
    } catch (err: any) {
      console.error('Error en login:', err)

      // Extrae el mensaje de error de forma más robusta
      let errorMessage = 'Credenciales inválidas'

      if (typeof err === 'string') {
        errorMessage = err
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.message) {
        errorMessage = err.message
      }

      // Muestra el error de forma más específica
      setError('username', {
        type: 'manual',
        message: errorMessage
      })

      // También puedes mostrar una alerta global
      // setError('root', { type: 'manual', message: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }


  const imageSource = skin === 'bordered' ? 'auth-v2-login-illustration-bordered' : 'auth-v2-login-illustration'

  return (
    <Box className='content-right'>
      {!hidden ? (
        <Box sx={{ flex: 1, display: 'flex', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <LoginIllustrationWrapper>
            <LoginIllustration
              alt='login-illustration'
              src={`/images/pages/misc-coming-soon.png`}
            />
          </LoginIllustrationWrapper>
          <FooterIllustrationsV2 />
        </Box>
      ) : null}
      <RightWrapper sx={skin === 'bordered' && !hidden ? { borderLeft: `1px solid ${theme.palette.divider}` } : {}}>
        <Box
          sx={{
            p: 7,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.paper'
          }}
        >
          <BoxWrapper>
            <Box
              sx={{
                top: 30,
                left: 40,
                display: 'flex',
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Image
                src="/images/logos/uatf.png" // Ruta desde la carpeta 'public'
                alt="Logo UATF"
                width={127}  // Mismo ancho que el SVG original
                height={86} // Mismo alto que el SVG original
                style={{
                  objectFit: 'contain', // Ajusta cómo se escala la imagen
                  filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none', // Opcional: si necesitas ajustes de tema
                }}
              />
              <Typography variant='h6' sx={{ ml: 2, lineHeight: 1, fontWeight: 700, fontSize: '1.5rem !important' }}>
                {themeConfig.templateName}
              </Typography>
            </Box>
            <Box sx={{ mb: 6 }}>
              <TypographyStyled variant='h5'>{`Bienvenido a ${themeConfig.templateName}! 👋🏻`}</TypographyStyled>
              <Typography variant='body2'>Por favor inicia sesion en tu cuenta para comenzar. Utiliza tu Carnet de Identidad o Nombre de Usuario y contraseña</Typography>
            </Box>
            {/* 
            <Alert icon={false} sx={{ py: 3, mb: 6, ...bgColors.primaryLight, '& .MuiAlert-message': { p: 0 } }}>
              <Typography variant='caption' sx={{ mb: 2, display: 'block', color: 'primary.main' }}>
                Admin: <strong>admin</strong> / Pass: <strong>admin</strong>
              </Typography>
              <Typography variant='caption' sx={{ display: 'block', color: 'primary.main' }}>
                Supervisor: <strong>patriciaSupervisor</strong> / Pass: <strong>supervisorpassword</strong>
              </Typography>

            </Alert>*/}
            <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              {/* ALERTA PARA ERRORES GLOBALES - OPCIONAL */}
              {(errors.username?.type === 'manual' || errors.password?.type === 'manual') && (
                <Alert severity="error" sx={{ mb: 4 }}>
                  {errors.username?.message || errors.password?.message}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 4 }}>
                <Controller
                  name='username'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      autoFocus
                      label='Usuario o CI'
                      value={value}
                      onBlur={onBlur}
                      onChange={(e) => {
                        onChange(e)
                        // Limpia el error cuando el usuario empiece a escribir
                        if (errors.username?.type === 'manual') {
                          clearErrors('username')
                        }
                      }}
                      error={Boolean(errors.username)}
                      placeholder='Ingrese usuario o carnet de identidad'
                      disabled={isSubmitting} // ← DESHABILITA DURANTE CARGA
                    />
                  )}
                />
                {/* Solo muestra errores de validación, no de servidor */}
                {errors.username && errors.username.type !== 'manual' && (
                  <FormHelperText sx={{ color: 'error.main' }}>
                    {errors.username.message}
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel htmlFor='auth-login-v2-password' error={Boolean(errors.password)}>
                  Contraseña
                </InputLabel>
                <Controller
                  name='password'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <OutlinedInput
                      value={value}
                      onBlur={onBlur}
                      label='Password'
                      onChange={(e) => {
                        onChange(e)
                        // Limpia el error cuando el usuario empiece a escribir
                        if (errors.password?.type === 'manual') {
                          clearErrors('password')
                        }
                      }}
                      id='auth-login-v2-password'
                      error={Boolean(errors.password)}
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Ingrese su contraseña'
                      disabled={isSubmitting} // ← DESHABILITA DURANTE CARGA
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isSubmitting} // ← DESHABILITA DURANTE CARGA
                          >
                            <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  )}
                />
                {/* Solo muestra errores de validación, no de servidor */}
                {errors.password && errors.password.type !== 'manual' && (
                  <FormHelperText sx={{ color: 'error.main' }} id=''>
                    {errors.password.message}
                  </FormHelperText>
                )}
              </FormControl>

              <Box
                sx={{ mb: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}
              >
                <FormControlLabel
                  label='Recuerdame'
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      disabled={isSubmitting} // ← DESHABILITA DURANTE CARGA
                    />
                  }
                />
              </Box>

              <Button
                fullWidth
                size='large'
                type='submit'
                variant='contained'
                sx={{ mb: 7 }}
                disabled={isSubmitting} // ← DESHABILITA DURANTE CARGA
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'ENTRAR'
                )}
              </Button>
            </form>
          </BoxWrapper>
        </Box>
      </RightWrapper>
    </Box>
  )
}

LoginPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

LoginPage.guestGuard = true

export default LoginPage
