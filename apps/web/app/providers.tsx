'use client';

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { ReactNode } from 'react';

import { AuthContext, useAuthProvider } from '@/lib/hooks/useAuth';
import { theme } from '@/theme';

function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <AuthProvider>{children}</AuthProvider>
      </ChakraProvider>
    </>
  );
}

