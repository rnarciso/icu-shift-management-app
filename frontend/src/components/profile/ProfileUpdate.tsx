import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box, 
  Container, 
  Divider,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  crm: string;
  specialtyId: string;
  hasTEMI: boolean;
  temiCertificationDate?: string;
  hasResidency: boolean;
  residencyCompletionDate?: string;
  interestedInReference: boolean;
  yearsInICU: string;
  additionalQualifications: string;
}

const ProfileUpdate: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    crm: '',
    specialtyId: '',
    hasTEMI: false,
    hasResidency: false,
    interestedInReference: false,
    yearsInICU: '',
    additionalQualifications: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (response.ok) {
          const { data } = await response.json();
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.doctor.phone || '',
            crm: `${data.doctor.crm_number}/${data.doctor.crm_state}` || '',
            specialtyId: data.doctor.specialty_id || '',
            hasTEMI: data.qualifications.some(q => q.name === 'TEMI'),
            temiCertificationDate: data.qualifications.find(q => q.name === 'TEMI')?.certification_date || '',
            hasResidency: data.qualifications.some(q => q.name === 'Residência em Medicina Intensiva'),
            residencyCompletionDate: data.qualifications.find(q => q.name === 'Residência em Medicina Intensiva')?.certification_date || '',
            interestedInReference: data.doctor.interestedInReference || false,
            yearsInICU: data.doctor.experience_years || '',
            additionalQualifications: data.doctor.bio || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        setError('Erro ao atualizar perfil. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao atualizar perfil. Tente novamente.');
      console.error('Erro ao atualizar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Atualização de Dados Cadastrais
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Mantenha seus dados atualizados para garantir o correto funcionamento do sistema de escalas.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Dados Pessoais */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Dados Pessoais
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
                label="Nome Completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              
              <TextField
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
                label="Telefone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              
              <TextField
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
                label="CRM"
                name="crm"
                value={formData.crm}
                onChange={handleChange}
                required
                helperText="Formato: número/UF (ex: 123456/SP)"
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControl sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                <InputLabel id="specialty-label">Especialidade Principal</InputLabel>
                <Select
                  labelId="specialty-label"
                  name="specialtyId"
                  value={formData.specialtyId}
                  onChange={handleSelectChange}
                  label="Especialidade Principal"
                  required
                >
                  <MenuItem value="1">Medicina Intensiva</MenuItem>
                  <MenuItem value="2">Clínica Médica</MenuItem>
                  <MenuItem value="3">Cardiologia</MenuItem>
                  <MenuItem value="4">Pneumologia</MenuItem>
                  <MenuItem value="5">Nefrologia</MenuItem>
                  <MenuItem value="6">Neurologia</MenuItem>
                  <MenuItem value="7">Infectologia</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
                label="Anos de Experiência em UTI"
                name="yearsInICU"
                type="number"
                value={formData.yearsInICU}
                onChange={handleChange}
                required
              />
            </Box>
            
            {/* Qualificações */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Qualificações
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasTEMI}
                      onChange={handleCheckboxChange}
                      name="hasTEMI"
                    />
                  }
                  label="Possui TEMI (Título de Especialista em Medicina Intensiva)"
                />
                
                {formData.hasTEMI && (
                  <TextField
                    fullWidth
                    label="Data de Certificação TEMI"
                    name="temiCertificationDate"
                    type="date"
                    value={formData.temiCertificationDate || ''}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mt: 2 }}
                  />
                )}
              </Box>
              
              <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasResidency}
                      onChange={handleCheckboxChange}
                      name="hasResidency"
                    />
                  }
                  label="Possui Residência em Medicina Intensiva"
                />
                
                {formData.hasResidency && (
                  <TextField
                    fullWidth
                    label="Data de Conclusão da Residência"
                    name="residencyCompletionDate"
                    type="date"
                    value={formData.residencyCompletionDate || ''}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mt: 2 }}
                  />
                )}
              </Box>
            </Box>
            
            <Box>
              <TextField
                fullWidth
                label="Qualificações Adicionais"
                name="additionalQualifications"
                multiline
                rows={3}
                value={formData.additionalQualifications}
                onChange={handleChange}
                helperText="Liste outras certificações, cursos ou especializações relevantes"
              />
            </Box>
            
            {/* Preferências */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Preferências
              </Typography>
            </Box>
            
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.interestedInReference}
                    onChange={handleCheckboxChange}
                    name="interestedInReference"
                  />
                }
                label="Tenho interesse em atuar como Médico de Referência"
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                fullWidth
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </Box>
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
          Perfil atualizado com sucesso!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfileUpdate;