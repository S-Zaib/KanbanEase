import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Define Vite environment variables
process.env.VITE_SUPABASE_URL = "https://rzrfyjnpslhxxosxgjqe.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6cmZ5am5wc2xoeHhvc3hnanFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMTY1NzksImV4cCI6MjA1Nzc5MjU3OX0.4T7EFcFZwJ4yKGYzl2yU08NgPZssK7kOIRLJSDj4mbM";


// Mock window properties
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.alert
global.alert = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
