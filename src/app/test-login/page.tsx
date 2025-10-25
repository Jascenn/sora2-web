'use client'

import { useState } from 'react'

export default function TestLoginPage() {
  const [email, setEmail] = useState('admin@sora2.com')
  const [password, setPassword] = useState('admin123')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('Testing login with:', { email, password })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for cookies
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        setResult({
          success: true,
          user: data.user,
          message: '登录成功！',
        })
      } else {
        setError(data.error || '登录失败')
        setResult({
          success: false,
          error: data.error,
        })
      }
    } catch (err: any) {
      console.error('Login test error:', err)
      setError(err.message)
      setResult({
        success: false,
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const testRegister = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const testEmail = `test${Date.now()}@example.com`
      const testData = {
        email: testEmail,
        password: 'test123456',
        nickname: 'Test User',
      }

      console.log('Testing register with:', testData)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      const data = await response.json()
      console.log('Register response:', data)

      if (response.ok) {
        setResult({
          success: true,
          user: data.user,
          message: '注册成功！',
        })
      } else {
        setError(data.error || '注册失败')
        setResult({
          success: false,
          error: data.error,
        })
      }
    } catch (err: any) {
      console.error('Register test error:', err)
      setError(err.message)
      setResult({
        success: false,
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSupabase = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('Checking Supabase connection...')

      const response = await fetch('/api/test/supabase', {
        method: 'GET',
      })

      const data = await response.json()
      console.log('Supabase check response:', data)

      setResult(data)
    } catch (err: any) {
      console.error('Supabase check error:', err)
      setError(err.message)
      setResult({
        success: false,
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            登录诊断工具
          </h1>

          {/* Login Test */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">测试登录</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="admin@sora2.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="admin123"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={testLogin}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? '测试中...' : '测试登录'}
                </button>
                <button
                  onClick={testRegister}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? '测试中...' : '测试注册'}
                </button>
                <button
                  onClick={checkSupabase}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading ? '检查中...' : '检查 Supabase'}
                </button>
              </div>
            </div>
          </div>

          {/* Result Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800 mb-2">错误</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h3 className="text-sm font-medium mb-2 text-gray-900">
                {result.success ? '✅ 成功' : '⚠️  响应'}
              </h3>
              <pre className="text-xs overflow-auto text-gray-900 bg-white p-3 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">使用说明</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>默认测试账号: admin@sora2.com / admin123</li>
              <li>也可以测试: user@sora2.com / user123</li>
              <li>点击&quot;测试登录&quot;查看详细的登录响应</li>
              <li>点击&quot;测试注册&quot;创建新用户</li>
              <li>点击&quot;检查 Supabase&quot;验证数据库连接</li>
              <li>查看浏览器控制台获取更多调试信息</li>
            </ul>
          </div>

          {/* Environment Info */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">环境信息</h3>
            <div className="text-xs text-gray-700 space-y-1">
              <div>API URL: /api/auth/login</div>
              <div>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div>User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
