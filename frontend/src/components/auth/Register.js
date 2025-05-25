import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Alert, 
  Paper,
  CircularProgress,
  Grid,
  MenuItem
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

// Validation schema
const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  licenseNumber: Yup.string()
    .required('License number is required'),
  specialization: Yup.string()
    .required('Specialization is required'),
});

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const specializations = [
    'General Medicine',
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Emergency Medicine',
    'Anesthesiology',
    'Critical Care',
    'Other'
  ];

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Remove confirmPassword as it's not needed for API
      const { confirmPassword, ...registrationData } = values;
      
      await register(registrationData);
      setSuccess('Registration successful! You can now log in.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Typography component="h1" variant="h5">
          Doctor Registration
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
            {success}
          </Alert>
        )}
        
        <Formik
          initialValues={{ 
            firstName: '', 
            lastName: '', 
            email: '', 
            password: '', 
            confirmPassword: '',
            licenseNumber: '',
            specialization: '',
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, handleChange }) => (
            <Form noValidate style={{ width: '100%', marginTop: '1rem' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="given-name"
                    autoFocus
                    error={touched.firstName && Boolean(errors.firstName)}
                    helperText={touched.firstName && errors.firstName}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    error={touched.lastName && Boolean(errors.lastName)}
                    helperText={touched.lastName && errors.lastName}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    id="confirmPassword"
                    error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                    helperText={touched.confirmPassword && errors.confirmPassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="licenseNumber"
                    label="Medical License Number"
                    name="licenseNumber"
                    error={touched.licenseNumber && Boolean(errors.licenseNumber)}
                    helperText={touched.licenseNumber && errors.licenseNumber}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="specialization"
                    label="Specialization"
                    name="specialization"
                    value={values.specialization}
                    onChange={handleChange}
                    error={touched.specialization && Boolean(errors.specialization)}
                    helperText={touched.specialization && errors.specialization}
                  >
                    {specializations.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Register'}
              </Button>
              
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary">
                      Already have an account? Sign in
                    </Typography>
                  </Link>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default Register;