import { useMemo, useState } from 'react'
import { Button, Card, Select } from '../ui/Ui'

const modules = [
  { key: 'queue', label: 'Queue' },
  { key: 'inspectors', label: 'Inspectors' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'audit', label: 'Audit' },
  { key: 'access', label: 'Access Control' },
]

const crudUi = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'View' },
  { key: 'update', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
]

const dummyUsers = [
  { userId: 'USR-ADMIN-01', name: 'Admin (Default)' },
  { userId: 'USR-OPS-01', name: 'Ops User' },
  { userId: 'USR-FIN-01', name: 'Finance User' },
]

function defaultUserPerms() {
  const crud = {}
  for (const m of modules) {
    crud[m.key] = { create: true, read: true, update: true, delete: true }
  }
  return { crud }
}

export function AccessControlPage() {
  const [selectedUserId, setSelectedUserId] = useState(dummyUsers[0].userId)
  const [byUser, setByUser] = useState(() => {
    const m = {}
    for (const u of dummyUsers) m[u.userId] = defaultUserPerms()
    return m
  })

  const userOptions = useMemo(
    () => dummyUsers.map((u) => ({ value: u.userId, label: `${u.name} · ${u.userId}` })),
    []
  )

  const effectiveUserId = selectedUserId
  const userName = useMemo(
    () => dummyUsers.find((u) => u.userId === effectiveUserId)?.name || effectiveUserId,
    [effectiveUserId]
  )

  const userPerms = byUser[effectiveUserId] || defaultUserPerms()

  return (
    <div className="space-y-3">
      <Card
        title="Select user"
        subtitle="Choose a user to configure module access"
        accent="violet"
        right={
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                setByUser((prev) => ({
                  ...prev,
                  [effectiveUserId]: defaultUserPerms(),
                }))
              }
            >
              Reset
            </Button>
          </div>
        }
      >
        <div className="max-w-xl">
          <Select value={effectiveUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            {userOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <div className="mt-2 text-xs text-slate-500">Selected: {userName}</div>
        </div>
      </Card>

      <Card title="Module access" subtitle="Toggle Create / View / Edit / Delete permissions" accent="cyan">
        <div className="space-y-2">
          {modules.map((m) => (
            <div key={m.key} className="rounded-2xl border border-slate-200 bg-white/70 p-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-auto text-sm font-semibold text-slate-900">{m.label}</div>
                {crudUi.map((c) => {
                  const enabled = !!userPerms?.crud?.[m.key]?.[c.key]
                  return (
                    <Button
                      key={`${m.key}:${c.key}`}
                      variant={enabled ? 'primary' : 'default'}
                      className="px-2 py-1 text-[11px]"
                      onClick={() => {
                        setByUser((prev) => {
                          const before = prev[effectiveUserId] || defaultUserPerms()
                          const beforeCrud = before.crud || {}
                          const moduleCrud = beforeCrud[m.key] || {}
                          return {
                            ...prev,
                            [effectiveUserId]: {
                              ...before,
                              crud: {
                                ...beforeCrud,
                                [m.key]: {
                                  ...moduleCrud,
                                  [c.key]: !enabled,
                                },
                              },
                            },
                          }
                        })
                      }}
                      title={`${m.label}: ${c.label}`}
                    >
                      {c.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
