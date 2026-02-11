import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button, Input, Select } from './Ui'

export function ReasonDialog({
  open,
  title,
  description,
  submitLabel = 'Confirm',
  showReason = true,
  requireReason = true,
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

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="relative border-b border-slate-200 px-4 py-3">
          <Button
            variant="icon"
            size="icon"
            className="absolute right-2 top-2"
            onClick={onClose}
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
                      const isDisabled = !!f.disabled
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
                  <Input
                    type={f.type || 'text'}
                    value={form[f.name]}
                    disabled={!!f.disabled}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            </div>
          ))}

          {showReason ? (
            <div>
              <div className="text-xs font-medium text-slate-900">Reason (required)</div>
              <div className="mt-1">
                <Input
                  value={form.reason}
                  onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
                  placeholder="Required for audit log"
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSubmit(form)}
            disabled={requireReason && showReason ? !String(form.reason || '').trim() : false}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
