'use client'

const AUTH_KEY = 'sofin_auth'

// Usuario autorizado
const AUTHORIZED_USER = {
  email: 'lic_frankfer@hotmail.com',
  password: 'M0nts3rr47.2002',
  nombre: 'Lic. Francisco',
}

export interface AuthUser {
  email: string
  nombre: string
  loggedInAt: string
}

export function login(email: string, password: string): AuthUser | null {
  if (
    email.toLowerCase() === AUTHORIZED_USER.email.toLowerCase() &&
    password === AUTHORIZED_USER.password
  ) {
    const user: AuthUser = {
      email: AUTHORIZED_USER.email,
      nombre: AUTHORIZED_USER.nombre,
      loggedInAt: new Date().toISOString(),
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    }
    
    return user
  }
  
  return null
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY)
  }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  
  const data = localStorage.getItem(AUTH_KEY)
  if (!data) return null
  
  try {
    return JSON.parse(data) as AuthUser
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null
}
