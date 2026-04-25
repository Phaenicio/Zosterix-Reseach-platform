import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { api } from '@/api/client'

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { dispatch } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token')
      const profileComplete = searchParams.get('profile_complete') === 'true'

      if (!token) {
        navigate('/login?error=oauth_failed')
        return
      }

      // Remove token from URL
      window.history.replaceState({}, '', '/auth/callback')

      try {
        // Fetch user data since backend redirect only gives token
        // Wait, the prompt says "The frontend reads the token from the URL query param (brief window), stores it in memory, then immediately clears the URL"
        // I should also fetch the user info to populate the store.
        const response = await api.get('/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
        
        const user = response.data.data.user;

        dispatch({
          type: 'SET_AUTH',
          payload: {
            accessToken: token,
            user: {
                ...user,
                profile_complete: profileComplete
            },
          },
        })

        if (!profileComplete) {
          navigate('/profile/setup')
        } else {
          navigate('/feed')
        }
      } catch (err) {
        navigate('/login?error=oauth_failed')
      }
    }

    handleCallback()
  }, [searchParams, dispatch, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-black" />
      <p className="text-sm font-medium text-zinc-500">Completing sign in...</p>
    </div>
  )
}
