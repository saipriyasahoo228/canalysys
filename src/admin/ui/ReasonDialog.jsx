import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Loader2, X } from 'lucide-react'
import { Button, Input, Select } from './Ui'

export function ReasonDialog({
  open,
  title,
  description,
  submitLabel = 'Confirm',
  showReason = true,
  requireReason = true,
  reasonLabel,
  reasonPlaceholder,
  onClose,
  onSubmit,
  fields,
}) {
  const initial = useMemo(() => {
    const o = {}
    for (const f of fields || []) o[f.name] = f.defaultValue ?? ''
    if (showReason) o.reason = ''
    return o
  }, [fields, showReason])

  const [form, setForm] = useState(initial)
  const [comboText, setComboText] = useState({})
  const [comboOpen, setComboOpen] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const boxRef = useRef(null)
  const prevOpenRef = useRef(false)

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open
    if (open && !wasOpen) {
      setForm(initial)
      setComboText({})
      setComboOpen(null)
    }
  }, [open, initial])

  useEffect(() => {
    const onDown = (e) => {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target)) setComboOpen(null)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  if (!open) return null

  const canSubmit = !(requireReason && showReason) || !!String(form.reason || '').trim()

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={submitting ? undefined : onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="relative border-b border-slate-200 px-4 py-3">
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
          <div className="text-sm font-semibold">{title}</div>
          {description ? <div className="mt-1 text-xs text-slate-500">{description}</div> : null}
        </div>
        <div className="max-h-[70vh] overflow-y-auto space-y-3 p-4" ref={boxRef}>
          {(fields || []).map((f) => (
            <div key={f.name}>
              <div className="text-xs font-medium text-slate-900">{f.label}</div>
              <div className="mt-1">
                {f.type === 'select' ? (
                  <div className="relative">
                    {(() => {
                      const isDisabled = !!f.disabled || submitting
                      const opts = typeof f.options === 'function' ? f.options(form) : f.options || []
                      const selected = opts.find((o) => o.value === form[f.name])
                      const typed = comboText[f.name]
                      const query = typed === null || typed === undefined ? '' : typed
                      const isOpen = comboOpen === f.name
                      const displayText = isOpen ? String(query || '') : selected?.label || ''
                      const q = String(query || '').trim().toLowerCase()
                      const filtered = q
                        ? opts.filter((o) => String(o.label || '').toLowerCase().includes(q))
                        : opts

                      return (
                        <>
                          <div className="relative">
                            <Input
                              className="pr-9"
                              value={displayText}
                              disabled={isDisabled}
                              onFocus={() => {
                                if (isDisabled) return
                                setComboOpen(f.name)
                                setComboText((s) => ({ ...s, [f.name]: '' }))
                              }}
                              onChange={(e) => {
                                if (isDisabled) return
                                const v = e.target.value
                                setComboText((s) => ({ ...s, [f.name]: v }))
                                setComboOpen(f.name)
                              }}
                              placeholder={opts.length ? 'Type to search…' : 'No options'}
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={isDisabled}
                              onClick={() => {
                                if (isDisabled) return
                                setComboOpen((v) => (v === f.name ? null : f.name))
                                setComboText((s) => ({ ...s, [f.name]: '' }))
                              }}
                              aria-label="Toggle options"
                              title="Toggle options"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {isOpen ? (
                            <div className="mt-2 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                              {filtered.length ? (
                                <div className="p-1">
                                  {filtered.map((o) => (
                                    <button
                                      key={o.value}
                                      type="button"
                                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100"
                                      onClick={() => {
                                        const nextVal = o.value
                                        setForm((s) => {
                                          const next = { ...s, [f.name]: nextVal }
                                          if (typeof f.onChange === 'function') return f.onChange(nextVal, next) || next
                                          return next
                                        })
                                        setComboText((s) => ({ ...s, [f.name]: null }))
                                        setComboOpen(null)
                                      }}
                                    >
                                      <span className="min-w-0 flex-1 truncate">{o.label}</span>
                                      {form[f.name] === o.value ? (
                                        <span className="text-xs font-semibold text-cyan-700">Selected</span>
                                      ) : null}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="px-3 py-2 text-sm text-slate-600">No options available</div>
                              )}
                            </div>
                          ) : null}

                          <div className="sr-only">
                            <Select value={form[f.name]} onChange={() => {}}>
                              {(opts || []).map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <>
                    {f.type === 'file' ? (
                      <input
                        type="file"
                        disabled={!!f.disabled || submitting}
                        accept={f.accept}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0]
                          if (!file) return

                          if (f.fileMode === 'dataUrl') {
                            const progressName = f.progressName || `${f.name}Progress`
                            const fileNameName = f.fileNameName || `${f.name}FileName`

                            setForm((s) => ({ ...s, [progressName]: 0, [fileNameName]: file.name }))

                            const reader = new FileReader()
                            reader.onprogress = (evt) => {
                              if (!evt.lengthComputable) return
                              const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)))
                              setForm((s) => ({ ...s, [progressName]: pct }))
                            }
                            reader.onload = () => {
                              setForm((s) => ({ ...s, [f.name]: String(reader.result || ''), [progressName]: 100 }))
                              if (typeof f.onChange === 'function') {
                                setForm((s) => {
                                  const next = { ...s, [f.name]: String(reader.result || ''), [progressName]: 100 }
                                  return f.onChange(String(reader.result || ''), next) || next
                                })
                              }
                            }
                            reader.onerror = () => {
                              setForm((s) => ({ ...s, [progressName]: 0 }))
                            }
                            reader.readAsDataURL(file)
                            return
                          }

                          setForm((s) => {
                            const next = { ...s, [f.name]: file }
                            if (typeof f.onChange === 'function') return f.onChange(file, next) || next
                            return next
                          })
                        }}
                      />
                    ) : (
                      <Input
                        type={f.type || 'text'}
                        value={form[f.name]}
                        disabled={!!f.disabled || submitting}
                        onChange={(e) => {
                          const v = e.target.value
                          setForm((s) => {
                            const next = { ...s, [f.name]: v }
                            if (typeof f.onChange === 'function') return f.onChange(v, next) || next
                            return next
                          })
                        }}
                        placeholder={f.placeholder}
                      />
                    )}

                    {f.type === 'file' && f.fileMode === 'dataUrl' ? (
                      <div className="mt-2">
                        {(() => {
                          const progressName = f.progressName || `${f.name}Progress`
                          const fileNameName = f.fileNameName || `${f.name}FileName`
                          const pct = Number(form[progressName] || 0)
                          const fileName = String(form[fileNameName] || '').trim()
                          const show = fileName || pct > 0

                          if (!show) return null

                          return (
                            <div>
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <div className="min-w-0 flex-1 truncate">{fileName || 'Uploading…'}</div>
                                <div className="ml-3 tabular-nums">{pct}%</div>
                              </div>
                              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full bg-cyan-600" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ))}

          {showReason ? (
            <div>
              <div className="text-xs font-medium text-slate-900">{reasonLabel || 'Reason (required)'}</div>
              <div className="mt-1">
                <Input
                  value={form.reason}
                  disabled={submitting}
                  onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
                  placeholder={reasonPlaceholder || 'Required for audit log'}
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <Button variant="ghost" onClick={submitting ? undefined : onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (submitting) return
              if (!canSubmit) return
              try {
                setSubmitting(true)
                await Promise.resolve(onSubmit(form))
              } finally {
                setSubmitting(false)
              }
            }}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </span>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
