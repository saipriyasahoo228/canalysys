import { useMemo, useState } from 'react'
import { Eye, Link2, ListPlus, Pencil, Save, Tag, Trash2 } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable, cx } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'

const tabs = [
  { key: 'base', label: 'Base data' },
  { key: 'map', label: 'Mapping' },
  { key: 'pricing', label: 'Category pricing' },
]

function TabButton({ active, children, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
        active
          ? 'border-cyan-600/30 bg-cyan-700 text-white'
          : 'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200'
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function VehicleMasterPage() {
  const { actor, permissions } = useRbac()
  const [activeTab, setActiveTab] = useState('base')

  const { data, loading, error, refresh } = usePolling('vehicle-master', () => mockApi.getVehicleMaster(), {
    intervalMs: 15_000,
  })

  const vm = data || {
    types: [],
    makes: [],
    models: [],
    variants: [],
    categories: [],
    mappings: [],
    mappingPricingByMappingId: {},
    pricingByCategoryId: {},
  }

  const [dialog, setDialog] = useState(null)

  const typeById = useMemo(() => new Map(vm.types.map((x) => [x.id, x])), [vm.types])
  const makeById = useMemo(() => new Map(vm.makes.map((x) => [x.id, x])), [vm.makes])
  const modelById = useMemo(() => new Map(vm.models.map((x) => [x.id, x])), [vm.models])
  const variantById = useMemo(() => new Map(vm.variants.map((x) => [x.id, x])), [vm.variants])
  const categoryById = useMemo(() => new Map(vm.categories.map((x) => [x.id, x])), [vm.categories])

  const viewDialogOpen = dialog?.type === 'viewBase' || dialog?.type === 'viewMapping' || dialog?.type === 'viewPricing'

  const viewDialogItems = useMemo(() => {
    if (!dialog) return []

    if (dialog.type === 'viewBase') {
      const it = dialog.item
      const kindLabel = String(dialog.kind || '').toUpperCase()
      return [
        { key: 'kind', label: 'Kind', value: kindLabel || '—' },
        { key: 'id', label: 'ID', value: it?.id || '—' },
        ...(dialog.kind === 'model'
          ? [{ key: 'make', label: 'Make', value: makeById.get(it?.makeId)?.name || it?.makeId || '—' }]
          : []),
        ...(dialog.kind === 'variant'
          ? [{ key: 'model', label: 'Model', value: modelById.get(it?.modelId)?.name || it?.modelId || '—' }]
          : []),
        { key: 'name', label: 'Name', value: it?.name || '—', fullWidth: true },
      ]
    }

    if (dialog.type === 'viewMapping') {
      const it = dialog.item
      return [
        { key: 'mappingId', label: 'Mapping ID', value: it?.id || '—' },
        { key: 'type', label: 'Vehicle Type', value: typeById.get(it?.typeId)?.name || it?.typeId || '—' },
        { key: 'make', label: 'Make', value: makeById.get(it?.makeId)?.name || it?.makeId || '—' },
        { key: 'model', label: 'Model', value: modelById.get(it?.modelId)?.name || it?.modelId || '—' },
        { key: 'variant', label: 'Variant', value: variantById.get(it?.variantId)?.name || it?.variantId || '—' },
        { key: 'category', label: 'Category', value: categoryById.get(it?.categoryId)?.name || it?.categoryId || '—' },
      ]
    }

    if (dialog.type === 'viewPricing') {
      const it = dialog.item
      const p = vm.mappingPricingByMappingId?.[it?.id] || null
      return [
        { key: 'mappingId', label: 'Mapping ID', value: it?.id || '—' },
        { key: 'category', label: 'Category', value: categoryById.get(it?.categoryId)?.name || it?.categoryId || '—' },
        { key: 'baseInr', label: 'Base price (INR)', value: p?.baseInr ?? '—' },
        { key: 'distantAfterKm', label: 'Distance threshold (km)', value: p?.distantAfterKm ?? '—' },
        { key: 'distantExtraInr', label: 'Extra cost above threshold (INR)', value: p?.distantExtraInr ?? '—' },
      ]
    }

    return []
  }, [categoryById, dialog, makeById, modelById, typeById, variantById, vm.mappingPricingByMappingId])

  const modelsForMake = useMemo(() => {
    const m = new Map()
    for (const md of vm.models || []) {
      const key = md.makeId || '__NONE__'
      const arr = m.get(key) || []
      arr.push(md)
      m.set(key, arr)
    }
    return m
  }, [vm.models])

  const variantsForModel = useMemo(() => {
    const m = new Map()
    for (const v of vm.variants || []) {
      const key = v.modelId || '__NONE__'
      const arr = m.get(key) || []
      arr.push(v)
      m.set(key, arr)
    }
    return m
  }, [vm.variants])

  const firstMakeIdWithModels = useMemo(() => {
    const byMake = modelsForMake
    for (const mk of vm.makes || []) {
      if ((byMake.get(mk.id) || []).length) return mk.id
    }
    return vm.makes?.[0]?.id || ''
  }, [modelsForMake, vm.makes])

  const mappingRows = vm.mappings || []

  const mappingColumns = useMemo(
    () => [
      {
        key: 'combo',
        header: 'Vehicle combo',
        exportValue: (r) => {
          const t = typeById.get(r.typeId)?.name || '—'
          const mk = makeById.get(r.makeId)?.name || '—'
          const md = modelById.get(r.modelId)?.name || '—'
          const v = variantById.get(r.variantId)?.name || '—'
          return `${t} / ${mk} / ${md} / ${v}`
        },
        cell: (r) => (
          <div className="max-w-[520px] whitespace-normal text-xs text-slate-700">
            <div className="font-semibold text-slate-900">
              {typeById.get(r.typeId)?.name || '—'}
              {' / '}
              {makeById.get(r.makeId)?.name || '—'}
            </div>
            <div className="mt-0.5 text-slate-600">
              {modelById.get(r.modelId)?.name || '—'}
              {' / '}
              {variantById.get(r.variantId)?.name || '—'}
            </div>
          </div>
        ),
      },
      {
        key: 'categoryId',
        header: 'Category',
        exportValue: (r) => categoryById.get(r.categoryId)?.name || r.categoryId,
        cell: (r) => <Badge tone="cyan">{categoryById.get(r.categoryId)?.name || '—'}</Badge>,
      },
      {
        key: 'actions',
        header: <div className="w-full text-right">Actions</div>,
        cell: (r) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="icon"
              size="icon"
              onClick={() => setDialog({ type: 'viewMapping', item: r })}
              title={'View'}
            >
              <Eye className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              disabled={!permissions.managePricing}
              onClick={() => setDialog({ type: 'editMapping', item: r })}
              title={permissions.managePricing ? 'Edit mapping' : 'Insufficient permission'}
            >
              <Pencil className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              disabled={!permissions.managePricing}
              onClick={() => setDialog({ type: 'deleteMapping', item: r })}
              title={permissions.managePricing ? 'Delete mapping' : 'Insufficient permission'}
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [categoryById, makeById, modelById, permissions.managePricing, typeById, variantById]
  )

  const pricingRows = vm.mappings || []

  const pricingColumns = useMemo(
    () => [
      {
        key: 'combo',
        header: 'Vehicle combo',
        exportValue: (r) => {
          const t = typeById.get(r.typeId)?.name || '—'
          const mk = makeById.get(r.makeId)?.name || '—'
          const md = modelById.get(r.modelId)?.name || '—'
          const v = variantById.get(r.variantId)?.name || '—'
          return `${t} / ${mk} / ${md} / ${v}`
        },
        cell: (r) => (
          <div className="max-w-[520px] whitespace-normal text-xs text-slate-700">
            <div className="font-semibold text-slate-900">
              {typeById.get(r.typeId)?.name || '—'}
              {' / '}
              {makeById.get(r.makeId)?.name || '—'}
            </div>
            <div className="mt-0.5 text-slate-600">
              {modelById.get(r.modelId)?.name || '—'}
              {' / '}
              {variantById.get(r.variantId)?.name || '—'}
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        exportValue: (r) => categoryById.get(r.categoryId)?.name || r.categoryId,
        cell: (r) => <Badge tone="cyan">{categoryById.get(r.categoryId)?.name || '—'}</Badge>,
      },
      {
        key: 'base',
        header: 'Base (INR)',
        exportValue: (r) => String(vm.mappingPricingByMappingId?.[r.id]?.baseInr ?? ''),
        cell: (r) => (
          <div className="text-sm text-slate-700 text-center">{vm.mappingPricingByMappingId?.[r.id]?.baseInr ?? '—'}</div>
        ),
        className: 'text-center',
        tdClassName: 'text-center',
      },
      {
        key: 'distance',
        header: 'Distance rule',
        exportValue: (r) => {
          const p = vm.mappingPricingByMappingId?.[r.id]
          if (!p) return ''
          return `>=${p.distantAfterKm}km +${p.distantExtraInr}`
        },
        cell: (r) => {
          const p = vm.mappingPricingByMappingId?.[r.id]
          return (
            <div className="text-xs text-slate-600 text-center">
              {p ? (
                <>
                  {`>=${p.distantAfterKm} km`}
                  <span className="mx-1 text-slate-400">·</span>
                  {`+₹${p.distantExtraInr}`}
                </>
              ) : (
                '—'
              )}
            </div>
          )
        },
        className: 'text-center',
        tdClassName: 'text-center',
      },
      {
        key: 'set',
        header: (
          <div className="inline-flex w-full items-center justify-center gap-1">
            <Save className="h-3.5 w-3.5" />
            Set pricing
          </div>
        ),
        cell: (r) => (
          <div className="flex items-center justify-center gap-2">
            <Button variant="icon" size="icon" onClick={() => setDialog({ type: 'viewPricing', item: r })} title={'View'}>
              <Eye className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              disabled={!permissions.managePricing}
              onClick={() => setDialog({ type: 'setPricing', item: r })}
              title={permissions.managePricing ? 'Set mapping pricing' : 'Insufficient permission'}
            >
              <Tag className="h-4 w-4" />
              Set
            </Button>
          </div>
        ),
        className: 'text-center',
        tdClassName: 'text-center',
      },
    ],
    [categoryById, makeById, modelById, permissions.managePricing, typeById, variantById, vm.mappingPricingByMappingId]
  )

  return (
    <div className="space-y-3">
      <Card
        title="Vehicle Master"
        subtitle="Create base data → map combos → set category pricing"
        accent="cyan"
        right={
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((t) => (
              <TabButton key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </TabButton>
            ))}
            <Button onClick={async () => refresh()} className="ml-1">
              Refresh
            </Button>
          </div>
        }
      >
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load.</div>
        ) : null}

        {activeTab === 'base' ? (
          <div className={cx('space-y-3', loading && !data ? 'opacity-60' : '')}>
            <div className="columns-1 gap-3 lg:columns-2">
              {[
                { kind: 'type', title: 'Types', items: vm.types },
                { kind: 'make', title: 'Makes', items: vm.makes },
                { kind: 'model', title: 'Models', items: vm.models },
                { kind: 'variant', title: 'Variants', items: vm.variants },
                { kind: 'category', title: 'Categories', items: vm.categories },
              ].map((block) => (
                <Card
                  key={block.kind}
                  title={block.title}
                  subtitle="Create and manage"
                  accent="slate"
                  className="mb-3 break-inside-avoid"
                  right={
                    <Button
                      disabled={!permissions.managePricing}
                      onClick={() => setDialog({ type: 'createBase', kind: block.kind })}
                      title={permissions.managePricing ? `Create ${block.title}` : 'Insufficient permission'}
                    >
                      <ListPlus className="h-4 w-4" />
                      Add
                    </Button>
                  }
                >
                  <PaginatedTable
                    key={`base-${block.kind}`}
                    columns={[
                      {
                        key: 'name',
                        header: 'Name',
                        exportValue: (r) => r.name,
                        cell: (r) => (
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{r.name}</div>
                            <div className="truncate text-[11px] text-slate-500">{r.id}</div>
                          </div>
                        ),
                      },
                      {
                        key: 'actions',
                        header: <div className="w-full text-right">Actions</div>,
                        cell: (r) => (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="icon"
                              size="icon"
                              onClick={() => setDialog({ type: 'viewBase', kind: block.kind, item: r })}
                              title={'View'}
                            >
                              <Eye className="h-4 w-4 text-slate-700" />
                            </Button>
                            <Button
                              variant="icon"
                              size="icon"
                              disabled={!permissions.managePricing}
                              onClick={() => setDialog({ type: 'editBase', kind: block.kind, item: r })}
                              title={permissions.managePricing ? 'Edit' : 'Insufficient permission'}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="icon"
                              size="icon"
                              disabled={!permissions.managePricing}
                              onClick={() => setDialog({ type: 'deleteBase', kind: block.kind, item: r })}
                              title={permissions.managePricing ? 'Delete' : 'Insufficient permission'}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          </div>
                        ),
                        className: 'text-right',
                        tdClassName: 'text-right',
                      },
                    ]}
                    rows={block.items || []}
                    rowKey={(r) => r.id}
                    initialRowsPerPage={5}
                    rowsPerPageOptions={[5, 10, 20, 'all']}
                    enableSearch
                    searchPlaceholder={`Search ${block.title.toLowerCase()}…`}
                    enableExport
                    exportFilename={`${block.kind}.csv`}
                    getSearchText={(r) => `${r.name} ${r.id}`}
                  />
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'map' ? (
          <div className={cx('space-y-3', loading && !data ? 'opacity-60' : '')}>
            <Card
              title="Map vehicle to category"
              subtitle="Vehicle Type + Make + Model + Variant → Category"
              accent="violet"
              right={
                <Button
                  disabled={!permissions.managePricing}
                  onClick={() => setDialog({ type: 'createMapping' })}
                  title={permissions.managePricing ? 'Create mapping' : 'Insufficient permission'}
                >
                  <Link2 className="h-4 w-4" />
                  New mapping
                </Button>
              }
            >
              <div className="text-xs text-slate-600">
                Tip: keep base data clean. Mapping is the single source that decides which category a vehicle belongs to.
              </div>
            </Card>

            <Card title="Current mappings" subtitle="Search/export supported" accent="cyan">
              <PaginatedTable
                columns={mappingColumns}
                rows={mappingRows}
                rowKey={(r) => r.id}
                initialRowsPerPage={5}
                rowsPerPageOptions={[5, 10, 20, 'all']}
                enableSearch
                searchPlaceholder="Search mappings…"
                enableExport
                exportFilename="vehicle-mappings.csv"
              />
            </Card>
          </div>
        ) : null}

        {activeTab === 'pricing' ? (
          <div className={cx('space-y-3', loading && !data ? 'opacity-60' : '')}>
            <Card
              title="Category pricing"
              subtitle="Set pricing per vehicle mapping (distance rule supported)"
              accent="emerald"
              right={<Badge tone="slate">Demo</Badge>}
            >
              <div className="text-xs text-slate-600">
                Pricing is stored per mapping (Type + Make + Model + Variant). If distance is above threshold, extra amount is added.
              </div>
            </Card>

            <Card title="Pricing table" subtitle="Per mapping" accent="cyan">
              <PaginatedTable
                columns={pricingColumns}
                rows={pricingRows}
                rowKey={(r) => r.id}
                initialRowsPerPage={5}
                rowsPerPageOptions={[5, 10, 20, 'all']}
                enableSearch
                searchPlaceholder="Search mappings…"
                enableExport
                exportFilename="mapping-pricing.csv"
              />
            </Card>
          </div>
        ) : null}
      </Card>

      <ViewDetailsDialog
        open={viewDialogOpen}
        title={
          dialog?.type === 'viewBase'
            ? `View ${dialog?.kind}`
            : dialog?.type === 'viewMapping'
              ? 'View mapping'
              : dialog?.type === 'viewPricing'
                ? 'View pricing'
                : ''
        }
        onClose={() => setDialog(null)}
        items={viewDialogItems}
        accent={dialog?.type === 'viewPricing' ? 'emerald' : 'cyan'}
      />

      <ReasonDialog
        open={!!dialog && !viewDialogOpen}
        title={
          dialog?.type === 'createBase'
            ? `Create ${dialog.kind}`
            : dialog?.type === 'editBase'
              ? `Update ${dialog.kind}`
            : dialog?.type === 'deleteBase'
              ? `Delete ${dialog?.kind}`
            : dialog?.type === 'createMapping'
              ? 'Create mapping'
            : dialog?.type === 'editMapping'
                ? 'Update mapping'
              : dialog?.type === 'deleteMapping'
                ? 'Delete mapping'
                : dialog?.type === 'setPricing'
                  ? 'Set mapping pricing'
                  : ''
        }
        description={
          dialog?.type?.startsWith('delete')
            ? 'Are you sure you want to delete?'
            : dialog?.type === 'createMapping'
              ? 'Select Make → Model → Variant and map to a Category.'
              : null
        }
        submitLabel={dialog?.type?.startsWith('delete') ? 'Delete' : 'Apply'}
        showReason={false}
        requireReason={false}
        onClose={() => setDialog(null)}
        fields={(() => {
          if (dialog?.type === 'viewBase') {
            return [
              { name: 'id', label: 'ID', type: 'text', defaultValue: dialog?.item?.id || '', disabled: true },
              ...(dialog?.kind === 'model'
                ? [
                    {
                      name: 'makeId',
                      label: 'Make',
                      type: 'select',
                      defaultValue: dialog?.item?.makeId || '',
                      options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                      disabled: true,
                    },
                  ]
                : []),
              ...(dialog?.kind === 'variant'
                ? [
                    {
                      name: 'modelId',
                      label: 'Model',
                      type: 'select',
                      defaultValue: dialog?.item?.modelId || '',
                      options: (vm.models || []).map((m) => ({ value: m.id, label: m.name })),
                      disabled: true,
                    },
                  ]
                : []),
              { name: 'name', label: 'Name', type: 'text', defaultValue: dialog?.item?.name || '', disabled: true },
            ].filter(Boolean)
          }

          if (dialog?.type === 'createBase') {
            if (dialog.kind === 'model') {
              return [
                {
                  name: 'makeId',
                  label: 'Make',
                  type: 'select',
                  defaultValue: vm.makes?.[0]?.id || '',
                  options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                },
                { name: 'name', label: 'Model name', type: 'text', defaultValue: '' },
              ]
            }

            if (dialog.kind === 'variant') {
              const firstMakeId = firstMakeIdWithModels
              const firstModelId = (modelsForMake.get(firstMakeId) || [])?.[0]?.id || ''
              return [
                {
                  name: 'makeId',
                  label: 'Make',
                  type: 'select',
                  defaultValue: firstMakeId,
                  options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                  onChange: (nextMakeId, next) => {
                    const models = modelsForMake.get(nextMakeId) || []
                    const nextModelId = models?.[0]?.id || ''
                    return {
                      ...next,
                      modelId: nextModelId,
                    }
                  },
                },
                {
                  name: 'modelId',
                  label: 'Model',
                  type: 'select',
                  defaultValue: firstModelId,
                  options: (form) => {
                    const list = modelsForMake.get(form.makeId) || []
                    return list.map((m) => ({ value: m.id, label: m.name }))
                  },
                },
                { name: 'name', label: 'Variant name', type: 'text', defaultValue: '' },
              ]
            }

            return [{ name: 'name', label: 'Name', type: 'text', defaultValue: '' }]
          }

          if (dialog?.type === 'editBase') {
            if (dialog.kind === 'model') {
              return [
                {
                  name: 'makeId',
                  label: 'Make',
                  type: 'select',
                  defaultValue: dialog?.item?.makeId || vm.makes?.[0]?.id || '',
                  options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                },
                { name: 'name', label: 'Model name', type: 'text', defaultValue: dialog?.item?.name || '' },
              ]
            }

            if (dialog.kind === 'variant') {
              const model = vm.models?.find((m) => m.id === dialog?.item?.modelId)
              const defaultMakeId = model?.makeId || firstMakeIdWithModels
              const fallbackModelId = (modelsForMake.get(defaultMakeId) || [])?.[0]?.id || ''
              const defaultModelId = (modelsForMake.get(defaultMakeId) || []).some((m) => m.id === dialog?.item?.modelId)
                ? dialog?.item?.modelId
                : fallbackModelId

              return [
                {
                  name: 'makeId',
                  label: 'Make',
                  type: 'select',
                  defaultValue: defaultMakeId,
                  options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                  onChange: (nextMakeId, next) => {
                    const models = modelsForMake.get(nextMakeId) || []
                    const nextModelId = models?.[0]?.id || ''
                    return { ...next, modelId: nextModelId }
                  },
                },
                {
                  name: 'modelId',
                  label: 'Model',
                  type: 'select',
                  defaultValue: defaultModelId,
                  options: (form) => {
                    const list = modelsForMake.get(form.makeId) || []
                    return list.map((m) => ({ value: m.id, label: m.name }))
                  },
                },
                { name: 'name', label: 'Variant name', type: 'text', defaultValue: dialog?.item?.name || '' },
              ]
            }

            return [{ name: 'name', label: 'Name', type: 'text', defaultValue: dialog?.item?.name || '' }]
          }

          if (dialog?.type === 'deleteBase') {
            return []
          }

          if (dialog?.type === 'viewMapping') {
            const it = dialog?.item
            return [
              {
                name: 'typeId',
                label: 'Vehicle Type',
                type: 'select',
                defaultValue: it?.typeId || '',
                options: (vm.types || []).map((t) => ({ value: t.id, label: t.name })),
                disabled: true,
              },
              {
                name: 'makeId',
                label: 'Make',
                type: 'select',
                defaultValue: it?.makeId || '',
                options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                disabled: true,
              },
              {
                name: 'modelId',
                label: 'Model',
                type: 'select',
                defaultValue: it?.modelId || '',
                options: (vm.models || []).map((m) => ({ value: m.id, label: m.name })),
                disabled: true,
              },
              {
                name: 'variantId',
                label: 'Variant',
                type: 'select',
                defaultValue: it?.variantId || '',
                options: (vm.variants || []).map((v) => ({ value: v.id, label: v.name })),
                disabled: true,
              },
              {
                name: 'categoryId',
                label: 'Category',
                type: 'select',
                defaultValue: it?.categoryId || '',
                options: (vm.categories || []).map((c) => ({ value: c.id, label: c.name })),
                disabled: true,
              },
            ]
          }

          if (dialog?.type === 'createMapping') {
            return [
              {
                name: 'typeId',
                label: 'Vehicle Type',
                type: 'select',
                defaultValue: '',
                options: (vm.types || []).map((t) => ({ value: t.id, label: t.name })),
              },
              {
                name: 'makeId',
                label: 'Make',
                type: 'select',
                defaultValue: '',
                options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                onChange: (nextMakeId, next) => {
                  const models = modelsForMake.get(nextMakeId) || []
                  const nextModelId = models?.[0]?.id || ''
                  const variants = variantsForModel.get(nextModelId) || []
                  return {
                    ...next,
                    modelId: nextModelId,
                    variantId: variants?.[0]?.id || '',
                  }
                },
              },
              {
                name: 'modelId',
                label: 'Model',
                type: 'select',
                defaultValue: '',
                options: (form) => {
                  if (!form.makeId) return (vm.models || []).map((m) => ({ value: m.id, label: m.name }))
                  const list = modelsForMake.get(form.makeId) || []
                  return list.map((m) => ({ value: m.id, label: m.name }))
                },
                onChange: (nextModelId, next) => {
                  const model = vm.models?.find((m) => m.id === nextModelId)
                  const makeId = model?.makeId || next.makeId
                  const variants = variantsForModel.get(nextModelId) || []
                  return { ...next, makeId, variantId: variants?.[0]?.id || '' }
                },
              },
              {
                name: 'variantId',
                label: 'Variant',
                type: 'select',
                defaultValue: '',
                options: (form) => {
                  if (!form.modelId) return (vm.variants || []).map((v) => ({ value: v.id, label: v.name }))
                  const list = variantsForModel.get(form.modelId) || []
                  return list.map((v) => ({ value: v.id, label: v.name }))
                },
                onChange: (nextVariantId, next) => {
                  const variant = vm.variants?.find((v) => v.id === nextVariantId)
                  const modelId = variant?.modelId || next.modelId
                  const model = vm.models?.find((m) => m.id === modelId)
                  const makeId = model?.makeId || next.makeId
                  return { ...next, modelId, makeId }
                },
              },
              {
                name: 'categoryId',
                label: 'Category',
                type: 'select',
                defaultValue: '',
                options: (vm.categories || []).map((c) => ({ value: c.id, label: c.name })),
              },
            ]
          }

          if (dialog?.type === 'editMapping') {
            const it = dialog?.item
            const defaultMakeId = it?.makeId || vm.makes?.[0]?.id || ''
            const defaultModelId = it?.modelId || (modelsForMake.get(defaultMakeId) || [])?.[0]?.id || ''
            const defaultVariantId = it?.variantId || (variantsForModel.get(defaultModelId) || [])?.[0]?.id || ''

            return [
              {
                name: 'typeId',
                label: 'Vehicle Type',
                type: 'select',
                defaultValue: it?.typeId || vm.types?.[0]?.id || '',
                options: (vm.types || []).map((t) => ({ value: t.id, label: t.name })),
              },
              {
                name: 'makeId',
                label: 'Make',
                type: 'select',
                defaultValue: defaultMakeId,
                options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                onChange: (nextMakeId, next) => {
                  const models = modelsForMake.get(nextMakeId) || []
                  const nextModelId = models?.[0]?.id || ''
                  const variants = variantsForModel.get(nextModelId) || []
                  return { ...next, modelId: nextModelId, variantId: variants?.[0]?.id || '' }
                },
              },
              {
                name: 'modelId',
                label: 'Model',
                type: 'select',
                defaultValue: defaultModelId,
                options: (form) => {
                  const list = modelsForMake.get(form.makeId) || []
                  return list.map((m) => ({ value: m.id, label: m.name }))
                },
                onChange: (nextModelId, next) => {
                  const variants = variantsForModel.get(nextModelId) || []
                  return { ...next, variantId: variants?.[0]?.id || '' }
                },
              },
              {
                name: 'variantId',
                label: 'Variant',
                type: 'select',
                defaultValue: defaultVariantId,
                options: (form) => {
                  const list = variantsForModel.get(form.modelId) || []
                  return list.map((v) => ({ value: v.id, label: v.name }))
                },
              },
              {
                name: 'categoryId',
                label: 'Category',
                type: 'select',
                defaultValue: it?.categoryId || vm.categories?.[0]?.id || '',
                options: (vm.categories || []).map((c) => ({ value: c.id, label: c.name })),
              },
            ]
          }

          if (dialog?.type === 'deleteMapping') {
            return []
          }

          if (dialog?.type === 'viewPricing') {
            const it = dialog?.item
            const p = vm.mappingPricingByMappingId?.[it?.id] || null
            return [
              { name: 'mappingId', label: 'Mapping ID', type: 'text', defaultValue: it?.id || '', disabled: true },
              {
                name: 'categoryId',
                label: 'Category',
                type: 'select',
                defaultValue: it?.categoryId || '',
                options: (vm.categories || []).map((c) => ({ value: c.id, label: c.name })),
                disabled: true,
              },
              { name: 'baseInr', label: 'Base price (INR)', type: 'number', defaultValue: p?.baseInr ?? 500, disabled: true },
              {
                name: 'distantAfterKm',
                label: 'Distance threshold (km)',
                type: 'number',
                defaultValue: p?.distantAfterKm ?? 10,
                disabled: true,
              },
              {
                name: 'distantExtraInr',
                label: 'Extra cost if distance above threshold (INR)',
                type: 'number',
                defaultValue: p?.distantExtraInr ?? 50,
                disabled: true,
              },
            ]
          }

          if (dialog?.type === 'setPricing') {
            const p = vm.mappingPricingByMappingId?.[dialog?.item?.id] || null
            return [
              {
                name: 'baseInr',
                label: 'Base price (INR)',
                type: 'number',
                defaultValue: p?.baseInr ?? 500,
                placeholder: 'e.g. 800',
              },
              {
                name: 'distantAfterKm',
                label: 'Distance threshold (km)',
                type: 'number',
                defaultValue: p?.distantAfterKm ?? 10,
                placeholder: 'e.g. 10',
              },
              {
                name: 'distantExtraInr',
                label: 'Extra cost if distance above threshold (INR)',
                type: 'number',
                defaultValue: p?.distantExtraInr ?? 50,
                placeholder: 'e.g. 50',
              },
            ]
          }

          return []
        })()}
        onSubmit={async (form) => {
          try {
            if (!dialog) return

            if (dialog.type === 'viewBase' || dialog.type === 'viewMapping' || dialog.type === 'viewPricing') {
              setDialog(null)
              return
            }

            if (!permissions.managePricing) throw new Error('Insufficient permission')

            if (dialog.type === 'createBase') {
              await mockApi.createVehicleMasterItem({
                actor,
                kind: dialog.kind,
                name: String(form.name || '').trim(),
                makeId: form.makeId,
                modelId: form.modelId,
              })
            }

            if (dialog.type === 'editBase') {
              await mockApi.updateVehicleMasterItem({
                actor,
                kind: dialog.kind,
                id: dialog.item.id,
                patch: {
                  name: String(form.name || '').trim(),
                  ...(dialog.kind === 'model' ? { makeId: form.makeId } : null),
                  ...(dialog.kind === 'variant' ? { modelId: form.modelId } : null),
                },
              })
            }

            if (dialog.type === 'deleteBase') {
              await mockApi.deleteVehicleMasterItem({
                actor,
                kind: dialog.kind,
                id: dialog.item.id,
              })
            }

            if (dialog.type === 'createMapping') {
              await mockApi.upsertVehicleMapping({
                actor,
                typeId: form.typeId,
                makeId: form.makeId,
                modelId: form.modelId,
                variantId: form.variantId,
                categoryId: form.categoryId,
              })
            }

            if (dialog.type === 'editMapping') {
              await mockApi.updateVehicleMapping({
                actor,
                id: dialog.item.id,
                patch: {
                  typeId: form.typeId,
                  makeId: form.makeId,
                  modelId: form.modelId,
                  variantId: form.variantId,
                  categoryId: form.categoryId,
                },
              })
            }

            if (dialog.type === 'deleteMapping') {
              await mockApi.deleteVehicleMapping({
                actor,
                id: dialog.item.id,
              })
            }

            if (dialog.type === 'setPricing') {
              await mockApi.setMappingPricing({
                actor,
                mappingId: dialog.item.id,
                baseInr: Number(form.baseInr),
                distantAfterKm: Number(form.distantAfterKm),
                distantExtraInr: Number(form.distantExtraInr),
              })
            }

            setDialog(null)
            refresh()
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />
    </div>
  )
}
