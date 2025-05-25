import React, { useState, useEffect } from 'react';
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
  MenuItem,
  Divider
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

// Validation schema
const ProfileSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  licenseNumber: Yup.string()
    .required('License number is required'),
  specialization: Yup.string()
    .required('Specialization is required'),
  currentPassword: Yup.string()
    .when('newPassword', {
      is: val => val && val.length > 0,
      then: () => Yup.string().required('Current password is required to change password'),
      otherwise: () => Yup.string()
    }),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .when('newPassword', {
      is: val => val && val.length > 0,
      then: () => Yup.string().required('Confirm password is required'),
      otherwise: () => Yup.string()
    }),
});

const ProfileForm = () => {
  const { currentUser, updateProfile } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialization: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

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

  useEffect(() => {
    if (currentUser) {
      setInitialValues({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        licenseNumber: currentUser.licenseNumber || '',
        specialization: currentUser.specialization || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    }
  }, [currentUser]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Extract password fields
      const { currentPassword, newPassword, confirmNewPassword, ...profileData } = values;
      
      // Only include password fields if user is changing password
      const updateData = { ...profileData };
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }
      
      await updateProfile(updateData);
      setSuccess('Profile updated successfully!');
      
      // Reset password fields
      setInitialValues(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 4, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Typography component="h1" variant="h5">
          Profile Settings
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
          enableReinitialize
          initialValues={initialValues}
          validationSchema={ProfileSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, handleChange }) => (
            <Form noValidate style={{ width: '100%', marginTop: '1rem' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Personal Information
              </Typography>
              
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
                <Grid item xs={12} sm={6}>
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
                    id="phone"
                    label="Phone Number"
                    name="phone"
                    autoComplete="tel"
                    error={touched.phone && Boolean(errors.phone)}
                    helperText={touched.phone && errors.phone}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                Professional Information
              </Typography>
              
              <Grid container spacing={2}>
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
              
              <Divider sx={{ my: 4 }} />
              
              <Typography variant="h6" sx={{ mb: 2 }}>
                Change Password (Optional)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    name="currentPassword"
                    label="Current Password"
                    type="password"
                    id="currentPassword"
                    error={touched.currentPassword && Boolean(errors.currentPassword)}
                    helperText={touched.currentPassword && errors.currentPassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    name="newPassword"
                    label="New Password"
                    type="password"
                    id="newPassword"
                    error={touched.newPassword && Boolean(errors.newPassword)}
                    helperText={touched.newPassword && errors.newPassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    name="confirmNewPassword"
                    label="Confirm New Password"
                    type="password"
                    id="confirmNewPassword"
                    error={touched.confirmNewPassword && Boolean(errors.confirmNewPassword)}
                    helperText={touched.confirmNewPassword && errors.confirmNewPassword}
                  />
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 4, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default ProfileForm;