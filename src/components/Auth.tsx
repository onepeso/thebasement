'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('') // New state for username

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      // This "options" object is what your SQL Trigger is looking for!
      options: {
        data: {
          username: username,
          avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}` // Cool default avatar
        }
      }
    })
    if (error) alert(error.message)
    else alert("Check your email for confirmation!")
  }

  return (
    <div className="flex flex-col p-8 bg-zinc-900 rounded-xl space-y-4 w-80 border border-zinc-800 shadow-2xl text-white">
      <h2 className="text-xl font-bold">Enter The Basement</h2>
      
      {/* Add Username Input */}
      <input 
        className="bg-zinc-800 p-2 rounded outline-none border border-transparent focus:border-indigo-500" 
        placeholder="Username" 
        onChange={(e) => setUsername(e.target.value)} 
      />
      
      <input className="bg-zinc-800 p-2 rounded outline-none" type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input className="bg-zinc-800 p-2 rounded outline-none" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      
      <button onClick={handleLogin} className="bg-indigo-600 p-2 rounded font-bold hover:bg-indigo-500 transition">Log In</button>
      <button onClick={handleSignUp} className="text-sm text-zinc-500 hover:text-zinc-300">Sign Up</button>
    </div>
  )
}