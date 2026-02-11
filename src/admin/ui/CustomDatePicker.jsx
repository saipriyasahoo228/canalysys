import { Calendar } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDate } from '../utils/format'
import { cx, Input } from './Ui'

function isoToDmy(iso) {
  if (!iso) return ''
  return formatDate(iso)
}

function dmyToIso(dmy) {
  const s = String(dmy || '').trim()
  if (!s) return ''
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ''
  const dd = String(m[1]).padStart(2, '0')
  const mm = String(m[2]).padStart(2, '0')
  const yyyy = String(m[3])
  const iso = `${yyyy}-${mm}-${dd}`
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  if (String(d.getFullYear()) !== yyyy) return ''
  if (String(d.getMonth() + 1).padStart(2, '0') !== mm) return ''
  if (String(d.getDate()).padStart(2, '0') !== dd) return ''
  return iso
}

export function CustomDatePicker({ value, onChange, disabled, placeholder = 'dd/mm/yyyy', className }) {
  const [text, setText] = useState(() => isoToDmy(value))
  const nativeRef = useRef(null)

  const dmy = useMemo(() => isoToDmy(value), [value])

  useEffect(() => {
    setText(dmy)
  }, [dmy])

  return (
    <div className={cx('relative', className)}>
      <Input
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const iso = dmyToIso(text)
          if (iso) onChange?.(iso)
          else if (!String(text || '').trim()) onChange?.('')
          else setText(dmy)
        }}
        placeholder={placeholder}
        inputMode="numeric"
      />

      <button
        type="button"
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => {
          const el = nativeRef.current
          if (!el) return
          try {
            if (typeof el.showPicker === 'function') el.showPicker()
            else el.click()
          } catch {
            el.click()
          }
        }}
        aria-label="Pick date"
        title="Pick date"
      >
        <Calendar className="h-4 w-4" />
      </button>

      <input
        ref={nativeRef}
        type="date"
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="pointer-events-none absolute right-0 top-0 h-full w-10 opacity-0"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
