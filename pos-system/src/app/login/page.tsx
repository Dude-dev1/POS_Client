'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Lock, Mail, ShoppingCart, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Replace these with your actual test user credentials
const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'test@example.com',
    password: 'password123',
    color: 'text-violet-500',
    dot: 'bg-violet-500',
  },
  {
    role: 'Manager',
    email: 'manager@pos.com',
    password: 'password123',
    color: 'text-blue-500',
    dot: 'bg-blue-500',
  },
  {
    role: 'Cashier',
    email: 'cashier@pos.com',
    password: 'password123',
    color: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const setProfile = useAuthStore((state) => state.setProfile)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const currentEmail = watch('email')

  const fillDemo = (account: typeof DEMO_ACCOUNTS[0]) => {
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
    toast.success(`Filled ${account.role} credentials`)
  }

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError) {
          toast.error('Failed to fetch user profile')
          return
        }

        setProfile(profile)
        toast.success(`Welcome back, ${profile.full_name || profile.role}!`)

        if (profile.role === 'CASHIER') {
          router.push('/pos')
        } else {
          router.push('/dashboard')
        }
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="p-2.5 bg-primary rounded-xl shadow-md">
            <ShoppingCart className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl tracking-tight">Cortex POS</span>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Role Dropdown */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">Quick Demo</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={isLoading}>
                  <span className="text-muted-foreground text-sm">Select a role to auto-fill credentials</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[370px]" align="center">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Test accounts — will auto-fill the form
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DEMO_ACCOUNTS.map((account) => (
                  <DropdownMenuItem
                    key={account.role}
                    className="flex items-center gap-3 cursor-pointer py-2.5"
                    onClick={() => fillDemo(account)}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${account.dot}`} />
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm ${account.color}`}>{account.role}</p>
                      <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
