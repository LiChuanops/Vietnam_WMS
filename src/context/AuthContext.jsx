import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase/client'
import { LanguageProvider } from './LanguageContext'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from profiles table
  const fetchUserProfile = async (userId) => {
    if (!userId) return null
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    // Get current user with timeout
    const getUser = async () => {
      try {
        // 添加超时控制
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth check timeout, setting loading to false')
            setLoading(false)
          }
        }, 10000) // 10秒超时

        const { data: { user }, error } = await supabase.auth.getUser()
        
        clearTimeout(timeoutId)
        
        if (!mounted) return

        if (error) {
          console.error('Error getting user:', error)
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          return
        }

        setUser(user)
        
        if (user) {
          // 获取用户资料，但不让它阻塞主流程
          try {
            const profile = await fetchUserProfile(user.id)
            if (mounted) {
              setUserProfile(profile)
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError)
            // 即使获取资料失败，也继续进入应用
            if (mounted) {
              setUserProfile(null)
            }
          }
        } else {
          setUserProfile(null)
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in getUser:', error)
        if (mounted) {
          setUser(null)
          setUserProfile(null)
          setLoading(false)
        }
      }
    }

    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (!mounted) return

        try {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            // 异步获取用户资料，不阻塞认证流程
            fetchUserProfile(session.user.id)
              .then(profile => {
                if (mounted) {
                  setUserProfile(profile)
                }
              })
              .catch(error => {
                console.error('Error fetching profile in auth change:', error)
                if (mounted) {
                  setUserProfile(null)
                }
              })
          } else {
            setUserProfile(null)
          }
          
          setLoading(false)
        } catch (error) {
          console.error('Error in auth state change:', error)
          setLoading(false)
        }
      }
    )

    // Cleanup function
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Sign in function
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  }

  // Sign up function
  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  const value = {
    user,
    userProfile,
    signIn,
    signUp,
    signOut,
    loading
  }

  return (
    <LanguageProvider>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </LanguageProvider>
  )
}
