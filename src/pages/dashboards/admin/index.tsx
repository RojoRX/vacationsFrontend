// ** React Imports
import { useEffect, useState } from 'react'

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

// ** Next Router
import { useRouter } from 'next/router'

// ** Axios
import axios from 'src/lib/axios'

const AdminDashboard = () => {
  const [pendingVacationRequests, setPendingVacationRequests] = useState(0)
  const [todayVacationRequests, setTodayVacationRequests] = useState(0)
  const [pendingLicenseRequests, setPendingLicenseRequests] = useState(0)
  const [todayLicenseRequests, setTodayLicenseRequests] = useState(0)

  const router = useRouter()

  useEffect(() => {
    const fetchVacationRequests = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/hr-pending`)
        const requests = response.data
        setPendingVacationRequests(requests.length)

        const today = new Date().toISOString().split('T')[0]
        const todayCount = requests.filter((req: any) => req.requestDate === today).length
        setTodayVacationRequests(todayCount)
      } catch (error) {
        console.error('Error al obtener solicitudes de vacaciones pendientes:', error)
      }
    }

    const fetchLicenseRequests = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/hr-pending`)
        const requests = response.data
        setPendingLicenseRequests(requests.length)

        const today = new Date().toISOString().split('T')[0]
        const todayCount = requests.filter((req: any) => {
          const issued = req.issuedDate?.split('T')[0]
          return issued === today
        }).length
        setTodayLicenseRequests(todayCount)
      } catch (error) {
        console.error('Error al obtener solicitudes de licencias pendientes:', error)
      }
    }

    fetchVacationRequests()
    fetchLicenseRequests()
  }, [])

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
            stats={`${pendingVacationRequests} Solicitudes Pendientes`}
            color="primary"
            icon={<Icon icon="mdi:beach" />}
            title="Solicitudes de Vacaciones"
            chipText="Revisar"
            trendNumber={`+${todayVacationRequests} Hoy`}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <CardStatisticsVertical
            stats={`${pendingLicenseRequests} Solicitudes Pendientes`}
            color="secondary"
            icon={<Icon icon="mdi:briefcase" />}
            title="Solicitudes de Licencia"
            chipText="Revisar"
            trendNumber={`+${todayLicenseRequests} Hoy`}
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
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:clipboard-list" />}
            fullWidth
            onClick={() => router.push('/vacations/vacations-admin/')}
          >
            Revisar Solicitudes de Vacaciones
          </Button>
        </Grid>

        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Icon icon="mdi:briefcase-outline" />}
            fullWidth
            onClick={() => router.push('/permissions/adminlicenses/')}
          >
            Revisar Solicitudes de Permisos
          </Button>
        </Grid>

        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="success"
            startIcon={<Icon icon="mdi:account-multiple" />}
            fullWidth
            onClick={() => router.push('/users/search-users/')}
          >
            Gestionar Usuarios
          </Button>
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default AdminDashboard
