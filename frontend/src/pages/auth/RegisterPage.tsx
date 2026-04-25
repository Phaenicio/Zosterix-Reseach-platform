import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'

import { registerSchema } from '@/schemas/auth'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import { Separator } from '@/components/ui/separator'

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'researcher',
      agreedToTerms: false as any,
    },
  })

  const onSubmit = async (values: RegisterValues) => {
    setIsLoading(true)
    setError(null)
    try {
      await api.post('/api/v1/auth/register', {
        full_name: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
      })
      setRegisteredEmail(values.email)
      setIsSuccess(true)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Something went wrong. Please try again.'
      setError(msg)
      
      if (err.response?.data?.error?.code === 'email_taken') {
        form.setError('email', { message: 'An account with this email already exists.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await api.post('/api/v1/auth/resend-verification', { email: registeredEmail })
    } catch (err) {
      // Handle error
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
            <CardTitle className="text-2xl font-black">Check your email</CardTitle>
            <CardDescription className="text-zinc-500">
              We sent a verification link to <span className="font-bold text-black">{registeredEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500">
              Check your inbox and click the link to activate your account.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleResend} className="rounded-xl font-bold">
                Resend verification email
              </Button>
              <Link to="/login">
                <Button variant="link" className="font-bold">Back to Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-12">
      <Card className="w-full max-w-[480px] border-none shadow-none">
        <CardHeader className="text-center">
          <Link to="/" className="text-2xl font-black tracking-tighter mb-4 inline-block">
            ZOSTERIX<span className="text-zinc-300">.</span>
          </Link>
          <CardTitle className="text-3xl font-black tracking-tighter">Create an account</CardTitle>
          <CardDescription>Start your research journey today.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-400">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Amal Perera" className="rounded-xl border-zinc-200 py-6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-400">Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="amal@university.edu" type="email" className="rounded-xl border-zinc-200 py-6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-400">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            className="rounded-xl border-zinc-200 py-6 pr-10"
                            {...field}
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-400">Confirm Password</FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-400">I am a...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                      >
                        {[
                          { id: 'researcher', label: 'Researcher', desc: 'PhD, postdoc' },
                          { id: 'student', label: 'Student', desc: 'New researcher' },
                          { id: 'supervisor', label: 'Supervisor', desc: 'Mentor' },
                        ].map((r) => (
                          <FormItem key={r.id}>
                            <FormControl>
                              <RadioGroupItem value={r.id} className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex h-full flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-center transition-all peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white cursor-pointer hover:border-zinc-300">
                              <span className="text-xs font-bold uppercase tracking-wider">{r.label}</span>
                              <span className="mt-1 text-[10px] opacity-60 leading-tight">{r.desc}</span>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreedToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-1">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        className="rounded-md border-zinc-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs font-medium text-zinc-500">
                        I agree to the <Link to="/terms" className="font-bold text-black hover:underline">Terms of Service</Link> and <Link to="/privacy" className="font-bold text-black hover:underline">Privacy Policy</Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full rounded-xl py-6 font-bold">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          </Form>

          <div className="my-8 flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Or continue with</span>
            <Separator className="flex-1" />
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl py-6 font-bold"
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/auth/google`}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-black hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
