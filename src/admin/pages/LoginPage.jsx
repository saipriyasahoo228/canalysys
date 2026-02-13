import { CarFront, Lock, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, cx, Input } from '../ui/Ui'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const demoEmail = 'demo@carnalysis.com'
  const demoPassword = 'Carnalysis@123'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => {
    return String(email || '').trim().length > 0 && String(password || '').trim().length > 0 && !submitting
  }, [email, password, submitting])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const e1 = String(email || '').trim()
    const p1 = String(password || '').trim()

    if (!e1) return setError('Please enter your email.')
    if (!p1) return setError('Please enter your password.')

    if (e1.toLowerCase() !== demoEmail.toLowerCase() || p1 !== demoPassword) {
      return setError('Invalid demo credentials. Please use the demo email and password shown below.')
    }

    setSubmitting(true)

    try {
      await new Promise((r) => setTimeout(r, 450))
      login()
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute -right-24 top-24 h-[520px] w-[520px] rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-100 to-transparent" />
        </div>

        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6">
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="hidden lg:flex lg:flex-col lg:justify-center">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CarFront className="h-6 w-6 text-cyan-700" />
                </span>
                <div>
                  <div className="text-lg font-extrabold tracking-tight text-slate-900">Carnalysis</div>
                  <div className="text-sm text-slate-600">Inspection, queue, and operations analytics</div>
                </div>
              </div>

              <div className="mt-6 max-w-md text-sm text-slate-700">
                Sign in to access your dashboard, track inspection throughput, and monitor operational KPIs.
              </div>

              <div className="mt-6 grid max-w-md grid-cols-1 gap-2 text-xs text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
                  <div className="text-xs font-semibold text-slate-900">Fast overview</div>
                  <div className="mt-1">Live queue, SLA, utilization, and exception signals.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
                  <div className="text-xs font-semibold text-slate-900">Role-based access</div>
                  <div className="mt-1">Keep visibility aligned with location and responsibilities.</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <Card className="p-0 rounded-3xl border-slate-300 ring-slate-300/30">
                  <div className="border-b border-slate-200/80 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
                        <CarFront className="h-5 w-5 text-cyan-700" />
                      </span>
                      <div>
                        <div className="text-base font-extrabold tracking-tight text-slate-900">Sign in</div>
                        <div className="mt-0.5 text-xs text-slate-600">Use your Carnalysis credentials</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    {error ? (
                      <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                        {error}
                      </div>
                    ) : null}

                    <form className="space-y-3" onSubmit={onSubmit}>
                      <label className="block">
                        <div className="mb-1 text-xs font-semibold text-slate-700">Email</div>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                            inputMode="email"
                            placeholder="you@company.com"
                            className="pl-9 border-slate-200 focus:border-cyan-500/70 focus:ring-cyan-100/70"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <div className="mb-1 text-xs font-semibold text-slate-700">Password</div>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            className="pl-9 border-slate-200 focus:border-cyan-500/70 focus:ring-cyan-100/70"
                          />
                        </div>
                      </label>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className={cx(
                            'text-xs font-semibold text-slate-700 hover:text-slate-900',
                            submitting ? 'pointer-events-none opacity-60' : ''
                          )}
                          onClick={() => {
                            setEmail('')
                            setPassword('')
                            setError('')
                          }}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className={cx(
                            'text-xs font-semibold text-cyan-800 hover:text-cyan-900',
                            submitting ? 'pointer-events-none opacity-60' : ''
                          )}
                          onClick={() => {
                            setEmail(demoEmail)
                            setPassword(demoPassword)
                            setError('')
                          }}
                        >
                          Use demo credentials
                        </button>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                        <div className="font-semibold text-slate-900">Demo credentials</div>
                        <div className="mt-0.5">
                          <span className="font-semibold">Email:</span> {demoEmail}
                        </div>
                        <div className="mt-0.5">
                          <span className="font-semibold">Password:</span> {demoPassword}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={!canSubmit}
                        className="w-full"
                      >
                        {submitting ? 'Signing in…' : 'Sign in'}
                      </Button>
                    </form>

                    <div className="mt-3 text-center text-[11px] text-slate-500">
                      By continuing you agree to your organization’s policies.
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
