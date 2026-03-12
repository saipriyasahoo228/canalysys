import { Bell, LogOut, Menu, Moon, RefreshCcw, Sun } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePolling } from '../hooks/usePolling'
import { useAuth } from '../auth/AuthContext'
import { getNotifications, markNotificationAsRead } from '../../api/notification'

export function Topbar({ onOpenMenu, collapsed, setCollapsed }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const { data: notificationsData, refresh: refreshNotifications } = usePolling(
    'notifications',
    () => getNotifications(),
    {
      intervalMs: 30_000, // Poll notifications every 30 seconds
    }
  )

  const projectName = 'CARNALYSYS'

  const timeMeta = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return { text: 'Good morning', icon: Sun, color: 'text-amber-600' }
    if (h < 17) return { text: 'Good afternoon', icon: Sun, color: 'text-orange-600' }
    return { text: 'Good evening', icon: Moon, color: 'text-indigo-600' }
  }, [])

  const [markingAsRead, setMarkingAsRead] = useState(null)
  const [search, setSearch] = useState('')

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRefDesktop = useRef(null)
  const notifRefMobile = useRef(null)

  const [userOpen, setUserOpen] = useState(false)
  const userRefDesktop = useRef(null)
  const userRefMobile = useRef(null)

  const [userInfo, setUserInfo] = useState(() => {
    try {
      const raw = window.localStorage.getItem('userInfo')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const sync = () => {
      try {
        const raw = window.localStorage.getItem('userInfo')
        setUserInfo(raw ? JSON.parse(raw) : null)
      } catch {
        setUserInfo(null)
      }
    }
    window.addEventListener('userInfoUpdated', sync)
    return () => window.removeEventListener('userInfoUpdated', sync)
  }, [])

  const notifications = useMemo(() => {
    // Use real notifications from API
    if (notificationsData && notificationsData.items && Array.isArray(notificationsData.items)) {
      return notificationsData.items;
    }
    
    // Return empty array if no notifications
    return [];
  }, [notificationsData])

  useEffect(() => {
    const onDown = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setUserOpen(false)
      }
    }
    const onClick = (e) => {
      const nd = notifRefDesktop.current
      const nm = notifRefMobile.current
      const ud = userRefDesktop.current
      const um = userRefMobile.current

      const inNotif = (nd && nd.contains(e.target)) || (nm && nm.contains(e.target))
      const inUser = (ud && ud.contains(e.target)) || (um && um.contains(e.target))

      if (!inNotif) setNotifOpen(false)
      if (!inUser) setUserOpen(false)
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
    logout()
    navigate('/login', { replace: true })
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at && !markingAsRead) {
      setMarkingAsRead(notification.id);
      try {
        await markNotificationAsRead(notification.id);
        refreshNotifications(); // Refresh notifications to update read status
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      } finally {
        setMarkingAsRead(null);
      }
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="relative flex items-center gap-3 px-3 py-3 sm:px-5">
        <button
          className="cursor-pointer rounded-full p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-tight text-slate-900">
                <span className="bg-gradient-to-r from-slate-900 via-amber-900 to-orange-800 bg-clip-text text-transparent">
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
            <div className="max-w-[460px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-amber-950/35 focus:ring-2 focus:ring-amber-200/70"
              />
            </div>
          </div>

          <div className="relative shrink-0" ref={notifRefDesktop}>
            <button
              className="relative inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-950 px-1 text-[10px] font-semibold text-amber-50">
                {unreadCount}
              </span>
            </button>

            {notifOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[320px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-3 py-2">
                  <div className="text-sm font-semibold text-slate-900">Notifications</div>
                  <div className="text-xs text-slate-500">
                    {notifications.length === 0 ? 'No notifications' : `${unreadCount} unread`}
                  </div>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-500">
                      No notifications available
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`border-b border-slate-100 px-3 py-2 cursor-pointer transition-all duration-200 ${
                          !n.read_at ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-slate-50'
                        } ${
                          markingAsRead === n.id ? 'opacity-60' : ''
                        }`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                            <div className="mt-0.5 text-xs text-slate-600">
                              {n.data?.customer_id ? `Customer ID: ${n.data.customer_id}` : n.body}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {!n.read_at && (
                              <>
                                {markingAsRead === n.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                                ) : (
                                  <>
                                    <div className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                    <div className="text-xs text-amber-600 font-medium">Mark as read</div>
                                  </>
                                )}
                              </>
                            )}
                            {n.read_at && (
                              <div className="text-xs text-slate-400 font-medium">Read</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative shrink-0" ref={userRefDesktop}>
            <button
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setUserOpen((v) => !v)}
              aria-label="User menu"
              title="User menu"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                {(userInfo?.name || 'A').slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[160px] truncate">{userInfo?.name || 'Admin'}</span>
            </button>

            {userOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[280px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-3 py-2">
                  <div className="text-sm font-semibold text-slate-900">{userInfo?.name || 'Admin'}</div>
                  <div className="text-xs text-slate-500">
                    {userInfo?.role || userInfo?.user_id || 'USR-ADMIN'}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-3 py-2">
                  <button
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => {
              refreshNotifications();
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
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-amber-950/35 focus:ring-2 focus:ring-amber-200/70"
          />
        </div>

        <div className="relative shrink-0" ref={notifRefMobile}>
          <button
            className="relative inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-950 px-1 text-[10px] font-semibold text-amber-50">
              {unreadCount}
            </span>
          </button>

          {notifOpen ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-[320px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-200 px-3 py-2">
                <div className="text-sm font-semibold text-slate-900">Notifications</div>
                <div className="text-xs text-slate-500">
                  {notifications.length === 0 ? 'No notifications' : `${unreadCount} unread`}
                </div>
              </div>
              <div className="max-h-[260px] overflow-auto">
                {notifications.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-500">
                    No notifications available
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`border-b border-slate-100 px-3 py-2 cursor-pointer transition-all duration-200 ${
                        !n.read_at ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-slate-50'
                      } ${
                        markingAsRead === n.id ? 'opacity-60' : ''
                      }`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                          <div className="mt-0.5 text-xs text-slate-600">
                            {n.data?.customer_id ? `Customer ID: ${n.data.customer_id}` : n.body}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {!n.read_at && (
                            <>
                              {markingAsRead === n.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                              ) : (
                                <>
                                  <div className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                  <div className="text-xs text-amber-600 font-medium">Mark as read</div>
                                </>
                              )}
                            </>
                          )}
                          {n.read_at && (
                            <div className="text-xs text-slate-400 font-medium">Read</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative shrink-0" ref={userRefMobile}>
          <button
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => setUserOpen((v) => !v)}
            aria-label="User menu"
            title="User menu"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
              {(userInfo?.name || 'A').slice(0, 1).toUpperCase()}
            </span>
          </button>

          {userOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-[280px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-200 px-3 py-2">
                <div className="text-sm font-semibold text-slate-900">{userInfo?.name || 'Admin'}</div>
                <div className="text-xs text-slate-500">
                  {userInfo?.role || userInfo?.user_id || 'USR-ADMIN'}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-3 py-2">
                <button
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
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
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => {
            refreshNotifications();
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
