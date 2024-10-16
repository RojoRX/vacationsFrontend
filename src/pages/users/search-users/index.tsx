import React, { useState } from 'react';
import { TextField, Button, Grid, Card, CardContent, Typography, Container, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';
import { User } from 'src/interfaces/usertypes';
import router from 'next/router';

const SearchUsers = () => {
  const [ci, setCi] = useState('');
  const [users, setUsers] = useState<User[]>([]);  // Usar la interfaz User aquí
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/search-by-ci?ci=${ci}`);
      setUsers(response.data);
    } catch (err) {
      setUsers([]);
      setError('No users found or an error occurred.');
    } finally {
      setLoading(false);
    }
  };
  const handleViewDetails = (ci: string) => {
    router.push(`/users/${ci}`); // Navega a la página de detalles pasando el ci
  };
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Buscar Usuarios por CI
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={9}>
          <TextField
            label="Carnet de Identidad (CI)"
            variant="outlined"
            fullWidth
            value={ci}
            onChange={(e) => setCi(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Buscar'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {users.length > 0 &&
          users.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{user.fullName}</Typography>
                  <Typography color="textSecondary">CI: {user.ci}</Typography>
                  <Typography color="textSecondary">Username: {user.username}</Typography>
                  <Typography color="textSecondary">Celular: {user.celular || 'No registrado'}</Typography>
                  <Typography color="textSecondary">Profesión: {user.profesion || 'No registrado'}</Typography>
                  <Typography color="textSecondary">Posición: {user.position}</Typography>
                  <Typography color="textSecondary">Rol: {user.role}</Typography>
                  <Typography color="textSecondary">
                    Fecha de Ingreso: {new Date(user.fecha_ingreso).toLocaleDateString()}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleViewDetails(user.ci)} // Llama a la función con el ci del usuario
                    sx={{ mt: 2 }} // Agrega un margen superior
                  >
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Container>
  );
};

export default SearchUsers;
