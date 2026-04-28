import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { OAuthCallbackPage } from './pages/auth/OAuthCallbackPage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { SecuritySettingsPage } from './pages/SecuritySettingsPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { MainLayout } from './components/layout/MainLayout'
import { ResearcherDashboardPage } from './pages/researcher/ResearcherDashboardPage'
import { AccountSettingsPage } from './pages/profile/AccountSettingsPage'



export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <ResearcherDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'feed',
        element: (
          <ProtectedRoute>
            <ComingSoonPage title="Research Feed" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forum',
        element: <ComingSoonPage title="Community Forum" />,
      },
      {
        path: 'supervisors',
        element: <ComingSoonPage title="Supervisor Directory" />,
      },
      {
        path: 'blog',
        element: <ComingSoonPage title="Zosterix Blog" />,
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/profile',
        element: (
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/emails',
        element: (
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/notifications',
        element: (
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/security',
        element: (
          <ProtectedRoute>
            <SecuritySettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/auth/callback',
    element: <OAuthCallbackPage />,
  },
  {
    path: '/profile/setup',
    element: (
      <ProtectedRoute>
        <ProfileSetupPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
