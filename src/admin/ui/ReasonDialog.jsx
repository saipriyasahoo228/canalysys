import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import { formatDate } from '../utils/format'
import { Button, Input, Select } from './Ui'
import { CustomDatePicker } from './CustomDatePicker'

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
  fieldErrors,
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
  const [calendarView, setCalendarView] = useState({})
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
      setCalendarView({})
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

  const normalizeIso = (iso) => {
    const s = String(iso || '').trim()
    if (!s) return ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return ''
    const d = new Date(`${s}T00:00:00`)
    if (!Number.isFinite(d.getTime())) return ''
    return s
  }

  const isoFromParts = (y, m, d) => {
    const yyyy = String(y).padStart(4, '0')
    const mm = String(m + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const monthLabel = (y, m) => {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${names[m] || ''} ${y}`
  }

  const renderFieldLabel = (label) => {
    const raw = String(label || '')
    const trimmed = raw.trim()
    if (!trimmed.endsWith('*')) return <span>{label}</span>
    const base = trimmed.replace(/\*+\s*$/, '').trim()
    return (
      <span>
        {base}{' '}
        <span className="font-semibold text-rose-600">*</span>
      </span>
    )
  }

  const canSubmit = !(requireReason && showReason) || !!String(form.reason || '').trim()

	const getFieldError = (name) => {
		if (!name) return ''
		const m = fieldErrors && typeof fieldErrors === 'object' ? fieldErrors[name] : ''
		if (!m) return ''
		return String(m)
	}

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={submitting ? undefined : onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="relative px-4 py-3">
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
          {(fields || []).map((f) => {
            // Check if field should be shown based on condition
            if (f.condition && typeof f.condition === 'function') {
              if (!f.condition(form)) return null
            }
            
            return (
            <div key={f.name}>
              <div className="text-xs font-medium text-slate-900">{renderFieldLabel(f.label)}</div>
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
                    ) : f.type === 'date' ? (
                      <CustomDatePicker
                        value={form[f.name]}
                        disabled={!!f.disabled || submitting}
                        min={f.min}
                        max={f.max}
                        onChange={(iso) => {
                          setForm((s) => {
                            const next = { ...s, [f.name]: iso }
                            if (typeof f.onChange === 'function') return f.onChange(iso, next) || next
                            return next
                          })
                        }}
                        placeholder={f.placeholder || 'dd/mm/yyyy'}
                      />
                    ) : f.type === 'multi_date_calendar' ? (
                      <div className="space-y-2">
                        {(() => {
                          const selected = Array.isArray(form[f.name]) ? form[f.name].filter(Boolean) : []
                          const minIso = normalizeIso(f.min)
                          const maxIso = normalizeIso(f.max)

                          const now = new Date()
                          const defaultY = now.getFullYear()
                          const defaultM = now.getMonth()
                          const view = calendarView[f.name] || { y: defaultY, m: defaultM }
                          const y = Number(view.y)
                          const m = Number(view.m)

                          const first = new Date(y, m, 1)
                          const daysInMonth = new Date(y, m + 1, 0).getDate()
                          const startDow = first.getDay() // 0..6 (Sun..Sat)
                          const blanks = Array.from({ length: startDow })
                          const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
                          const cells = [...blanks.map(() => null), ...days]

                          const setMonth = (delta) => {
                            const dt = new Date(y, m + delta, 1)
                            setCalendarView((s) => ({ ...s, [f.name]: { y: dt.getFullYear(), m: dt.getMonth() } }))
                          }

                          const isBlocked = (iso) => {
                            if (!iso) return true
                            if (minIso && iso < minIso) return true
                            if (maxIso && iso > maxIso) return true
                            return false
                          }

                          return (
                            <div className="rounded-xl border border-slate-200 bg-white p-2">
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  disabled={!!f.disabled || submitting}
                                  className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  onClick={() => setMonth(-1)}
                                  aria-label="Previous month"
                                  title="Previous month"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>

                                <div className="text-sm font-semibold text-slate-900">{monthLabel(y, m)}</div>

                                <button
                                  type="button"
                                  disabled={!!f.disabled || submitting}
                                  className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  onClick={() => setMonth(1)}
                                  aria-label="Next month"
                                  title="Next month"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-2 grid grid-cols-7 gap-1 text-[11px] font-medium text-slate-500">
                                <div className="text-center">Su</div>
                                <div className="text-center">Mo</div>
                                <div className="text-center">Tu</div>
                                <div className="text-center">We</div>
                                <div className="text-center">Th</div>
                                <div className="text-center">Fr</div>
                                <div className="text-center">Sa</div>
                              </div>

                              <div className="mt-1 grid grid-cols-7 gap-1">
                                {cells.map((dayNum, idx) => {
                                  if (!dayNum) return <div key={`b-${idx}`} className="h-8" />

                                  const iso = isoFromParts(y, m, dayNum)
                                  const blocked = isBlocked(iso)
                                  const isSelected = selected.includes(iso)

                                  return (
                                    <button
                                      key={iso}
                                      type="button"
                                      disabled={!!f.disabled || submitting || blocked}
                                      className={
                                        'h-8 rounded-lg text-sm font-medium ' +
                                        (isSelected
                                          ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                                          : blocked
                                            ? 'text-slate-300'
                                            : 'text-slate-700 hover:bg-slate-100')
                                      }
                                      onClick={() => {
                                        setForm((s) => {
                                          const current = Array.isArray(s[f.name]) ? s[f.name].filter(Boolean) : []
                                          const exists = current.includes(iso)
                                          const nextDates = exists ? current.filter((d) => d !== iso) : [...current, iso]
                                          nextDates.sort()

                                          const next = { ...s, [f.name]: nextDates }
                                          if (typeof f.onChange === 'function') return f.onChange(nextDates, next) || next
                                          return next
                                        })
                                      }}
                                      title={iso}
                                    >
                                      {dayNum}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })()}

                        {Array.isArray(form[f.name]) && form[f.name].length ? (
                          <div className="flex flex-wrap gap-2">
                            {form[f.name].map((iso) => (
                              <button
                                key={iso}
                                type="button"
                                disabled={!!f.disabled || submitting}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => {
                                  setForm((s) => {
                                    const current = Array.isArray(s[f.name]) ? s[f.name].filter(Boolean) : []
                                    const nextDates = current.filter((d) => d !== iso)
                                    const next = { ...s, [f.name]: nextDates }
                                    if (typeof f.onChange === 'function') return f.onChange(nextDates, next) || next
                                    return next
                                  })
                                }}
                                title="Remove"
                              >
                                <span>{formatDate(iso)}</span>
                                <X className="h-3.5 w-3.5" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">No dates selected</div>
                        )}
                      </div>
                    ) : f.type === 'phone_in' ? (
                      <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-200/70">
                        <div className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                          +91
                        </div>
                        <input
                          value={String(form[f.name] || '')}
                          disabled={!!f.disabled || submitting}
                          onChange={(e) => {
                            if (!!f.disabled || submitting) return
                            const digits = String(e.target.value || '').replace(/\D+/g, '').slice(0, 10)
                            setForm((s) => {
                              const next = { ...s, [f.name]: digits }
                              if (typeof f.onChange === 'function') return f.onChange(digits, next) || next
                              return next
                            })
                          }}
                          inputMode="numeric"
                          placeholder={f.placeholder || '10 digit number'}
                          maxLength={10}
                          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    ) : f.type === 'textarea' ? (
                      <textarea
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
                        rows={f.rows || 8}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    ) : f.type === 'checkbox' ? (
                      <div className={f.className || 'flex items-center space-x-2'}>
                        <input
                          type="checkbox"
                          id={f.name}
                          checked={!!form[f.name]}
                          disabled={!!f.disabled || submitting}
                          onChange={(e) => {
                            const v = e.target.checked
                            setForm((s) => {
                              const next = { ...s, [f.name]: v }
                              if (typeof f.onChange === 'function') return f.onChange(v, next) || next
                              return next
                            })
                          }}
                          className="h-4 w-4 rounded border-slate-300 bg-white text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <label htmlFor={f.name} className="text-sm text-slate-700 cursor-pointer">
                          {f.checkboxLabel || f.label}
                        </label>
                      </div>
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
                        className={getFieldError(f.name) ? 'border-rose-300 focus:border-rose-400/80 focus:ring-rose-200/70' : undefined}
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
              {getFieldError(f.name) ? (
                <div className="mt-1 text-xs text-rose-700">{getFieldError(f.name)}</div>
              ) : null}
            </div>
            )
          })}
          {showReason ? (
            <div>
              <div className="text-xs font-medium text-slate-900">
                {renderFieldLabel(reasonLabel || 'Reason (required) *')}
              </div>
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
        <div className="flex items-center justify-end gap-2 px-4 py-3">
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
