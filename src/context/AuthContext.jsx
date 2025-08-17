import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

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
        return null
      }

      return data
    } catch (error) {
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
            setLoading(false)
          }
        }, 10000) // 10秒超时

        const { data: { user }, error } = await supabase.auth.getUser()
        
        clearTimeout(timeoutId)
        
        if (!mounted) return

        if (error) {
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
                if (mounted) {
                  setUserProfile(null)
                }
              })
          } else {
            setUserProfile(null)
          }
          
          setLoading(false)
        } catch (error) {
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
      return { data: null, error }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
