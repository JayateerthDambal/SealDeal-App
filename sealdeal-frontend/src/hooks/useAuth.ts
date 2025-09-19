import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Custom hook to easily access auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

