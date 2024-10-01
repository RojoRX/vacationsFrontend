import React, { useState } from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

// Formulario de solicitud de vacaciones
const VacationRequestForm = () => {
  // Cambiar el tipo a Date | null
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [vacationDays, setVacationDays] = useState(15) // Suponiendo días disponibles basados en antigüedad

  const handleVacationRequest = () => {
    // Aquí puedes hacer la lógica de envío de solicitud
    console.log('Solicitud enviada:', { startDate, endDate })
  }

  return (
    <ApexChartWrapper>
      <Grid container spacing={6} className='match-height'>
        {/* Título del formulario */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Solicitud de Vacaciones
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Aquí puedes solicitar tus vacaciones seleccionando las fechas deseadas. Tienes {vacationDays} días disponibles.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Selección de fechas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Selecciona el inicio de tus vacaciones
              </Typography>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)} // No hay más error de tipos aquí
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona una fecha"
                minDate={new Date()}
                className="form-control"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Selecciona el fin de tus vacaciones
              </Typography>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)} // No hay más error de tipos aquí
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona una fecha"
                minDate={startDate}
                className="form-control"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Botón de solicitud */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:beach" />}
            fullWidth
            onClick={handleVacationRequest}
            disabled={!startDate || !endDate} // Deshabilitar el botón si no hay fechas seleccionadas
          >
            Enviar Solicitud de Vacaciones
          </Button>
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}
// Configurar ACL para dar acceso según el rol
VacationRequestForm.acl = {
    action: 'create',
    subject: 'vacation-request'  // Este subject debe coincidir con las reglas de tu ACL
  }
  
export default VacationRequestForm
