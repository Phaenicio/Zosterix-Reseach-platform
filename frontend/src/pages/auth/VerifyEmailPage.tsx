import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided.')
        return
      }

      try {
        await api.post('/api/v1/auth/verify-email', { token })
        setStatus('success')
      } catch (err: any) {
        setStatus('error')
        setMessage(err.response?.data?.error?.message || 'Verification failed.')
      }
    }

    verify()
  }, [token])

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4">
      <Card className="w-full max-w-[480px] text-center border-none shadow-none">
        <CardContent className="pt-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-zinc-300" />
              <CardTitle className="text-2xl font-black tracking-tighter">Verifying your email...</CardTitle>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                <CheckCircle2 className="h-10 w-10 text-black" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter">Email verified!</CardTitle>
              <CardDescription className="text-zinc-500">
                Your email has been successfully verified. You can now access all features of Zosterix.
              </CardDescription>
              <Link to="/login" className="w-full mt-4">
                <Button className="w-full rounded-xl py-6 font-bold">Sign In</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter">Verification failed</CardTitle>
              <CardDescription className="text-zinc-500">{message}</CardDescription>
              <div className="grid grid-cols-1 gap-2 w-full mt-4">
                <Link to="/register">
                  <Button variant="outline" className="w-full rounded-xl py-6 font-bold">Try Registering Again</Button>
                </Link>
                <Link to="/login">
                  <Button variant="link" className="font-bold">Back to Login</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
