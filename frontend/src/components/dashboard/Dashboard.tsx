import React from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

// Ícones simulados
const CalendarIcon = () => <span>📅</span>;
const ProfileIcon = () => <span>👤</span>;
const PreferencesIcon = () => <span>🗓️</span>;
const NotificationIcon = () => <span>🔔</span>;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Dados simulados para o dashboard
  const upcomingShifts = [
    { date: '30/05/2025', day: 'Quinta', time: 'Manhã (07h-13h)', role: 'Médico de Referência' },
    { date: '02/06/2025', day: 'Segunda', time: 'Tarde (13h-19h)', role: 'Médico Assistente' },
    { date: '05/06/2025', day: 'Quinta', time: 'Manhã (07h-13h)', role: 'Médico de Referência' }
  ];
  
  const notifications = [
    { id: 1, message: 'Sua escala do próximo mês foi publicada', date: '27/05/2025' },
    { id: 2, message: 'Lembrete: Atualização de certificação TEMI em 60 dias', date: '26/05/2025' },
    { id: 3, message: 'Nova política de plantões disponível', date: '20/05/2025' }
  ];
  
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bem-vindo, {user?.name?.split(' ')[0] || 'Médico'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aqui você pode gerenciar seu perfil, preferências e visualizar sua escala de plantões.
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: {xs: 'column', md: 'row'}, gap: 4 }}>
        {/* Coluna principal */}
        <Box sx={{ flex: '1 1 66%' }}>
          {/* Próximos plantões */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                <CalendarIcon /> Próximos Plantões
              </Typography>
              <Button variant="outlined" size="small">
                Ver Todos
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {upcomingShifts.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {upcomingShifts.map((shift, index) => (
                  <Box key={index} sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>
                          {shift.date}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {shift.day}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {shift.time}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Função: {shift.role}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                Não há plantões agendados para os próximos dias.
              </Typography>
            )}
          </Paper>
          
          {/* Ações rápidas */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Ações Rápidas
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<ProfileIcon />}
                  onClick={() => navigate('/profile')}
                  sx={{ py: 1.5 }}
                >
                  Atualizar Perfil
                </Button>
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<PreferencesIcon />}
                  onClick={() => navigate('/preferences')}
                  color="secondary"
                  sx={{ py: 1.5 }}
                >
                  Definir Preferências
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {/* Estatísticas */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Resumo de Plantões
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 20%', minWidth: '100px', textAlign: 'center' }}>
                <Typography variant="h4" color="primary">12</Typography>
                <Typography variant="body2" color="text.secondary">Plantões Realizados</Typography>
              </Box>
              <Box sx={{ flex: '1 1 20%', minWidth: '100px', textAlign: 'center' }}>
                <Typography variant="h4" color="primary">3</Typography>
                <Typography variant="body2" color="text.secondary">Plantões Previstos</Typography>
              </Box>
              <Box sx={{ flex: '1 1 20%', minWidth: '100px', textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">2</Typography>
                <Typography variant="body2" color="text.secondary">Como Referência</Typography>
              </Box>
              <Box sx={{ flex: '1 1 20%', minWidth: '100px', textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">+1</Typography>
                <Typography variant="body2" color="text.secondary">Saldo</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
        
        {/* Coluna lateral */}
        <Box sx={{ flex: '1 1 33%' }}>
          {/* Perfil resumido */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                <ProfileIcon /> Meu Perfil
              </Typography>
              <Button 
                variant="text" 
                size="small"
                onClick={() => navigate('/profile')}
              >
                Editar
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Nome" 
                  secondary={user?.name || 'Dr. Exemplo'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Email" 
                  secondary={user?.email || 'medico@exemplo.com'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="CRM" 
                  secondary="123456/SP" 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Qualificações" 
                  secondary="TEMI, Residência em Medicina Intensiva" 
                />
              </ListItem>
            </List>
          </Paper>
          
          {/* Notificações */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                <NotificationIcon /> Notificações
              </Typography>
              <Button variant="text" size="small">
                Ver Todas
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {notifications.length > 0 ? (
              <List>
                {notifications.map((notification) => (
                  <React.Fragment key={notification.id}>
                    <ListItem alignItems="flex-start">
                      <Box sx={{ mr: 1 }}>
                        <NotificationIcon />
                      </Box>
                      <ListItemText
                        primary={notification.message}
                        secondary={`${notification.date}`}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                Não há notificações no momento.
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
