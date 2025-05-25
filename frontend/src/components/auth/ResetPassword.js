import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
const ResetPasswordSchema = Yup.object().shape({
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
});

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await resetPassword(token, values.password);
      setSuccess('Password has been reset successfully!');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again or request a new reset link.');
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
          Set New Password
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
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={ResetPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form noValidate style={{ width: '100%', marginTop: '1rem' }}>
              <Field
                as={TextField}
                variant="outlined"
                margin="normal"
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
              
              <Field
                as={TextField}
                variant="outlined"
                margin="normal"
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                helperText={touched.confirmPassword && errors.confirmPassword}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Reset Password'}
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

export default ResetPassword;