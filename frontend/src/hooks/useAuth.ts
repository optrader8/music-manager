import { useMemo } from 'react';

import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useAuthContext();

  const ability = useMemo(
    () => ({
      canEditLibrary: context.user?.roles.includes('editor') ?? false,
      isAdmin: context.user?.roles.includes('admin') ?? false,
    }),
    [context.user?.roles]
  );

  return {
    ...context,
    ability,
  };
}
