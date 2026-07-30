import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { NuqsAdapter } from 'nuqs/adapters/react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <Toaster theme="dark" richColors position="top-center" />
      <App />
    </NuqsAdapter>
  </StrictMode>,
)
