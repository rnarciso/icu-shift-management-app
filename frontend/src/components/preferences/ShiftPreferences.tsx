import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Divider,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';

// Tipos para as preferências
type PreferenceLevel = 0 | 1 | 2 | 3; // 0: Indisponível, 1: Baixa, 2: Média, 3: Alta
type DayOfWeek = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
type ShiftTime = 'manha' | 'tarde' | 'noite';

interface ShiftPreference {
  day: DayOfWeek;
  time: ShiftTime;
  level: PreferenceLevel;
}

const daysOfWeek: { key: DayOfWeek; label: string }[] = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' }
];

const shiftTimes: { key: ShiftTime; label: string }[] = [
  { key: 'manha', label: 'Manhã (07h-13h)' },
  { key: 'tarde', label: 'Tarde (13h-19h)' },
  { key: 'noite', label: 'Noite (19h-07h)' }
];

const ShiftPreferences: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ShiftPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`/api/preferences/doctors/${user?.id}', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (response.ok) {
          const { data } = await response.json();
          // Remapear os dados da API para o formato do estado local
          const formattedPreferences: ShiftPreference[] = [];
          for (const day in data.preferences.byDayOfWeek) {
            for (const shiftId in data.preferences.byDayOfWeek[day]) {
              const shift = data.preferences.byDayOfWeek[day][shiftId];
              formattedPreferences.push({
                day: daysOfWeek[parseInt(day)].key,
                time: shift.shift_name.toLowerCase().includes('manhã') ? 'manha' : shift.shift_name.toLowerCase().includes('tarde') ? 'tarde' : 'noite',
                level: shift.preference_level
              });
            }
          }
          setPreferences(formattedPreferences);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const handlePreferenceChange = (day: DayOfWeek, time: ShiftTime, level: PreferenceLevel) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.day === day && pref.time === time 
          ? { ...pref, level } 
          : pref
      )
    );
  };

  const getPreferenceLevel = (day: DayOfWeek, time: ShiftTime): PreferenceLevel => {
    const pref = preferences.find(p => p.day === day && p.time === time);
    return pref ? pref.level : 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/preferences/doctors/${user?.id}', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        setError('Erro ao salvar preferências. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao salvar preferências. Tente novamente.');
      console.error('Erro ao salvar preferências:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Preferências de Plantão
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Indique suas preferências para cada dia e turno. Suas escolhas serão consideradas na geração da escala.
        </Typography>
        
        <Box sx={{ my: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, bgcolor: '#f44336', borderRadius: 1, mr: 1 }} />
              <Typography variant="body2">Indisponível</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, bgcolor: '#ffeb3b', borderRadius: 1, mr: 1 }} />
              <Typography variant="body2">Preferência Baixa</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, bgcolor: '#ff9800', borderRadius: 1, mr: 1 }} />
              <Typography variant="body2">Preferência Média</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', borderRadius: 1, mr: 1 }} />
              <Typography variant="body2">Preferência Alta</Typography>
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dia/Turno</TableCell>
                  {shiftTimes.map(time => (
                    <TableCell key={time.key}>{time.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {daysOfWeek.map(day => (
                  <TableRow key={day.key}>
                    <TableCell component="th" scope="row">
                      <Typography fontWeight="bold">{day.label}</Typography>
                    </TableCell>
                    {shiftTimes.map(time => (
                      <TableCell key={`${day.key}-${time.key}`}>
                        <FormControl component="fieldset">
                          <RadioGroup
                            row
                            value={getPreferenceLevel(day.key, time.key)}
                            onChange={(e) => handlePreferenceChange(
                              day.key, 
                              time.key, 
                              parseInt(e.target.value) as PreferenceLevel
                            )}
                          >
                            <FormControlLabel 
                              value={0} 
                              control={<Radio size="small" sx={{ color: '#f44336', '&.Mui-checked': { color: '#f44336' } }} />} 
                              label="0" 
                            />
                            <FormControlLabel 
                              value={1} 
                              control={<Radio size="small" sx={{ color: '#ffeb3b', '&.Mui-checked': { color: '#ffeb3b' } }} />} 
                              label="1" 
                            />
                            <FormControlLabel 
                              value={2} 
                              control={<Radio size="small" sx={{ color: '#ff9800', '&.Mui-checked': { color: '#ff9800' } }} />} 
                              label="2" 
                            />
                            <FormControlLabel 
                              value={3} 
                              control={<Radio size="small" sx={{ color: '#4caf50', '&.Mui-checked': { color: '#4caf50' } }} />} 
                              label="3" 
                            />
                          </RadioGroup>
                        </FormControl>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Preferências salvas com sucesso!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ShiftPreferences;