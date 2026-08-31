'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRequestOtp = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms'
        }
      })
      if (err) throw err
      setStep('verify')
      setMessage('OTP sent to your phone')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      })
      if (error) throw error
      // Redirect to dashboard after successful login
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'request') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-center text-2xl font-bold">Disaster Response</h2>
          <h3 className="text-center text-gray-600">Login with Phone</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {message}
            </div>
          )}
          
          <form onSubmit={(e) => {
            e.preventDefault()
            handleRequestOtp()
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 XXX XXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md disabled:opacity-50 hover:bg-blue-700"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-500">
            Don't have an account? Contact system administrator to create one.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-center text-2xl font-bold">Disaster Response</h2>
        <h3 className="text-center text-gray-600">Verify OTP</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={(e) => {
          e.preventDefault()
          handleVerifyOtp()
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              maxLength="6"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md disabled:opacity-50 hover:bg-blue-700"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
        
        <button
          onClick={() => setStep('request')}
          className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300"
        >
          Back to Enter Phone
        </button>
      </div>
    </div>
  )
}