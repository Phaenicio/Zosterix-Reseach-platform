import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { z } from 'zod'

import { forgotPasswordSchema } from '@/schemas/auth'
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

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true)
    setError(null)
    try {
      await api.post('/api/v1/auth/forgot-password', values)
      setEmail(values.email)
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center p-4">
        <Card className="w-full max-w-[480px] text-center border-none shadow-none">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
              <Mail className="h-8 w-8 text-black" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tighter">Check your email</CardTitle>
            <CardDescription className="text-zinc-500">
              If <span className="font-bold text-black">{email}</span> is registered, you will receive a reset link shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/login">
              <Button variant="outline" className="w-full rounded-xl py-6 font-bold">
                Return to Login
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
          <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black mb-6">
            <ArrowLeft size={16} />
            Back to login
          </Link>
          <CardTitle className="text-3xl font-black tracking-tighter">Reset your password</CardTitle>
          <CardDescription>Enter your email and we'll send you a link to reset your password.</CardDescription>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-400">Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="amal@example.com" type="email" className="rounded-xl border-zinc-200 py-6" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full rounded-xl py-6 font-bold">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
