import { useCallback, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { ToastProvider } from './components/ui/Toast';
import { AppRoutes } from './routes/AppRoutes';
import { BrandStyles } from './components/app/Brand';
import { SplashIntro } from './components/app/SplashIntro';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1, refetchOnWindowFocus: false } },
});

/* The truck intro plays every time the app opens, and once per visit on the website's app pages
   (not on the marketing home page or the admin panel). */
const shouldShowSplash = () => {
  if (Capacitor.isNativePlatform()) return true;
  const path = window.location.pathname;
  if (path === '/' || path.startsWith('/admin')) return false;
  try {
    if (sessionStorage.getItem('rw-splash-seen')) return false;
    sessionStorage.setItem('rw-splash-seen', '1');
  } catch { /* private mode */ }
  return true;
};

function App() {
  const [splash, setSplash] = useState(shouldShowSplash);
  const done = useCallback(() => setSplash(false), []);
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrandStyles />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        {splash && <SplashIntro onDone={done} />}
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
