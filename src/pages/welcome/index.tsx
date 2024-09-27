import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Component Import
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

const WelcomeDashboard = () => {
  return (
    <ApexChartWrapper>
      <Grid container spacing={6} className='match-height'>
        {/* Card de bienvenida */}
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Bienvenido, {}!
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Este es tu sistema de gestión de vacaciones. Aquí puedes solicitar días de vacaciones o licencias. 
                Además, puedes revisar el estado actual de tus solicitudes y los días de vacaciones restantes.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Acciones rápidas */}
        <Grid item xs={12} md={6}>
          <CardStatisticsVertical
            stats="Solicitar Vacaciones"
            color="primary"
            icon={<Icon icon="mdi:beach" />}
            title="Vacaciones"
            chipText="Disponible"
            trendNumber="+1 Solicitud"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <CardStatisticsVertical
            stats="Solicitar Licencia"
            color="secondary"
            icon={<Icon icon="mdi:briefcase" />}
            title="Licencia"
            chipText="Disponible"
            trendNumber="+1 Solicitud"
          />
        </Grid>

        {/* Botones de acceso rápido */}
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:beach" />}
            fullWidth
          >
            Solicitar Vacaciones
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Icon icon="mdi:briefcase" />}
            fullWidth
          >
            Solicitar Licencia
          </Button>
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

// Configurar ACL para dar acceso a clientes
WelcomeDashboard.acl = {
  action: 'read',
  subject: 'welcome-dashboard'  // El mismo subject que en las reglas de CASL
}

export default WelcomeDashboard
