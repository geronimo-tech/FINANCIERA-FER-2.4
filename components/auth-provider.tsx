'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthUser, type AuthUser } from '@/lib/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const authUser = getAuthUser()
    setUser(authUser)

    // If not logged in and not on login page, redirect to login
    if (!authUser && pathname !== '/login') {
      router.push('/login')
      return
    }

    // If logged in and on login page, redirect to home
    if (authUser && pathname === '/login') {
      router.push('/')
      return
    }

    // Check if this is a fresh login (within last 5 seconds)
    if (authUser) {
      const loginTime = new Date(authUser.loggedInAt).getTime()
      const now = Date.now()
      const isRecentLogin = (now - loginTime) < 5000 // 5 seconds
      
      // Also check session storage to prevent showing on every page load
      const welcomeShown = sessionStorage.getItem('welcomeShown')
      
      if (isRecentLogin && !welcomeShown) {
        setShowWelcome(true)
        sessionStorage.setItem('welcomeShown', 'true')
        
        // Hide welcome after 3 seconds
        setTimeout(() => {
          setShowWelcome(false)
        }, 3000)
      }
    }

    setIsChecking(false)
  }, [pathname, router])

  // Show loading while checking auth
  if (isChecking && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated and not on login page
  if (!user && pathname !== '/login') {
    return null
  }

  return (
    <>
      {/* Welcome overlay */}
      {showWelcome && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e3a5f]/95 animate-in fade-in duration-500">
          <div className="text-center text-white space-y-4 animate-in zoom-in duration-500">
            <div className="text-6xl mb-6">
              <span role="img" aria-label="wave">
                &#128075;
              </span>
            </div>
            <h1 className="text-4xl font-bold">
              Bienvenido
            </h1>
            <p className="text-2xl text-white/90">
              {user.nombre}
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
