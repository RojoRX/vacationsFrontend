// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Component Import
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

const AdminDashboard = () => {
  return (
    <ApexChartWrapper>
      <Grid container spacing={6} className='match-height'>
        
        {/* Card de bienvenida */}
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Bienvenido, Administrador!
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Desde este panel puedes gestionar las solicitudes de vacaciones, usuarios, y revisar las estadísticas del sistema.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Estadísticas rápidas */}
        <Grid item xs={12} md={4}>
          <CardStatisticsVertical
            stats="10 Nuevas Solicitudes"
            color="primary"
            icon={<Icon icon="mdi:beach" />}
            title="Solicitudes de Vacaciones"
            chipText="Revisar"
            trendNumber="+2 Hoy"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CardStatisticsVertical
            stats="5 Nuevas Solicitudes"
            color="secondary"
            icon={<Icon icon="mdi:briefcase" />}
            title="Solicitudes de Licencia"
            chipText="Revisar"
            trendNumber="+1 Hoy"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CardStatisticsVertical
            stats="150 Usuarios Activos"
            color="success"
            icon={<Icon icon="mdi:account-group" />}
            title="Usuarios"
            chipText="Gestionar"
            trendNumber="+10 Nuevos"
          />
        </Grid>

        {/* Botones de acceso rápido */}
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:account-multiple" />}
            fullWidth
          >
            Gestionar Usuarios
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Icon icon="mdi:clipboard-list" />}
            fullWidth
          >
            Revisar Solicitudes de Vacaciones
          </Button>
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default AdminDashboard
