import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, cx, Input, Select } from './Ui'
import { CustomDatePicker } from './CustomDatePicker'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function InspectorProfileDialog({ open, inspector, onClose, onSave }) {
  const initial = useMemo(() => {
    const it = inspector || {}
    return {
      id: it.id || '',
      name: it.name || '',
      phone: it.phone || '',
      joinDate: it.joinDate || '',
      employmentType: it.employmentType || 'full_time',
      email: it.email || '',
      status: it.status || (it.active ? 'active' : 'inactive'),
      profilePhotoUrl: it.profilePhotoUrl || '',
      reason: '',
    }
  }, [inspector])

  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (open) {
      setForm(initial)
      setSubmitting(false)
      setError('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [open, initial])

  if (!open) return null

  const photo = String(form.profilePhotoUrl || '').trim()
  const showPhoto = /^data:image\//i.test(photo)

  const canSave = !!String(form.reason || '').trim() && !submitting

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={submitting ? undefined : onClose} />
      <div className="absolute inset-3 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="relative shrink-0 border-b border-slate-200 px-4 py-3">
          <Button
            variant="icon"
            size="icon"
            className="absolute right-2 top-2"
            onClick={submitting ? undefined : onClose}
            disabled={submitting}
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold">Manage profile</div>
          <div className="mt-1 text-xs text-slate-500">Review profile details and update editable fields</div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-3">
            <Card accent="cyan" className="p-0 lg:col-span-1">
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {showPhoto ? (
                      <img src={photo} alt="Inspector" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                        {(String(form.name || 'I').trim().slice(0, 1) || 'I').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{form.name || '—'}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">{form.id || '—'}</div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Mobile number</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">{form.phone || '—'}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Date of joining</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">{form.joinDate || '—'}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Employment type</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">{form.employmentType || '—'}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-0 lg:col-span-2">
              <div className="border-b border-slate-200 px-3 py-2.5">
                <div className="text-sm font-semibold">Editable fields</div>
                <div className="mt-0.5 text-xs text-slate-500">Changes are audited. Audit reason is required.</div>
              </div>

              <div className="min-h-0 overflow-auto space-y-3 p-3">
                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                    {error}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Full name</div>
                    <div className="mt-1">
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        disabled={true}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Mobile number</div>
                    <div className="mt-1">
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                        disabled={true}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Date of joining</div>
                    <div className={cx('mt-1', submitting ? 'pointer-events-none opacity-60' : '')}>
                      <CustomDatePicker
                        value={form.joinDate}
                        onChange={(v) => setForm((s) => ({ ...s, joinDate: v }))}
                        disabled={true}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Employment type</div>
                    <div className="mt-1">
                      <Select
                        value={form.employmentType}
                        disabled={true}
                        onChange={(e) => setForm((s) => ({ ...s, employmentType: e.target.value }))}
                      >
                        <option value="full_time">Full-time</option>
                        <option value="contract">Contract</option>
                        <option value="freelancer">Freelancer</option>
                      </Select>
                    </div>
                  </label>

                  <label className="block sm:col-span-2">
                    <div className="text-xs font-medium text-slate-900">Email</div>
                    <div className="mt-1">
                      <Input
                        value={form.email}
                        onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                        disabled={submitting}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Status</div>
                    <div className="mt-1">
                      <Select
                        value={form.status}
                        onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                        disabled={submitting}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </Select>
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Profile photo</div>
                    <div className="mt-1">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        disabled={submitting}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const url = await readFileAsDataUrl(file)
                            setForm((s) => ({ ...s, profilePhotoUrl: url }))
                          } catch {
                            setError('Failed to read selected photo. Please try again.')
                          }
                        }}
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <div className="text-xs font-medium text-slate-900">Audit reason</div>
                  <div className="mt-1">
                    <Input
                      value={form.reason}
                      onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
                      disabled={submitting}
                      placeholder="Required for audit log"
                    />
                  </div>
                </label>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                  <Button
                    variant="ghost"
                    onClick={submitting ? undefined : onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!canSave}
                    onClick={async () => {
                      setError('')
                      setSubmitting(true)
                      try {
                        await onSave(form)
                      } catch (e) {
                        setError(e?.message || 'Save failed')
                        setSubmitting(false)
                        return
                      }
                      setSubmitting(false)
                      onClose()
                    }}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
