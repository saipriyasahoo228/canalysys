import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="flex h-full overflow-x-hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <div className="min-w-0 flex-1">
          <div className="flex h-full min-h-0 flex-col">
            <Topbar
              onOpenMenu={() => setMobileOpen(true)}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
            />
            <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 pt-2 sm:px-3">
              <div className="w-full">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
