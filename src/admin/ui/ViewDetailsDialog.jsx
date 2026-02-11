import { X } from 'lucide-react'
import { Button, Card } from './Ui'

export function ViewDetailsDialog({ open, title, subtitle, onClose, items, accent = 'slate' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
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
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          <Card accent={accent} className="p-0">
            <div className="p-3">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(items || []).map((it) => (
                  <div key={it.key || it.label} className={it.fullWidth ? 'sm:col-span-2' : ''}>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-600">{it.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900 break-words">{it.value ?? '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>

          <div className="mt-3 flex items-center justify-end">
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
