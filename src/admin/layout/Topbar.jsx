import { Bell, CarFront, LogOut, Menu, MapPin, Moon, PanelLeft, RefreshCcw, Sun } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'

export function Topbar({ onOpenMenu, collapsed, setCollapsed }) {
  const { locationId, setLocationId, user } = useRbac()
  const { data, refresh } = usePolling('bootstrap', () => mockApi.getBootstrap(), {
    intervalMs: 15_000,
  })

  const locations = data?.locations || []

  const projectName = 'Carnalysis'

  const timeMeta = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return { text: 'Good morning', icon: Sun, color: 'text-amber-600' }
    if (h < 17) return { text: 'Good afternoon', icon: Sun, color: 'text-orange-600' }
    return { text: 'Good evening', icon: Moon, color: 'text-indigo-600' }
  }, [])

  const [search, setSearch] = useState('')

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef(null)

  const notifications = useMemo(() => {
    const name = user?.name || 'Admin'
    const userId = user?.userId || 'USR-ADMIN'
    return [
      { id: 'n1', title: 'Logged in', body: `${name} · ${userId}` },
      { id: 'n2', title: 'Queue', body: 'New jobs assigned in the last 10 minutes (demo)' },
      { id: 'n3', title: 'Finance', body: 'Pending commission approvals need attention (demo)' },
    ]
  }, [user])

  useEffect(() => {
    const onDown = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setUserOpen(false)
      }
    }
    const onClick = (e) => {
      const n = notifRef.current
      const u = userRef.current
      if (n && !n.contains(e.target)) setNotifOpen(false)
      if (u && !u.contains(e.target)) setUserOpen(false)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('mousedown', onClick)
    }
  }, [])

  const onLogout = () => {
    setNotifOpen(false)
    setUserOpen(false)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="relative flex items-center gap-2 px-3 py-3 sm:px-4">
        <button
          className="rounded-full p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <button
          className="hidden rounded-full p-2 text-slate-700 hover:bg-slate-100 md:inline-flex"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CarFront className="h-5 w-5 text-cyan-700" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-tight text-slate-900">
                <span className="bg-gradient-to-r from-slate-900 via-cyan-800 to-indigo-800 bg-clip-text text-transparent">
                  {projectName}
                </span>
              </div>
            </div>

            <div className="hidden min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur sm:flex">
              <timeMeta.icon className={"h-4 w-4 " + timeMeta.color} />
              <span className="truncate">{timeMeta.text}</span>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="min-w-0 flex-1">
            <div className="max-w-[520px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-200/70"
              />
            </div>
          </div>

          <div className="relative shrink-0" ref={notifRef}>
            <button
              className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-600 px-1 text-[10px] font-semibold text-white">
                {notifications.length}
              </span>
            </button>

            {notifOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[320px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-3 py-2">
                  <div className="text-sm font-semibold text-slate-900">Notifications</div>
                  <div className="text-xs text-slate-500">Demo feed</div>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="border-b border-slate-100 px-3 py-2">
                      <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                      <div className="mt-0.5 text-xs text-slate-600">{n.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative shrink-0" ref={userRef}>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setUserOpen((v) => !v)}
              aria-label="User menu"
              title="User menu"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                {(user?.name || 'A').slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[160px] truncate">{user?.name || 'Admin'}</span>
            </button>

            {userOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[280px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-3 py-2">
                  <div className="text-sm font-semibold text-slate-900">{user?.name || 'Admin'}</div>
                  <div className="text-xs text-slate-500">{user?.userId || 'USR-ADMIN'}</div>
                </div>
                <div className="space-y-2 px-3 py-2">
                  <div className="text-xs font-medium text-slate-900">Location</div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <MapPin className="h-4 w-4 text-slate-600" />
                    <select
                      className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      aria-label="Location"
                    >
                      <option value="">All locations</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-3 py-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
                    onClick={onLogout}
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => {
              refresh()
            }}
            aria-label="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 pb-3 sm:hidden">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-200/70"
          />
        </div>

        <div className="relative shrink-0" ref={notifRef}>
          <button
            className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-600 px-1 text-[10px] font-semibold text-white">
              {notifications.length}
            </span>
          </button>

          {notifOpen ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-[320px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-200 px-3 py-2">
                <div className="text-sm font-semibold text-slate-900">Notifications</div>
                <div className="text-xs text-slate-500">Demo feed</div>
              </div>
              <div className="max-h-[260px] overflow-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="border-b border-slate-100 px-3 py-2">
                    <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                    <div className="mt-0.5 text-xs text-slate-600">{n.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative shrink-0" ref={userRef}>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => setUserOpen((v) => !v)}
            aria-label="User menu"
            title="User menu"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
              {(user?.name || 'A').slice(0, 1).toUpperCase()}
            </span>
          </button>

          {userOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-[280px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-200 px-3 py-2">
                <div className="text-sm font-semibold text-slate-900">{user?.name || 'Admin'}</div>
                <div className="text-xs text-slate-500">{user?.userId || 'USR-ADMIN'}</div>
              </div>
              <div className="space-y-2 px-3 py-2">
                <div className="text-xs font-medium text-slate-900">Location</div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <MapPin className="h-4 w-4 text-slate-600" />
                  <select
                    className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    aria-label="Location"
                  >
                    <option value="">All locations</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-3 py-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={onLogout}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => {
            refresh()
          }}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
