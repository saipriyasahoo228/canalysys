import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { mockApi } from '../mock/mockApi'

const RbacContext = createContext(null)

const fallbackPermissions = {
  view: true,
  manageQueue: true,
  manageInspectors: true,
  managePricing: true,
  viewAudit: true,
  manageAccess: true,
  crud: {
    queue: { create: true, read: true, update: true, delete: true },
    inspectors: { create: true, read: true, update: true, delete: true },
    pricing: { create: true, read: true, update: true, delete: true },
    audit: { create: true, read: true, update: true, delete: true },
    access: { create: true, read: true, update: true, delete: true },
  },
}

function derivePermissions(p) {
  const base = p || fallbackPermissions
  const crud = base.crud || fallbackPermissions.crud

  return {
    ...base,
    crud,
    view: base.view ?? true,
    viewAudit: base.viewAudit ?? !!crud.audit?.read,
    manageQueue: base.manageQueue ?? !!(crud.queue?.create || crud.queue?.update || crud.queue?.delete),
    manageInspectors:
      base.manageInspectors ?? !!(crud.inspectors?.create || crud.inspectors?.update || crud.inspectors?.delete),
    managePricing: base.managePricing ?? !!(crud.pricing?.create || crud.pricing?.update || crud.pricing?.delete),
    manageAccess: base.manageAccess ?? !!(crud.access?.create || crud.access?.update || crud.access?.delete),
  }
}

export function RbacProvider({ children }) {
  const [rbac, setRbac] = useState({ roles: [], users: [], permissionsByRole: {}, permissionsByUser: {} })
  const [selectedUserId, setSelectedUserId] = useState('USR-SA-1')
  const [locationId, setLocationId] = useState('')

  useEffect(() => {
    let mounted = true
    mockApi
      .getBootstrap()
      .then((res) => {
        if (!mounted) return
        setRbac(res?.rbac || { roles: [], users: [], permissionsByRole: {}, permissionsByUser: {} })
        const users = res?.rbac?.users || []
        if (users.length && !users.some((u) => u.userId === selectedUserId)) {
          setSelectedUserId(users[0].userId)
        }
      })
      .catch(() => {
        // ignore for demo
      })
    return () => {
      mounted = false
    }
  }, [selectedUserId])

  const user = useMemo(() => {
    const u = (rbac.users || []).find((x) => x.userId === selectedUserId)
    return u || { userId: selectedUserId, name: 'User', role: mockApi.roles.READ_ONLY }
  }, [rbac.users, selectedUserId])

  const permissions = useMemo(() => {
    return derivePermissions(fallbackPermissions)
  }, [])

  const value = useMemo(
    () => ({
      user,
      rbac,
      setUserById: (userId) => setSelectedUserId(userId),
      setUserByRole: (role) => {
        const next = (rbac.users || []).find((u) => u.role === role)
        if (next) setSelectedUserId(next.userId)
      },
      locationId,
      setLocationId,
      permissions,
      actor: user,
    }),
    [rbac, user, locationId, permissions]
  )

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>
}

export function useRbac() {
  const ctx = useContext(RbacContext)
  if (!ctx) throw new Error('useRbac must be used within RbacProvider')
  return ctx
}
