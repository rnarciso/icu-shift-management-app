import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Alert, 
  Paper,
  CircularProgress,
  Grid
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await forgotPassword(values.email);
      setSuccess('Password reset instructions have been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to process your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
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
          Reset Password
        </Typography>
        
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
          Enter your email address and we'll send you a link to reset your password.
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
          initialValues={{ email: '' }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form noValidate style={{ width: '100%', marginTop: '1rem' }}>
              <Field
                as={TextField}
                variant="outlined"
                margin="normal"
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
              
              <Grid container justifyContent="center">
                <Grid item>
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary">
                      Back to Sign In
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

export default ForgotPassword;