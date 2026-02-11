import { NavLink } from 'react-router-dom'
import {
  Activity,
  ClipboardList,
  Layers3,
  Users,
  IndianRupee,
  ScrollText,
  LayoutDashboard,
  PanelLeft,
  ListChecks,
  X,
} from 'lucide-react'
import { useRbac } from '../rbac/RbacContext'
import { cx } from '../ui/Ui'

const linkBase =
  'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm min-w-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50'

const activeClass = 'bg-cyan-700 text-white shadow-sm ring-1 ring-cyan-700/20'

function NavItem({ to, icon: Icon, label, collapsed, iconClassName = '' }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${linkBase} ${collapsed ? 'justify-center gap-0 px-3' : ''} ${isActive ? activeClass : 'text-slate-700'}`
      }
      title={label}
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cx(
              'h-4 w-4',
              isActive ? 'text-white' : iconClassName,
              isActive ? '' : ''
            )}
          />
          <span
            className={cx(
              'min-w-0 truncate transition-all duration-300',
              collapsed ? 'w-0 opacity-0 translate-x-1 pointer-events-none' : 'w-auto opacity-100 translate-x-0'
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  useRbac()

  return (
    <>
      <div
        className={cx(
          'relative hidden h-full shrink-0 border-r border-slate-200 bg-gradient-to-b from-cyan-50/70 via-white to-slate-50/70 md:block shadow-sm transition-[width] duration-300 ease-in-out',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cx(
              'flex items-center gap-2 border-b border-slate-200/70 bg-white/55 px-4 py-4 backdrop-blur-sm',
              collapsed ? 'justify-center px-2' : ''
            )}
          >
            <Activity className="h-5 w-5 text-cyan-700" />
            <div
              className={cx(
                'min-w-0 flex-1 transition-all duration-300',
                collapsed ? 'w-0 opacity-0 -translate-x-1 pointer-events-none' : 'w-auto opacity-100 translate-x-0'
              )}
            >
              <div className="truncate text-sm font-semibold text-slate-900">PDI Admin</div>
              <div className="truncate text-xs text-slate-500">Queue + Workforce + Finance</div>
            </div>

            <button
              type="button"
              className={cx(
                'cursor-pointer rounded-xl p-2 text-slate-700 transition hover:bg-slate-100 active:scale-95',
                collapsed ? '' : 'ml-auto'
              )}
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className={cx('h-4 w-4 transition-transform duration-300', collapsed ? '-scale-x-100' : '')} />
            </button>
          </div>
          <div className={cx('flex-1 space-y-1 px-2 py-2', collapsed ? 'px-2' : '')}>
            <div className={collapsed ? 'mx-auto w-fit' : ''}>
              <NavItem
                to="/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                collapsed={collapsed}
                iconClassName="text-violet-600"
              />
            </div>
            <div className={collapsed ? 'mx-auto w-fit' : ''}>
              <NavItem
                to="/inspectors"
                icon={Users}
                label="Inspector Onboarding"
                collapsed={collapsed}
                iconClassName="text-emerald-600"
              />
            </div>
            <div className={collapsed ? 'mx-auto w-fit' : ''}>
              <NavItem
                to="/queue"
                icon={ClipboardList}
                label="Queue Control"
                collapsed={collapsed}
                iconClassName="text-cyan-600"
              />
            </div>
            <div className={collapsed ? 'mx-auto w-fit' : ''}>
              <NavItem
                to="/vehicle-master"
                icon={Layers3}
                label="Vehicle Master"
                collapsed={collapsed}
                iconClassName="text-indigo-600"
              />
            </div>
            <div className={collapsed ? 'mx-auto w-fit' : ''}>
              <NavItem
                to="/checklists"
                icon={ListChecks}
                label="Checklist Builder"
                collapsed={collapsed}
                iconClassName="text-cyan-700"
              />
            </div>
            <div className={collapsed ? 'mx-auto w-fit' : ''}>
              <NavItem
                to="/finance"
                icon={IndianRupee}
                label="Finance"
                collapsed={collapsed}
                iconClassName="text-amber-600"
              />
            </div>
            <div className={collapsed ? 'mx-auto w-fit' : ''}>
              <NavItem
                to="/audit"
                icon={ScrollText}
                label="Audit Log"
                collapsed={collapsed}
                iconClassName="text-slate-600"
              />
            </div>
          </div>
          {!collapsed ? (
            <div className="border-t border-slate-200 p-3 text-xs text-slate-500">Admin console · Demo mode</div>
          ) : null}
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] border-r border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-600" />
                <div className="text-sm font-semibold text-slate-900">PDI Admin</div>
              </div>
              <button
                className="cursor-pointer rounded-xl p-2 text-slate-700"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 px-2" onClick={() => setMobileOpen(false)}>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={false} iconClassName="text-violet-600" />
              <NavItem
                to="/inspectors"
                icon={Users}
                label="Inspector Onboarding"
                collapsed={false}
                iconClassName="text-emerald-600"
              />
              <NavItem to="/queue" icon={ClipboardList} label="Queue Control" collapsed={false} iconClassName="text-cyan-600" />
              <NavItem to="/vehicle-master" icon={Layers3} label="Vehicle Master" collapsed={false} iconClassName="text-indigo-600" />
              <NavItem to="/checklists" icon={ListChecks} label="Checklist Builder" collapsed={false} iconClassName="text-cyan-700" />
              <NavItem to="/finance" icon={IndianRupee} label="Finance" collapsed={false} iconClassName="text-amber-600" />
              <NavItem to="/audit" icon={ScrollText} label="Audit Log" collapsed={false} iconClassName="text-slate-600" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
