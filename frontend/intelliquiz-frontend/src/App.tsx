import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import { useGlobalSecurityPolicy } from './hooks/useGlobalSecurityPolicy';

function AppShell() {
  useGlobalSecurityPolicy();
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}