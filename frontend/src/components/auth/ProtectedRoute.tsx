import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { state } = useAuth()
  const location = useLocation()

  if (state.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && state.user && !roles.includes(state.user.role)) {
    return <Navigate to="/feed" replace />
  }

  return <>{children}</>
}
