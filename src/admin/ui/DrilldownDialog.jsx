// import { X } from 'lucide-react'
// import { Badge, Button, PaginatedTable } from './Ui'
// import { formatDate } from '../utils/format'

// const stageTone = { advance_paid: 'amber', fully_paid: 'emerald', unpaid: 'rose' }
// const stageLabel = { advance_paid: 'Advance Paid', fully_paid: 'Fully Paid', unpaid: 'Unpaid' }

// const columns = [
//   { key: 'request_id', header: 'Request ID', cell: (r) => r.request_id || '—' },
//   { key: 'name', header: 'Customer', cell: (r) => r.name || '—' },
//   { key: 'mobile_number', header: 'Mobile', cell: (r) => r.mobile_number || '—' },
//   {
//     key: 'vehicle',
//     header: 'Vehicle',
//     cell: (r) => [r.brand_name, r.model_name, r.variant || r.variant_name].filter(Boolean).join(' ') || '—',
//   },
//   {
//     key: 'payment_stage',
//     header: 'Payment Stage',
//     cell: (r) => (
//       <Badge tone={stageTone[r.payment_stage] || 'slate'}>
//         {stageLabel[r.payment_stage] || r.payment_stage || '—'}
//       </Badge>
//     ),
//   },
//   { key: 'status', header: 'Status', cell: (r) => r.status || '—' },
//   { key: 'slot_date', header: 'Slot Date', cell: (r) => formatDate(r.slot_date) },
// ]

// export function DrilldownDialog({ open, title, subtitle, loading, error, items, onClose }) {
//   if (!open) return null

//   return (
//     <div className="fixed inset-0 z-50">
//       <div className="absolute inset-0 bg-black/30" onClick={onClose} />
//       <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
//         <div className="relative border-b border-slate-200 px-4 py-3">
//           <Button
//             variant="icon"
//             size="icon"
//             className="absolute right-2 top-2"
//             onClick={onClose}
//             aria-label="Close"
//             title="Close"
//           >
//             <X className="h-4 w-4" />
//           </Button>
//           <div className="text-sm font-semibold">{title}</div>
//           {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
//         </div>

//         <div className="max-h-[70vh] overflow-y-auto p-4">
//           {loading ? (
//             <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
//           ) : error ? (
//             <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>
//           ) : items.length === 0 ? (
//             <div className="py-8 text-center text-sm text-slate-500">No matching requests.</div>
//           ) : (
//             <PaginatedTable
//               columns={columns}
//               rows={items}
//               rowKey={(r) => r.id}
//               initialRowsPerPage={10}
//               rowsPerPageOptions={[10, 20, 'all']}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }




















import { X } from 'lucide-react'
import { Badge, Button, PaginatedTable } from './Ui'
import { formatDate } from '../utils/format'

// Helper function to capitalize first letter
const capitalizeFirstLetter = (string) => {
  if (!string) return '—'
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// Helper function to capitalize words (for multi-word statuses like "in_progress")
const capitalizeWords = (string) => {
  if (!string) return '—'
  return string
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const stageTone = { 
  advance_paid: 'amber', 
  fully_paid: 'emerald', 
  unpaid: 'rose',
  remaining_due: 'violet' 
}

const stageLabel = { 
  advance_paid: 'Advance Paid', 
  fully_paid: 'Fully Paid', 
  unpaid: 'Unpaid',
  remaining_due: 'Remaining Due' 
}

// Status tone mapping for badges
const statusTone = {
  confirmed: 'emerald',
  pending: 'amber',
  completed: 'blue',
  cancelled: 'rose',
  in_progress: 'violet',
  assigned: 'cyan',
  unassigned: 'slate',
}

const columns = [
  {
    key: 'request_id',
    header: 'Request ID',
    cell: (r) => (
      <div className="flex items-center gap-2">
        <span>{r.request_id || '—'}</span>
        {r.is_walkin ? <Badge tone="amber">Walk In</Badge> : null}
      </div>
    ),
  },
  { key: 'name', header: 'Customer', cell: (r) => r.name || '—' },
  { key: 'mobile_number', header: 'Mobile', cell: (r) => r.mobile_number || '—' },
  {
    key: 'vehicle',
    header: 'Vehicle',
    cell: (r) => [r.brand_name, r.model_name, r.variant || r.variant_name].filter(Boolean).join(' ') || '—',
  },
  {
    key: 'payment_stage',
    header: 'Payment Stage',
    cell: (r) => {
      const stage = r.payment_stage
      if (!stage) return '—'
      
      // Get the tone for the payment stage badge
      const tone = stageTone[stage.toLowerCase()] || 'slate'
      
      // Get the display label for the payment stage
      const displayStage = stageLabel[stage.toLowerCase()] || capitalizeWords(stage)
      
      return (
        <Badge tone={tone}>
          {displayStage}
        </Badge>
      )
    },
  },
  {
    key: 'status',
    header: 'Status',
    cell: (r) => {
      const status = r.status
      if (!status) return '—'
      
      // Get the tone for the status badge
      const tone = statusTone[status.toLowerCase()] || 'slate'
      
      // Capitalize the status for display
      // Use capitalizeWords for statuses with underscores (e.g., "in_progress" -> "In Progress")
      const displayStatus = status.includes('_') 
        ? capitalizeWords(status) 
        : capitalizeFirstLetter(status)
      
      return (
        <Badge tone={tone}>
          {displayStatus}
        </Badge>
      )
    },
  },
  { key: 'slot_date', header: 'Slot Date', cell: (r) => formatDate(r.slot_date) },
]

export function DrilldownDialog({ open, title, subtitle, loading, error, items, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
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
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
          ) : error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No matching requests.</div>
          ) : (
            <PaginatedTable
              columns={columns}
              rows={items}
              rowKey={(r) => r.id}
              initialRowsPerPage={10}
              rowsPerPageOptions={[10, 20, 'all']}
            />
          )}
        </div>
      </div>
    </div>
  )
}