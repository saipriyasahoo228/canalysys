import { forwardRef, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function PaginatedTable({
  columns,
  rows,
  rowKey,
  initialRowsPerPage = 10,
  rowsPerPageOptions = [10, 20, 'all'],
  enableSearch = false,
  searchPlaceholder = 'Search…',
  getSearchText,
  enableExport = false,
  exportFilename = 'report.csv',
  exportBaseName,
}) {
  const [page, setPage] = useState(1)
  const [rpp, setRpp] = useState(initialRowsPerPage)
  const [query, setQuery] = useState('')

  const normalizedRpp = rpp === 'all' ? 'all' : Number(rpp)

  const normalizedQuery = String(query || '').trim().toLowerCase()

  const filteredRows = useMemo(() => {
    if (!enableSearch || !normalizedQuery) return rows
    const fn =
      typeof getSearchText === 'function'
        ? getSearchText
        : (r) => {
            try {
              return JSON.stringify(r)
            } catch {
              return ''
            }
          }

    return rows.filter((r) => String(fn(r) || '').toLowerCase().includes(normalizedQuery))
  }, [enableSearch, getSearchText, normalizedQuery, rows])

  const total = filteredRows.length
  const totalPages = normalizedRpp === 'all' ? 1 : Math.max(1, Math.ceil(total / normalizedRpp))

  const safePage = Math.min(page, totalPages)

  const pageRows = useMemo(() => {
    if (normalizedRpp === 'all') return filteredRows
    const start = (safePage - 1) * normalizedRpp
    return filteredRows.slice(start, start + normalizedRpp)
  }, [filteredRows, normalizedRpp, safePage])

  const from = total === 0 ? 0 : normalizedRpp === 'all' ? 1 : (safePage - 1) * normalizedRpp + 1
  const to =
    total === 0
      ? 0
      : normalizedRpp === 'all'
        ? total
        : Math.min(total, (safePage - 1) * normalizedRpp + normalizedRpp)

  const exportableColumns = useMemo(() => {
    return (columns || []).filter((c) => {
      if (!c) return false
      if (c.key === 'actions') return false
      if (c.export === false) return false
      return true
    })
  }, [columns])

  const getExportCellValue = (c, r) => {
    if (!c) return ''
    if (typeof c.exportValue === 'function') return c.exportValue(r)
    if (c.key && Object.prototype.hasOwnProperty.call(r, c.key)) return r[c.key]
    return ''
  }

  return (
    <div className="space-y-2">
      {enableSearch || enableExport ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {enableSearch ? (
            <div className="min-w-0 flex-1 sm:max-w-[360px]">
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : (
            <div />
          )}

          {enableExport ? (
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50 border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200 px-2.5 py-1.5 text-xs"
                onClick={() => {
                  const base = String(exportBaseName || '').trim()
                  const filename = base
                    ? `${base}.xlsx`
                    : String(exportFilename || 'report.xlsx')
                        .replace(/\.csv$/i, '.xlsx')
                        .replace(/\.pdf$/i, '.xlsx')

                  const header = exportableColumns.map((c) => String(c.header ?? c.key ?? '').trim())
                  const body = filteredRows.map((r) => exportableColumns.map((c) => getExportCellValue(c, r)))

                  const ws = XLSX.utils.aoa_to_sheet([header, ...body])
                  const wb = XLSX.utils.book_new()
                  XLSX.utils.book_append_sheet(wb, ws, 'Report')
                  XLSX.writeFile(wb, filename)
                }}
              >
                Excel
              </button>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50 border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200 px-2.5 py-1.5 text-xs"
                onClick={() => {
                  const base = String(exportBaseName || '').trim()
                  const filename = base
                    ? `${base}.pdf`
                    : String(exportFilename || 'report.pdf')
                        .replace(/\.csv$/i, '.pdf')
                        .replace(/\.xlsx$/i, '.pdf')

                  const head = [exportableColumns.map((c) => String(c.header ?? c.key ?? '').trim())]
                  const body = filteredRows.map((r) => exportableColumns.map((c) => getExportCellValue(c, r)))

                  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
                  autoTable(doc, {
                    head,
                    body,
                    styles: { fontSize: 8, cellPadding: 4 },
                    headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42] },
                    margin: { top: 24, left: 24, right: 24, bottom: 24 },
                  })
                  doc.save(filename)
                }}
              >
                PDF
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Table columns={columns} rows={pageRows} rowKey={rowKey} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{from}</span>–{' '}
          <span className="font-semibold text-slate-900">{to}</span> of{' '}
          <span className="font-semibold text-slate-900">{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 shadow-sm">
            <select
              className="bg-transparent text-xs text-slate-700 outline-none"
              value={normalizedRpp}
              onChange={(e) => {
                const v = e.target.value
                setRpp(v === 'all' ? 'all' : Number(v))
                setPage(1)
              }}
              aria-label="Rows per page"
            >
              {rowsPerPageOptions.map((o) => {
                const key = String(o)
                const value = o === 'all' ? 'all' : String(o)
                const label = o === 'all' ? 'All' : String(o)
                return (
                  <option key={key} value={value}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 shadow-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage(1)}
              disabled={normalizedRpp === 'all' || safePage <= 1}
            >
              First
            </button>
            <button
              className="cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 shadow-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={normalizedRpp === 'all' || safePage <= 1}
            >
              Prev
            </button>
            <div className="px-2 text-xs text-slate-600">
              Page <span className="font-semibold text-slate-900">{safePage}</span> / {totalPages}
            </div>
            <button
              className="cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 shadow-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={normalizedRpp === 'all' || safePage >= totalPages}
            >
              Next
            </button>
            <button
              className="cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 shadow-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage(totalPages)}
              disabled={normalizedRpp === 'all' || safePage >= totalPages}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const accentMap = {
  slate: 'from-slate-50/80 to-slate-50 border-slate-200 ring-slate-200/40',
  cyan: 'from-cyan-50/80 to-slate-50 border-cyan-200 ring-cyan-200/40',
  violet: 'from-violet-50/80 to-slate-50 border-violet-200 ring-violet-200/40',
  amber: 'from-amber-50/80 to-slate-50 border-amber-200 ring-amber-200/40',
  rose: 'from-rose-50/80 to-slate-50 border-rose-200 ring-rose-200/40',
  emerald: 'from-emerald-50/80 to-slate-50 border-emerald-200 ring-emerald-200/40',
}

const kpiBorderMap = {
  slate: 'border-l-slate-600',
  cyan: 'border-l-cyan-700',
  violet: 'border-l-violet-700',
  amber: 'border-l-amber-700',
  rose: 'border-l-rose-700',
  emerald: 'border-l-emerald-700',
}

export function Card({ title, subtitle, right, children, className, accent = 'slate', kpi = false }) {
  const a = accentMap[accent] || accentMap.slate
  const k = kpi ? kpiBorderMap[accent] || kpiBorderMap.slate : ''
  return (
    <section
      className={cx(
        'rounded-2xl border bg-gradient-to-b shadow-sm ring-1 transition hover:shadow-md',
        a,
        kpi ? 'border-l-4' : '',
        k,
        className
      )}
    >
      {(title || subtitle || right) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-300/70 px-3 py-2.5">
          <div className="min-w-0">
            {title ? <div className="truncate text-sm font-semibold">{title}</div> : null}
            {subtitle ? <div className="truncate text-xs text-slate-700">{subtitle}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      <div className="p-3">{children}</div>
    </section>
  )
}

export function StatCard({ label, value, hint, tone = 'default', kpi = false }) {
  const toneMap = {
    default: 'from-slate-50/80 to-slate-50 border-slate-200 ring-slate-200/40',
    good: 'from-emerald-50/80 to-slate-50 border-emerald-200 ring-emerald-200/40',
    warn: 'from-amber-50/80 to-slate-50 border-amber-200 ring-amber-200/40',
    bad: 'from-rose-50/80 to-slate-50 border-rose-200 ring-rose-200/40',
  }

  const k = kpi
    ? tone === 'good'
      ? 'border-l-4 border-l-emerald-700'
      : tone === 'warn'
        ? 'border-l-4 border-l-amber-700'
        : tone === 'bad'
          ? 'border-l-4 border-l-rose-700'
          : 'border-l-4 border-l-slate-600'
    : ''

  return (
    <div
      className={cx(
        'rounded-2xl border bg-gradient-to-b p-3 shadow-sm ring-1 transition hover:shadow-md',
        toneMap[tone] || toneMap.default,
        k
      )}
    >
      <div className="text-xs font-medium text-slate-900">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-700">{hint}</div> : null}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }) {
  const map = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        map[tone]
      )}
    >
      {children}
    </span>
  )
}

export function Button({ children, className, variant = 'default', size = 'sm', ...props }) {
  const variants = {
    default: 'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200',
    primary: 'border-cyan-600/30 bg-cyan-700 text-white hover:bg-cyan-800',
    danger: 'border-rose-600/30 bg-rose-700 text-white hover:bg-rose-800',
    ghost: 'border-transparent bg-transparent text-slate-900 hover:bg-slate-200',
    icon: 'border-transparent bg-transparent text-slate-900 hover:bg-slate-200',
  }
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    icon: 'p-2',
  }
  return (
    <button
      className={cx(
        variant === 'icon'
          ? 'inline-flex cursor-pointer items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
          : 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant] || variants.default,
        sizes[size] || sizes.sm,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cx(
        'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70',
        className
      )}
      {...props}
    />
  )
})

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cx(
        'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Table({ columns, rows, rowKey }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-slate-200/70 text-[11px] uppercase tracking-wide text-slate-700">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cx('whitespace-nowrap px-3 py-2.5', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, rowIndex) => (
            <tr
              key={rowKey(r)}
              className="border-t border-slate-200/80 hover:bg-slate-100/60"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cx('whitespace-nowrap px-3 py-2.5 align-top text-slate-800', c.tdClassName)}
                >
                  {c.cell(r, rowIndex, rows)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
