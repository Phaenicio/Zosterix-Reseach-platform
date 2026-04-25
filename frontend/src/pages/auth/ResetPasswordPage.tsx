import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'

import { resetPasswordSchema } from '@/schemas/auth'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setError('Invalid reset link.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await api.post('/api/v1/auth/reset-password', {
        token,
        password: values.password,
        confirm_password: values.confirmPassword,
      })
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-[480px]">
          <AlertTitle>Invalid Link</AlertTitle>
          <AlertDescription>
            This password reset link is invalid or has expired.
            <div className="mt-4">
              <Link to="/forgot-password">
                <Button variant="outline" size="sm">Request a new link</Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center p-4">
        <Card className="w-full max-w-[480px] text-center border-none shadow-none">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
              <CheckCircle2 className="h-8 w-8 text-black" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tighter">Password reset successful</CardTitle>
            <CardDescription className="text-zinc-500">
              Your password has been updated. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full rounded-xl py-6 font-bold">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-[480px] border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-3xl font-black tracking-tighter">Create new password</CardTitle>
          <CardDescription>Your new password must be at least 12 characters and contain uppercase, lowercase, and numbers.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-400">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          className="rounded-xl border-zinc-200 py-6 pr-10"
                          {...field}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-400">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        className="rounded-xl border-zinc-200 py-6"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full rounded-xl py-6 font-bold">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Reset Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
