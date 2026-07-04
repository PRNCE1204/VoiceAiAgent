import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SignIn from './pages/SignIn'
import axios from 'axios'
import ProtectedRoute from './Components/ProtectedRoute'
import Navbar from './Components/Navbar'
import Builder from './pages/Builder'
import Billing from './pages/Billing'
import { Toaster } from "react-hot-toast"
export const ServerUrl = "http://localhost:8080"
export const CLIENT_URL = "http://localhost:5173"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true; // Default to dark mode
  });

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(ServerUrl + "/api/user/current-user", { withCredentials: true })
        setUser(res.data)
        setLoading(false)
      } catch (error) {
        console.log(error)
        setLoading(false)
      }
    }
    fetchMe()
  }, [])

  return (
    <>
      <Toaster position='top-right'/>
      <Routes>

        {/* ── Auth Pages (no navbar) ─────────────────────────── */}
        <Route path='/login'           element={<Login setUser={setUser}/>} />
        <Route path='/register'        element={<Register />} />
        <Route path='/verify-otp'      element={<VerifyOtp setUser={setUser}/>} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password'  element={<ResetPassword />} />
        <Route path='/signin'          element={<SignIn setUser={setUser}/>} />

        {/* ── App Pages (with navbar) ───────────────────────── */}
        <Route path='/*' element={
          <>
            <Navbar setUser={setUser} user={user} loading={loading} darkMode={darkMode} setDarkMode={setDarkMode}/>
            <Routes>
              <Route path='/' element={<Home user={user} darkMode={darkMode}/>} />
              <Route path='/builder' element={
                <ProtectedRoute user={user} loading={loading}>
                  <Builder user={user} setUser={setUser} darkMode={darkMode}/>
                </ProtectedRoute>
              }/>
              <Route path='/billing' element={
                <ProtectedRoute user={user} loading={loading}>
                  <Billing user={user} setUser={setUser} darkMode={darkMode}/>
                </ProtectedRoute>
              }/>
              <Route path='*' element={<Navigate to="/" replace/>}/>
            </Routes>
          </>
        } />

      </Routes>
    </>
  )
}

export default App
