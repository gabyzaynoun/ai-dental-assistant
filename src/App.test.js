// src/App.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock react-dnd
jest.mock('react-dnd', () => ({
  DndProvider: ({ children }) => children,
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));

// Mock the Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null); // Simulate not logged in
    return jest.fn(); // Unsubscribe function
  }),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  getDocs: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Basic tests
describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders the app title', () => {
    render(<App />);
    const titleElement = screen.getByText(/AI Dental Assistant/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('shows create chat button when no chats exist', () => {
    render(<App />);
    const createButton = screen.getByText(/Create Your First Chat/i);
    expect(createButton).toBeInTheDocument();
  });

  test('toggle dark mode button exists', () => {
    render(<App />);
    // Find button with dark mode SVG
    const darkModeButton = document.querySelector('button svg');
    expect(darkModeButton).toBeInTheDocument();
  });

  test('authentication component renders login form', () => {
    render(<App />);
    const loginText = screen.getByText(/Login/i);
    expect(loginText).toBeInTheDocument();
    
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });
});

// Test utility functions separately
describe('Encryption Utilities', () => {
  test('encrypted API key is not stored in plaintext', () => {
    // Mock implementation that sets the encrypted key in localStorage
    const mockEncryptedKey = 'ENCRYPTED_DATA_EXAMPLE';
    jest.spyOn(localStorage, 'setItem').mockImplementation();
    
    render(<App />);
    
    // Test saving an API key
    const apiKeyInput = screen.getByPlaceholderText(/Enter OpenAI API key/i);
    const saveButton = screen.getByText(/Save/i);
    
    fireEvent.change(apiKeyInput, { target: { value: 'sk-testkey123456' } });
    fireEvent.click(saveButton);
    
    // Verify localStorage was called with an encrypted value, not the plain key
    expect(localStorage.setItem).toHaveBeenCalled();
    const setItemCalls = localStorage.setItem.mock.calls;
    
    // Find the call that saved the API key
    const apiKeySaveCall = setItemCalls.find(call => call[0] === 'encrypted_openai_api_key');
    
    // Check that it was encrypted (not the plain value)
    expect(apiKeySaveCall).toBeTruthy();
    expect(apiKeySaveCall[1]).not.toBe('sk-testkey123456');
  });
});