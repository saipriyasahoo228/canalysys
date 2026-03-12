import { useEffect } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cx } from './Ui'

export function Snackbar({ open, tone = 'info', title, message, onClose, autoHideMs = 3500 }) {
  useEffect(() => {
    if (!open) return
    if (!autoHideMs) return

    const t = window.setTimeout(() => {
      if (typeof onClose === 'function') onClose()
    }, autoHideMs)

    return () => window.clearTimeout(t)
  }, [autoHideMs, onClose, open])

  if (!open) return null

  const styles = {
    success: {
      wrap: 'border-emerald-200 bg-emerald-50',
      title: 'text-emerald-900',
      msg: 'text-emerald-800',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    },
    error: {
      wrap: 'border-rose-200 bg-rose-50',
      title: 'text-rose-900',
      msg: 'text-rose-800',
      icon: <XCircle className="h-5 w-5 text-rose-600" />,
    },
    info: {
      wrap: 'border-slate-200 bg-white',
      title: 'text-slate-900',
      msg: 'text-slate-700',
      icon: <Info className="h-5 w-5 text-slate-600" />,
    },
  }

  const s = styles[tone] || styles.info

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[92vw] max-w-md -translate-x-1/2">
      <div className={cx('rounded-xl border shadow-lg', s.wrap)} role="status" aria-live="polite">
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="mt-0.5">{s.icon}</div>
          <div className="min-w-0 flex-1">
            {title ? <div className={cx('truncate text-sm font-semibold', s.title)}>{title}</div> : null}
            {message ? <div className={cx('mt-0.5 whitespace-pre-wrap text-sm', s.msg)}>{message}</div> : null}
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-slate-600 hover:bg-slate-200/60"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
