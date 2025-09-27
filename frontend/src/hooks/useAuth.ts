import { useContext } from 'react';
import { useAuthContext } from '../context/AuthContext';

const useAuth = () => {
  return useAuthContext();
};

export default useAuth;
