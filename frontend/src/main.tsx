import { BrowserRouter } from 'react-router-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/auth.context'
import { ChatProvider } from './contexts/chat.context'
import { NotificationProvider } from './contexts/notification.context'
import { resolveBaseUrls } from './services/url-resolver'
import { initApiBaseUrl } from './services/api.client'
import './index.css'
import './styles/responsive.css' // RESPONSIVE FIX: global responsive overrides
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

resolveBaseUrls().then(() => {
  initApiBaseUrl()
  createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
  )
})
