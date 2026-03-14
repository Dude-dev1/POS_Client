
import { createAdminClient } from '@/lib/supabase/admin'
import { userSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = userSchema.parse(body)

    if (!validatedData.password) {
      return NextResponse.json({ error: 'Password is required for new users' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 1. Create the auth user
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.full_name,
        role: validatedData.role,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Manually upsert the profile (handles cases where the DB trigger is missing or fails)
    if (userData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: validatedData.email,
          full_name: validatedData.full_name,
          role: validatedData.role,
        })

      if (profileError) {
        // Profile creation failed — log it but don't fail the whole request
        // The auth user was created, which is the critical part
        console.error('Profile upsert error:', profileError.message)
        return NextResponse.json({ 
          user: userData.user, 
          warning: `User created but profile sync failed: ${profileError.message}` 
        })
      }
    }

    return NextResponse.json({ user: userData.user })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 })
  }
}
