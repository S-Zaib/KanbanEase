import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../components/Login';
import { Register } from '../components/Register';
import { supabase } from '../lib/supabase';

// Mock supabase auth methods
jest.mock('../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn()
      }
    }
  };
});

describe('Authentication', () => {
  // Test for user login
  test('US: Create an account and log in securely', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });
    
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    userEvent.type(emailInput, 'test@example.com');
    userEvent.type(passwordInput, 'password123');
    
    const loginButton = screen.getByRole('button', { name: /sign in/i });
    
    await act(async () => {
      userEvent.click(loginButton);
    });
    
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  // Test for user registration
  test('US: Register a new account', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: 'new-user-123' } },
      error: null
    });
    
    render(<Register />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    userEvent.type(emailInput, 'newuser@example.com');
    userEvent.type(passwordInput, 'securePass123');
    
    const registerButton = screen.getByRole('button', { name: /sign up/i });
    
    await act(async () => {
      userEvent.click(registerButton);
    });
    
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'securePass123'
    });
  });
  
  // Test for password validation
  test('US: Secure password validation during registration', async () => {
    render(<Register />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    userEvent.type(emailInput, 'newuser@example.com');
    userEvent.type(passwordInput, 'weak');
    
    const registerButton = screen.getByRole('button', { name: /sign up/i });
    
    await act(async () => {
      userEvent.click(registerButton);
    });
    
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });
});
