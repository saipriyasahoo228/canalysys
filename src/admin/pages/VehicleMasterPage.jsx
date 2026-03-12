




import { useEffect, useMemo, useState } from 'react'
import { Eye, Link2, ListPlus, Pencil, Save, Tag, Trash2 } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, cx, PaginatedTable } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { Snackbar } from '../ui/Snackbar'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { formatDate } from '../utils/format'
import {
  listBrands,
  createBrand,
  retrieveBrand,
  updateBrand,
  patchBrand,
  deleteBrand,
  listModels,
  createModel,
  retrieveModel,
  updateModel,
  patchModel,
  deleteModel,
  listVariants,
  createVariant,
  retrieveVariant,
  updateVariant,
  patchVariant,
  deleteVariant,
  listCategoryTypes,
  createCategoryType,
  getCategoryType,
  updateCategoryType,
  patchCategoryType,
  deleteCategoryType,
  listCategoryValues,
  createCategoryValue,
  getCategoryValue,
  updateCategoryValue,
  patchCategoryValue,
  deleteCategoryValue,
} from '../../api/vehiclemaster'
import { createVehicleCategoryMapping, listVehicleCategoryMappings, getVehicleCategoryMapping, updateVehicleCategoryMapping, deleteVehicleCategoryMapping } from '../../api/categorymapping'
import { listCategoryPricing, createCategoryPricing, retrieveCategoryPricing, updateCategoryPricing, patchCategoryPricing, deleteCategoryPricing } from '../../api/categorypricing'

const tabs = [
  { key: 'base', label: 'Base data' },
  { key: 'map', label: 'Mapping' },
  { key: 'pricing', label: 'Category pricing' },
]

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'owned', label: 'Owned' },
]

function conditionLabel(v) {
  if (v === 'new') return 'New'
  if (v === 'owned') return 'Owned'
  return '—'
}

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
  const [snack, setSnack] = useState({ open: false, tone: 'info', title: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [modelsBrandId, setModelsBrandId] = useState('')
  const [variantsBrandId, setVariantsBrandId] = useState('')
  const [variantsModelId, setVariantsModelId] = useState('')
  const [viewDetail, setViewDetail] = useState({ kind: null, id: null, loading: false, data: null, error: null })
  const [viewCategoryPricingDetail, setViewCategoryPricingDetail] = useState({ id: null, loading: false, data: null, error: null })
  
  // Category pricing filters
  const [pricingFilters, setPricingFilters] = useState({
    category: '',
    vehicle_type: '',
    is_active: ''
  })

  // Category Types state
  const [categoryTypes, setCategoryTypes] = useState([])
  const [categoryTypesLoading, setCategoryTypesLoading] = useState(false)
  const [categoryTypesError, setCategoryTypesError] = useState(null)

  // Category Values state
  const [categoryValues, setCategoryValues] = useState([])
  const [categoryValuesLoading, setCategoryValuesLoading] = useState(false)
  const [categoryValuesError, setCategoryValuesError] = useState(null)

  const { data, loading, error, refresh } = usePolling('vehicle-master', () => Promise.resolve({ items: [] }), {
    intervalMs: 15_000,
  })

  const {
    data: brandsData,
    loading: brandsLoading,
    error: brandsError,
    refresh: refreshBrands,
  } = usePolling('brands', () => listBrands(1), { intervalMs: 15_000 })

  const {
    data: modelsData,
    error: modelsError,
    refresh: refreshModels,
  } = usePolling(
    `models-${modelsBrandId || 'all'}`,
    () => listModels({ page: 1, brand_id: modelsBrandId || undefined }),
    { intervalMs: 15_000 }
  )

  const {
    data: variantsData,
    error: variantsError,
    refresh: refreshVariants,
  } = usePolling(
    `variants-${variantsModelId || 'all'}`,
    () => listVariants({ page: 1, model_id: variantsModelId || undefined }),
    { intervalMs: 15_000 }
  )

  const {
    data: categoriesData,
    error: categoriesError,
    refresh: refreshCategories,
  } = usePolling('categories', () => listCategoryValues(1), { intervalMs: 15_000 })

  const {
    data: mappingsData,
    error: mappingsError,
    refresh: refreshMappings,
  } = usePolling('mappings', () => listVehicleCategoryMappings(1), { intervalMs: 15_000 })

  const {
    data: categoryPricingData,
    error: categoryPricingError,
    refresh: refreshCategoryPricing,
  } = usePolling('category-pricing', () => listCategoryPricing({ page: 1 }), { intervalMs: 15_000 })

  const vm = data || {
    makes: [],
    models: [],
    variants: [],
    categories: [],
    mappings: [],
    mappingPricingByMappingId: {},
    pricingByCategoryId: {},
  }

  const brands = useMemo(() => {
    const items = brandsData?.items
    if (!Array.isArray(items)) return []
    return items.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      is_active: b.is_active,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }))
  }, [brandsData])

  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands])

  const models = useMemo(() => {
    const items = modelsData?.items
    if (!Array.isArray(items)) return []
    return items.map((m) => ({
      id: m.id,
      brand: m.brand,
      brand_detail: m.brand_detail,
      name: m.name,
      description: m.description,
      is_active: m.is_active,
      created_at: m.created_at,
      updated_at: m.updated_at,
    }))
  }, [modelsData])

  const modelsForVariantsBrand = useMemo(() => {
    const bid = String(variantsBrandId || '').trim()
    if (!bid) return models
    return models.filter((m) => String(m.brand) === bid)
  }, [models, variantsBrandId])

  const variants = useMemo(() => {
    const items = variantsData?.items
    if (!Array.isArray(items)) return []
    return items.map((v) => ({
      id: v.id,
      model: v.model,
      model_detail: v.model_detail,
      brand_name: v.brand_name,
      name: v.name,
      description: v.description,
      engine_specs: v.engine_specs,
      is_active: v.is_active,
      created_at: v.created_at,
      updated_at: v.updated_at,
    }))
  }, [variantsData])

  const categories = useMemo(() => {
    const items = categoriesData?.items
    if (!Array.isArray(items)) return []
    return items.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      category_type: c.category_type,
      is_active: c.is_active,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }))
  }, [categoriesData])

  const categoryPricingItems = useMemo(() => {
    const items = categoryPricingData?.items
    if (!Array.isArray(items)) return []
    
    return items.filter(item => {
      if (pricingFilters.category && item.category !== pricingFilters.category) return false
      if (pricingFilters.vehicle_type && item.vehicle_type !== pricingFilters.vehicle_type) return false
      if (pricingFilters.is_active !== '' && item.is_active !== (pricingFilters.is_active === 'true')) return false
      return true
    })
  }, [categoryPricingData, pricingFilters])

  const mappings = useMemo(() => {
    const items = mappingsData?.items
    if (!Array.isArray(items)) return []
    return items.map((m) => ({
      id: m.id,
      vehicle_type: m.vehicle_type,
      brand: m.brand,
      model: m.model,
      variant: m.variant,
      category: m.category,
      created_at: m.created_at,
      updated_at: m.updated_at,
    }))
  }, [mappingsData])

  const [dialog, setDialog] = useState(null)
  const [tableNonce, setTableNonce] = useState(0)
  const [viewMappingDetail, setViewMappingDetail] = useState(null)

  useEffect(() => {
    const run = async () => {
      if (dialog?.type !== 'viewBase') {
        setViewDetail({ kind: null, id: null, loading: false, data: null, error: null })
        return
      }

      const kind = dialog?.kind
      const id = dialog?.item?.id
      if (!id) return

      setViewDetail({ kind, id, loading: true, data: null, error: null })
      try {
        let data = null
        if (kind === 'make') data = await retrieveBrand(id)
        else if (kind === 'model') data = await retrieveModel(id)
        else if (kind === 'variant') data = await retrieveVariant(id)
        else if (kind === 'categoryType') data = await getCategoryType(id)
        else if (kind === 'categoryValue') data = await getCategoryValue(id)
        setViewDetail({ kind, id, loading: false, data, error: null })
      } catch (e) {
        setViewDetail({ kind, id, loading: false, data: null, error: e })
      }
    }
    run()
  }, [dialog])

  useEffect(() => {
    const run = async () => {
      if (dialog?.type !== 'viewMapping') {
        setViewMappingDetail(null)
        return
      }

      const mappingId = dialog?.item?.id
      if (!mappingId) return

      console.log('Fetching mapping details for ID:', mappingId)
      try {
        const data = await getVehicleCategoryMapping(mappingId)
        console.log('Received mapping data:', data)
        setViewMappingDetail(data)
      } catch (e) {
        console.error('Failed to fetch mapping details:', e)
        setViewMappingDetail(null)
      }
    }
    run()
  }, [dialog])

  useEffect(() => {
    const run = async () => {
      if (dialog?.type !== 'viewCategoryPricing') {
        setViewCategoryPricingDetail({ id: null, loading: false, data: null, error: null })
        return
      }

      const pricingId = dialog?.item?.id
      if (!pricingId) return

      setViewCategoryPricingDetail({ id: pricingId, loading: true, data: null, error: null })
      try {
        const data = await retrieveCategoryPricing(pricingId)
        setViewCategoryPricingDetail({ id: pricingId, loading: false, data, error: null })
      } catch (e) {
        setViewCategoryPricingDetail({ id: pricingId, loading: false, data: null, error: e })
      }
    }
    run()
  }, [dialog])

  const showSnack = (next) => {
    setSnack({ open: true, tone: next?.tone || 'info', title: next?.title || '', message: next?.message || '' })
  }

  const extractFieldErrors = (e) => {
    if (!e || typeof e !== 'object') return {}

    const out = {}
    for (const [k, v] of Object.entries(e)) {
      if (!k) continue
      if (k === 'detail' || k === 'message') continue

      if (Array.isArray(v)) {
        const msg = v.filter(Boolean).map(String).join(', ')
        if (msg) out[k] = msg
        continue
      }

      if (typeof v === 'string' && v.trim()) {
        out[k] = v
      }
    }

    return out
  }

  const extractBackendMessage = (v) => {
    if (!v) return ''
    if (typeof v === 'string') return v.trim()
    if (typeof v === 'object') {
      if (typeof v.detail === 'string' && v.detail.trim()) return v.detail.trim()
      if (typeof v.message === 'string' && v.message.trim()) return v.message.trim()
      if (Array.isArray(v.non_field_errors) && v.non_field_errors.length) {
        const msg = v.non_field_errors.filter(Boolean).map(String).join(', ')
        if (msg.trim()) return msg.trim()
      }
    }
    return ''
  }

  const errorToMessage = (e) => {
    if (!e) return 'Action failed'
    if (typeof e === 'string') return e
    const backend = extractBackendMessage(e)
    if (backend) return backend
    if (e?.message) return String(e.message)
    return 'Action failed'
  }

  const responseToMessage = (res) => {
    const backend = extractBackendMessage(res)
    return backend || 'Success'
  }

  const makeById = useMemo(() => new Map(brands.map((x) => [x.id, x])), [brands])
  const modelById = useMemo(() => new Map(models.map((x) => [x.id, x])), [models])
  const variantById = useMemo(() => new Map(variants.map((x) => [x.id, x])), [variants])
  const categoryById = useMemo(() => new Map(categories.map((x) => [x.id, x])), [categories])

  const viewDialogOpen = dialog?.type === 'viewBase' || dialog?.type === 'viewMapping' || dialog?.type === 'viewPricing' || dialog?.type === 'viewCategoryPricing'

  // Fetch Category Types on component mount
  useEffect(() => {
    refreshCategoryTypes()
  }, [])

  // Fetch Category Values on component mount
  useEffect(() => {
    refreshCategoryValues()
  }, [])

  // Refresh Category Types function
  const refreshCategoryTypes = async () => {
    try {
      const response = await listCategoryTypes({ page: 1 })
      setCategoryTypes(response.items || [])
      setCategoryTypesError(null)
    } catch (error) {
      console.error('Failed to refresh category types:', error)
      setCategoryTypesError(error.message || 'Failed to load category types')
    }
  }

  // Refresh Category Values function
  const refreshCategoryValues = async () => {
    try {
      const response = await listCategoryValues({ page: 1 })
      setCategoryValues(response.items || [])
      setCategoryValuesError(null)
    } catch (error) {
      console.error('Failed to refresh category values:', error)
      setCategoryValuesError(error.message || 'Failed to load category values')
    }
  }

  const viewDialogItems = useMemo(() => {
    if (!dialog) return []

    if (dialog.type === 'viewBase') {
      const isDetailMatch = viewDetail?.kind === dialog?.kind && viewDetail?.id === dialog?.item?.id
      // Extract data from API response wrapper
      const detailIt = isDetailMatch ? viewDetail?.data?.data || viewDetail?.data : null
      const it = detailIt || dialog.item
      const kindLabel = String(dialog.kind || '').toUpperCase()
      return [
        { key: 'kind', label: 'Kind', value: kindLabel || '—' },
        { key: 'id', label: 'ID', value: it?.id || '—' },
        ...(dialog.kind === 'make'
          ? [
              { key: 'description', label: 'Description', value: it?.description || '—', fullWidth: true },
              { key: 'is_active', label: 'Active', value: it?.is_active === false ? 'No' : 'Yes' },
              { key: 'created_at', label: 'Created', value: it?.created_at ? new Date(it.created_at).toLocaleString() : '—' },
              { key: 'updated_at', label: 'Updated', value: it?.updated_at ? new Date(it.updated_at).toLocaleString() : '—' },
            ]
          : []),
        ...(dialog.kind === 'model'
          ? [
              { key: 'brand', label: 'Brand', value: it?.brand_detail?.name || it?.brand || '—' },
              { key: 'description', label: 'Description', value: it?.description || '—', fullWidth: true },
              { key: 'is_active', label: 'Active', value: it?.is_active === false ? 'No' : 'Yes' },
              { key: 'created_at', label: 'Created', value: it?.created_at ? new Date(it.created_at).toLocaleString() : '—' },
              { key: 'updated_at', label: 'Updated', value: it?.updated_at ? new Date(it.updated_at).toLocaleString() : '—' },
            ]
          : []),
        ...(dialog.kind === 'variant'
          ? [
              {
                key: 'brand',
                label: 'Brand',
                value: it?.brand_name || it?.model_detail?.brand_detail?.name || '—',
              },
              { key: 'model', label: 'Model', value: it?.model_detail?.name || '—' },
              { key: 'description', label: 'Description', value: it?.description || '—', fullWidth: true },
              {
                key: 'engine_specs',
                label: 'Engine specs',
                value: it?.engine_specs
                  ? `CC: ${it.engine_specs.cc ?? '—'}, Fuel: ${it.engine_specs.fuel_type ?? '—'}`
                  : '—',
                fullWidth: true,
              },
              { key: 'is_active', label: 'Active', value: it?.is_active === false ? 'No' : 'Yes' },
              { key: 'created_at', label: 'Created', value: it?.created_at ? new Date(it.created_at).toLocaleString() : '—' },
              { key: 'updated_at', label: 'Updated', value: it?.updated_at ? new Date(it.updated_at).toLocaleString() : '—' },
            ]
          : []),
        ...(dialog.kind === 'categoryType'
          ? [
              { key: 'description', label: 'Description', value: it?.description || '—', fullWidth: true },
              { key: 'is_active', label: 'Active', value: it?.is_active === false ? 'No' : 'Yes' },
              { key: 'created_at', label: 'Created', value: it?.created_at ? new Date(it.created_at).toLocaleString() : '—' },
              { key: 'updated_at', label: 'Updated', value: it?.updated_at ? new Date(it.updated_at).toLocaleString() : '—' },
            ]
          : []),
        ...(dialog.kind === 'categoryValue'
          ? [
              { key: 'category_type', label: 'Category Type', value: it?.category_type_detail?.name || it?.category_type || '—' },
              { key: 'description', label: 'Description', value: it?.description || '—', fullWidth: true },
              { key: 'is_active', label: 'Active', value: it?.is_active === false ? 'No' : 'Yes' },
              { key: 'created_at', label: 'Created', value: it?.created_at ? new Date(it.created_at).toLocaleString() : '—' },
              { key: 'updated_at', label: 'Updated', value: it?.updated_at ? new Date(it.updated_at).toLocaleString() : '—' },
            ]
          : []),
        { key: 'name', label: 'Name', value: it?.name || '—', fullWidth: true },
      ]
    }

    if (dialog.type === 'viewMapping') {
      // Use fetched detailed data if available, fallback to dialog.item
      const it = viewMappingDetail?.data || dialog.item
      return [
        { key: 'mappingId', label: 'Mapping ID', value: it?.id || '—' },
        { key: 'vehicle_type', label: 'Vehicle Type', value: it?.vehicle_type_label || conditionLabel(it?.vehicle_type) || '—' },
        { key: 'brand', label: 'Brand', value: it?.brand_detail?.name || it?.brand_name || it?.brand || '—' },
        { key: 'model', label: 'Model', value: it?.model_detail?.name || it?.model_name || it?.model || '—' },
        { key: 'variant', label: 'Variant', value: it?.variant_detail?.name || it?.variant_name || it?.variant || '—' },
        { key: 'category', label: 'Category', value: it?.category_detail?.name || it?.category_name || it?.category || '—' },
        { key: 'category_type', label: 'Category Type', value: it?.category_type_name || it?.category_detail?.category_type_detail?.name || '—' },
        { key: 'is_active', label: 'Active', value: it?.is_active === false ? 'No' : 'Yes' },
        { key: 'created_at', label: 'Created', value: it?.created_at ? new Date(it.created_at).toLocaleString() : '—' },
        { key: 'updated_at', label: 'Updated', value: it?.updated_at ? new Date(it.updated_at).toLocaleString() : '—' },
      ]
    }

    if (dialog.type === 'viewPricing') {
      const it = dialog.item
      const p = vm.mappingPricingByMappingId?.[it?.id] || null
      return [
        { key: 'mappingId', label: 'Mapping ID', value: it?.id || '—' },
        { key: 'category', label: 'Category', value: categoryById.get(it?.category)?.name || it?.category || '—' },
        { key: 'baseInr', label: 'Base price (INR)', value: p?.baseInr ?? '—' },
        { key: 'distantAfterKm', label: 'Distance threshold (km)', value: p?.distantAfterKm ?? '—' },
        { key: 'distantExtraInr', label: 'Extra cost above threshold (INR)', value: p?.distantExtraInr ?? '—' },
      ]
    }

    if (dialog.type === 'viewCategoryPricing') {
      const it = viewCategoryPricingDetail?.data?.data || viewCategoryPricingDetail?.data || dialog.item
      return [
        { key: 'id', label: 'ID', value: it?.id || '—' },
        { key: 'category', label: 'Category', value: it?.category_name || it?.category || '—' },
        { key: 'vehicle_type', label: 'Vehicle Type', value: it?.vehicle_type || '—' },
        { key: 'price', label: 'Price', value: it?.price || '—' },
        { key: 'effective_from', label: 'Effective From', value: formatDate(it?.effective_from) || '—' },
        { key: 'effective_to', label: 'Effective To', value: formatDate(it?.effective_to) || '—' },
        { key: 'is_active', label: 'Status', value: it?.is_active ? 'Active' : 'Inactive' },
        { key: 'created_at', label: 'Created', value: it?.created_at ? formatDate(it.created_at) : '—' },
        { key: 'updated_at', label: 'Updated', value: it?.updated_at ? formatDate(it.updated_at) : '—' },
      ]
    }

    return []
  }, [brandById, categoryById, dialog, makeById, modelById, variantById, viewDetail, viewMappingDetail, viewCategoryPricingDetail, vm.mappingPricingByMappingId])

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

  const mappingRows = mappings || []

  const mappingColumns = useMemo(
    () => [
      {
        key: 'combo',
        header: 'Vehicle combo',
        exportValue: (r) => {
          const t = conditionLabel(r.vehicle_type) || '—'
          const mk = makeById.get(r.brand)?.name || '—'
          const md = modelById.get(r.model)?.name || '—'
          const v = variantById.get(r.variant)?.name || '—'
          return `${t} / ${mk} / ${md} / ${v}`
        },
        cell: (r) => (
          <div className="max-w-[520px] whitespace-normal text-xs text-slate-700">
            <div className="font-semibold text-slate-900">
              {conditionLabel(r.vehicle_type) || '—'}
              {' / '}
              {makeById.get(r.brand)?.name || '—'}
            </div>
            <div className="mt-0.5 text-slate-600">
              {modelById.get(r.model)?.name || '—'}
              {' / '}
              {variantById.get(r.variant)?.name || '—'}
            </div>
          </div>
        ),
      },
      {
        key: 'categoryId',
        header: 'Category',
        exportValue: (r) => categoryById.get(r.category)?.name || r.category,
        cell: (r) => <Badge tone="cyan">{categoryById.get(r.category)?.name || '—'}</Badge>,
      },
      {
        key: 'actions',
        header: (
          <div className="flex w-full justify-end">
            <div className="w-[92px] text-center">Actions</div>
          </div>
        ),
        cell: (r) => (
          <div className="flex w-full justify-end">
            <div className="flex w-[92px] items-center justify-center gap-1">
              <Button variant="icon" size="icon" onClick={() => setDialog({ type: 'viewMapping', item: r })} title={'View'}>
                <Eye className="h-4 w-4 text-slate-700" />
              </Button>
              <Button
                variant="icon"
                size="icon"
                disabled={!permissions.managePricing}
                onClick={() => setDialog({ type: 'editMapping', item: r })}
                title={permissions.managePricing ? 'Update' : 'Insufficient permission'}
              >
                <Pencil className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="icon"
                size="icon"
                disabled={!permissions.managePricing}
                onClick={() => setDialog({ type: 'deleteMapping', item: r })}
                title={permissions.managePricing ? 'Delete' : 'Insufficient permission'}
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
              </Button>
            </div>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [categoryById, makeById, modelById, permissions.managePricing, variantById]
  )

  const pricingColumns = useMemo(
    () => [
      {
        key: 'category',
        header: 'Category',
        exportValue: (r) => r.category_name || String(r.category || ''),
        cell: (r) => <Badge tone="amber">{r.category_name || '—'}</Badge>,
      },
      {
        key: 'vehicle_type',
        header: 'Vehicle type',
        exportValue: (r) => r.vehicle_type,
        cell: (r) => <div className="text-sm text-slate-700 text-center">{r.vehicle_type || '—'}</div>,
        className: 'text-center',
        tdClassName: 'text-center',
      },
      {
        key: 'price',
        header: 'Price',
        exportValue: (r) => String(r.price || ''),
        cell: (r) => <div className="text-sm text-slate-700 text-center">{r.price || '—'}</div>,
        className: 'text-center',
        tdClassName: 'text-center',
      },
      {
        key: 'effective_from',
        header: 'Effective from',
        exportValue: (r) => formatDate(r.effective_from),
        cell: (r) => <div className="text-sm text-slate-700 text-center">{formatDate(r.effective_from) || '—'}</div>,
        className: 'text-center',
        tdClassName: 'text-center',
      },
      {
        key: 'effective_to',
        header: 'Effective to',
        exportValue: (r) => formatDate(r.effective_to),
        cell: (r) => <div className="text-sm text-slate-700 text-center">{formatDate(r.effective_to) || '—'}</div>,
        className: 'text-center',
        tdClassName: 'text-center',
      },
      {
        key: 'is_active',
        header: 'Status',
        exportValue: (r) => r.is_active ? 'Active' : 'Inactive',
        cell: (r) => (
          <Badge tone={r.is_active ? 'emerald' : 'rose'}>
            {r.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
        className: 'text-center',
        tdClassName: 'text-center',
      },
      {
        key: 'actions',
        header: (
          <div className="flex w-full justify-end">
            <div className="w-[92px] text-center">Actions</div>
          </div>
        ),
        cell: (r) => (
          <div className="flex w-full justify-end">
            <div className="flex w-[92px] items-center justify-center gap-1">
              <Button 
                variant="icon" 
                size="icon" 
                onClick={() => setDialog({ type: 'viewCategoryPricing', item: r })} 
                title={'View'}
              >
                <Eye className="h-4 w-4 text-slate-700" />
              </Button>
              <Button
                variant="icon"
                size="icon"
                disabled={!permissions.managePricing}
                onClick={() => setDialog({ type: 'editCategoryPricing', item: r })}
                title={permissions.managePricing ? 'Update' : 'Insufficient permission'}
              >
                <Pencil className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="icon"
                size="icon"
                disabled={!permissions.managePricing}
                onClick={() => setDialog({ type: 'deleteCategoryPricing', item: r })}
                title={permissions.managePricing ? 'Delete' : 'Insufficient permission'}
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
              </Button>
            </div>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [permissions.managePricing]
  )

  return (
    <div className="space-y-3">
      <Card
        title="Vehicle Master"
        subtitle="Create base data → map to category → set pricing"
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

        {brandsError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            Failed to load brands.
          </div>
        ) : null}

        {modelsError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load models.</div>
        ) : null}

        {variantsError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load variants.</div>
        ) : null}

        {categoriesError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load categories.</div>
        ) : null}

        {mappingsError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load mappings.</div>
        ) : null}

        {activeTab === 'base' ? (
          <div
            className={cx(
              'space-y-3',
              (loading && !data) || (brandsLoading && !brandsData) || (!modelsData && !modelsError) ? 'opacity-60' : ''
            )}
          >
            <div className="columns-1 gap-3 lg:columns-2">
              {[
                { kind: 'make', title: 'Brands', items: brands },
                { kind: 'model', title: 'Models', items: models },
                { kind: 'variant', title: 'Variants', items: variants },
                { kind: 'categoryType', title: 'Category Types', items: categoryTypes },
                { kind: 'categoryValue', title: 'Category Values', items: categoryValues },
              ].map((block) => (
                <Card
                  key={block.kind}
                  title={block.title}
                  subtitle="Create and manage"
                  accent="slate"
                  className="mb-3 break-inside-avoid"
                  right={
                    <div className="flex flex-wrap items-center gap-2">
                      {block.kind === 'model' ? (
                        <select
                          className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70"
                          value={modelsBrandId}
                          onChange={(e) => setModelsBrandId(e.target.value)}
                        >
                          <option value="">All brands</option>
                          {brands.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      {block.kind === 'variant' ? (
                        <>
                          <select
                            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70"
                            value={variantsBrandId}
                            onChange={(e) => {
                              setVariantsBrandId(e.target.value)
                              setVariantsModelId('')
                            }}
                          >
                            <option value="">All brands</option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70"
                            value={variantsModelId}
                            onChange={(e) => setVariantsModelId(e.target.value)}
                          >
                            <option value="">All models</option>
                            {modelsForVariantsBrand.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : null}
                      <Button
                        disabled={
                          !permissions.managePricing ||
                          (block.kind === 'model' && brands.length === 0) ||
                          (block.kind === 'variant' && models.length === 0)
                        }
                        onClick={() => setDialog({ type: 'createBase', kind: block.kind })}
                        title={
                          !permissions.managePricing
                            ? 'Insufficient permission'
                            : block.kind === 'model' && brands.length === 0
                              ? 'Create a brand first'
                              : block.kind === 'variant' && models.length === 0
                                ? 'Create a model first'
                              : `Create ${block.title}`
                        }
                      >
                        <ListPlus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  }
                >
                  <PaginatedTable
                    key={`base-${block.kind}-${tableNonce}`}
                    columns={[
                      {
                        key: 'name',
                        header: 'Name',
                        exportValue: (r) => r.name,
                        cell: (r) => (
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{r.name}</div>
                            {block.kind === 'model' ? (
                              <div className="truncate text-[11px] text-slate-500">
                                {r.brand_detail?.name || brandById.get(r.brand)?.name || '—'}
                              </div>
                            ) : null}
                            {block.kind === 'variant' ? (
                              <div className="truncate text-[11px] text-slate-500">
                                {r.brand_name || r.model_detail?.brand_detail?.name || '—'} / {r.model_detail?.name || '—'}
                              </div>
                            ) : null}
                          </div>
                        ),
                      },
                      {
                        key: 'actions',
                        header: (
                          <div className="flex w-full justify-end">
                            <div className="w-[92px] text-center">Actions</div>
                          </div>
                        ),
                        cell: (r) => (
                          <div className="flex w-full justify-end">
                            <div className="flex w-[92px] items-center justify-center gap-1">
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
                                title={permissions.managePricing ? 'Update' : 'Insufficient permission'}
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
                    getSearchText={(r) => {
                      if (block.kind === 'model') return `${r.name} ${r.brand_detail?.name || brandById.get(r.brand)?.name || ''}`
                      if (block.kind === 'variant') {
                        return `${r.name} ${r.brand_name || r.model_detail?.brand_detail?.name || ''} ${r.model_detail?.name || ''}`
                      }
                      return `${r.name} ${r.id}`
                    }}
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
              subtitle="Vehicle Type + Brand + Model + Variant → Category"
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
                key={`mappings-${tableNonce}`}
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
              subtitle="Pricing per category"
              accent="emerald"
              right={
                <div className="flex items-center gap-2">
                  <Button disabled={!permissions.managePricing} onClick={() => setDialog({ type: 'createCategoryPricing' })}>
                    <Tag className="h-4 w-4" />
                    Add pricing
                  </Button>
                </div>
              }
            >
              <div className="text-xs text-slate-600">
                Set pricing for a category and vehicle type. Effective date range supported.
              </div>
              
              {/* Filters */}
              <div className="mt-4 flex flex-wrap gap-2">
                <select
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70"
                  value={pricingFilters.category}
                  onChange={(e) => setPricingFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                
                <select
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70"
                  value={pricingFilters.vehicle_type}
                  onChange={(e) => setPricingFilters(prev => ({ ...prev, vehicle_type: e.target.value }))}
                >
                  <option value="">All Vehicle Types</option>
                  <option value="owned">Owned</option>
                  <option value="partner">Partner</option>
                </select>
                
                <select
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-200/70"
                  value={pricingFilters.is_active}
                  onChange={(e) => setPricingFilters(prev => ({ ...prev, is_active: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPricingFilters({ category: '', vehicle_type: '', is_active: '' })}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>

            <Card title="Pricing table" subtitle="Per mapping" accent="cyan">
              <PaginatedTable
                key={`pricing-${tableNonce}`}
                columns={pricingColumns}
                rows={categoryPricingItems}
                rowKey={(r) => r.id}
                initialRowsPerPage={5}
                rowsPerPageOptions={[5, 10, 20, 'all']}
                enableSearch
                searchPlaceholder="Search categories…"
                enableExport
                exportFilename="category-pricing.csv"
              />
            </Card>

            {categoryPricingError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load category pricing.</div>
            ) : null}
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
                : dialog?.type === 'viewCategoryPricing'
                  ? 'View category pricing'
                  : ''
        }
        onClose={() => setDialog(null)}
        items={viewDialogItems}
        accent={dialog?.type === 'viewPricing' || dialog?.type === 'viewCategoryPricing' ? 'emerald' : 'cyan'}
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
                  : dialog?.type === 'setCategoryPricing'
                    ? 'Set category pricing'
                    : dialog?.type === 'createCategoryPricing'
                      ? 'Create category pricing'
                      : dialog?.type === 'editCategoryPricing'
                        ? 'Update category pricing'
                        : dialog?.type === 'deleteCategoryPricing'
                          ? 'Delete category pricing'
                          : ''
        }
        description={
          dialog?.type?.startsWith('delete')
            ? 'Are you sure you want to delete?'
            : dialog?.type === 'createMapping'
              ? 'Select Brand → Model → Variant and map to a Category.'
              : null
        }
        submitLabel={dialog?.type?.startsWith('delete') ? 'Delete' : 'Apply'}
        showReason={false}
        requireReason={false}
        onClose={() => {
          setDialog(null)
          setFieldErrors({})
        }}
        fieldErrors={fieldErrors}
        fields={(() => {
          if (dialog?.type === 'viewBase') {
            return [
              { name: 'id', label: 'ID', type: 'text', defaultValue: dialog?.item?.id || '', disabled: true },
              ...(dialog?.kind === 'model'
                ? [
                    {
                      name: 'makeId',
                      label: 'Brand',
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
                      name: 'makeId',
                      label: 'Brand',
                      type: 'select',
                      defaultValue: modelById.get(dialog?.item?.modelId)?.makeId || '',
                      options: (vm.makes || []).map((m) => ({ value: m.id, label: m.name })),
                      disabled: true,
                    },
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
            if (dialog.kind === 'make') {
              return [
                { name: 'name', label: 'Brand name *', type: 'text', defaultValue: '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: '' },
              ]
            }
            if (dialog.kind === 'model') {
              return [
                {
                  name: 'brandId',
                  label: 'Brand *',
                  type: 'select',
                  defaultValue: modelsBrandId || '',
                  options: brands.map((b) => ({ value: b.id, label: b.name })),
                },
                { name: 'name', label: 'Model name *', type: 'text', defaultValue: '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: '' },
              ]
            }
            if (dialog.kind === 'categoryType') {
              return [
                { name: 'name', label: 'Category Type Name *', type: 'text', defaultValue: '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: '' },
              ]
            }
            if (dialog.kind === 'categoryValue') {
              return [
                {
                  name: 'category_type',
                  label: 'Category Type *',
                  type: 'select',
                  defaultValue: '',
                  options: categoryTypes.map((ct) => ({ value: ct.id, label: ct.name })),
                },
                { name: 'name', label: 'Category Value Name *', type: 'text', defaultValue: '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: '' },
              ]
            }
            if (dialog.kind === 'variant') {
              const defaultBrandId =
                variantsBrandId ||
                (variantsModelId ? models.find((m) => String(m.id) === String(variantsModelId))?.brand : null) ||
                brands?.[0]?.id ||
                ''
              const filteredModels = defaultBrandId
                ? models.filter((m) => String(m.brand) === String(defaultBrandId))
                : models
              const defaultModelId = variantsModelId || filteredModels?.[0]?.id || ''

              return [
                {
                  name: 'brandId',
                  label: 'Brand *',
                  type: 'select',
                  defaultValue: defaultBrandId,
                  options: brands.map((b) => ({ value: b.id, label: b.name })),
                  onChange: (nextBrandId, next) => {
                    const list = models.filter((m) => String(m.brand) === String(nextBrandId))
                    const nextModelId = list?.[0]?.id || ''
                    return { ...next, modelId: nextModelId }
                  },
                },
                {
                  name: 'modelId',
                  label: 'Model *',
                  type: 'select',
                  defaultValue: defaultModelId,
                  options: (form) => {
                    const bid = String(form.brandId || '').trim()
                    const list = bid ? models.filter((m) => String(m.brand) === bid) : models
                    return list.map((m) => ({ value: m.id, label: m.name }))
                  },
                },
                { name: 'name', label: 'Variant name *', type: 'text', defaultValue: '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: '' },
                { name: 'cc', label: 'Engine CC *', type: 'number', defaultValue: '' },
                { name: 'fuel_type', label: 'Fuel type', type: 'text', defaultValue: '' },
              ]
            }
          }

          if (dialog?.type === 'editBase') {
            if (dialog.kind === 'make') {
              return [
                { name: 'name', label: 'Brand name *', type: 'text', defaultValue: dialog?.item?.name || '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: dialog?.item?.description || '' },
              ]
            }
            if (dialog.kind === 'model') {
              return [
                {
                  name: 'brand',
                  label: 'Brand *',
                  type: 'select',
                  defaultValue: dialog?.item?.brand || brands?.[0]?.id || '',
                  options: brands.map((b) => ({ value: b.id, label: b.name })),
                },
                { name: 'name', label: 'Model name *', type: 'text', defaultValue: dialog?.item?.name || '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: dialog?.item?.description || '' },
              ]
            }
            if (dialog.kind === 'categoryType') {
              return [
                { name: 'name', label: 'Category Type Name *', type: 'text', defaultValue: dialog?.item?.name || '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: dialog?.item?.description || '' },
              ]
            }
            if (dialog.kind === 'categoryValue') {
              return [
                {
                  name: 'category_type',
                  label: 'Category Type *',
                  type: 'select',
                  defaultValue: dialog?.item?.category_type || '',
                  options: categoryTypes.map((ct) => ({ value: ct.id, label: ct.name })),
                },
                { name: 'name', label: 'Category Value Name *', type: 'text', defaultValue: dialog?.item?.name || '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: dialog?.item?.description || '' },
              ]
            }
            if (dialog.kind === 'variant') {
              const pickedModelId = dialog?.item?.model
              const pickedModel = pickedModelId ? models.find((m) => String(m.id) === String(pickedModelId)) : null
              const defaultBrandId = pickedModel?.brand || variantsBrandId || brands?.[0]?.id || ''
              const filteredModels = defaultBrandId
                ? models.filter((m) => String(m.brand) === String(defaultBrandId))
                : models

              return [
                {
                  name: 'brandId',
                  label: 'Brand *',
                  type: 'select',
                  defaultValue: defaultBrandId,
                  options: brands.map((b) => ({ value: b.id, label: b.name })),
                  onChange: (nextBrandId, next) => {
                    const list = models.filter((m) => String(m.brand) === String(nextBrandId))
                    const nextModelId = list?.[0]?.id || ''
                    return { ...next, modelId: nextModelId }
                  },
                },
                {
                  name: 'modelId',
                  label: 'Model *',
                  type: 'select',
                  defaultValue: dialog?.item?.model || variantsModelId || filteredModels?.[0]?.id || '',
                  options: (form) => {
                    const bid = String(form.brandId || '').trim()
                    const list = bid ? models.filter((m) => String(m.brand) === bid) : models
                    return list.map((m) => ({ value: m.id, label: m.name }))
                  },
                },
                { name: 'name', label: 'Variant name *', type: 'text', defaultValue: dialog?.item?.name || '' },
                { name: 'description', label: 'Description', type: 'text', defaultValue: dialog?.item?.description || '' },
                { name: 'cc', label: 'Engine CC *', type: 'number', defaultValue: dialog?.item?.engine_specs?.cc ?? '' },
                { name: 'fuel_type', label: 'Fuel type', type: 'text', defaultValue: dialog?.item?.engine_specs?.fuel_type ?? '' },
              ]
            }
          }

          if (dialog?.type === 'deleteBase') {
            return []
          }

          if (dialog?.type === 'viewMapping') {
            const it = viewMappingDetail?.data || viewMappingDetail || dialog?.item
            console.log('ViewMapping data available:', it)
            console.log('ViewMappingDetail state:', viewMappingDetail)
            return [
              {
                name: 'vehicleType',
                label: 'Vehicle Type',
                type: 'text',
                defaultValue: it?.vehicle_type_label || conditionLabel(it?.vehicle_type) || '',
                disabled: true,
              },
              {
                name: 'brandName',
                label: 'Brand',
                type: 'text',
                defaultValue: it?.brand_name || it?.brand_detail?.name || '',
                disabled: true,
              },
              {
                name: 'modelName',
                label: 'Model',
                type: 'text',
                defaultValue: it?.model_name || it?.model_detail?.name || '',
                disabled: true,
              },
              {
                name: 'variantName',
                label: 'Variant',
                type: 'text',
                defaultValue: it?.variant_name || it?.variant_detail?.name || '',
                disabled: true,
              },
              {
                name: 'categoryName',
                label: 'Category',
                type: 'text',
                defaultValue: it?.category_name || it?.category_detail?.name || '',
                disabled: true,
              },
              {
                name: 'categoryType',
                label: 'Category Type',
                type: 'text',
                defaultValue: it?.category_type_name || '',
                disabled: true,
              },
              {
                name: 'status',
                label: 'Status',
                type: 'text',
                defaultValue: it?.is_active ? 'Active' : 'Inactive',
                disabled: true,
              },
            ]
          }

          if (dialog?.type === 'setCategoryPricing') {
            const catId = dialog?.item?.id || ''
            const current = vm.pricingByCategoryId?.[catId] ?? null
            return [
              {
                name: 'priceInr',
                label: 'Category price (INR)',
                type: 'number',
                defaultValue: current ?? 500,
                placeholder: 'e.g. 650',
              },
            ]
          }

          if (dialog?.type === 'createCategoryPricing') {
            return [
              {
                name: 'category',
                label: 'Category *',
                type: 'select',
                defaultValue: '',
                options: categories.map((c) => ({ value: c.id, label: c.name })),
              },
              {
                name: 'vehicle_type',
                label: 'Vehicle type *',
                type: 'select',
                defaultValue: 'owned',
                options: [
                  { value: 'new', label: 'New' },
                  { value: 'owned', label: 'Owned' },
                ],
              },
              {
                name: 'price',
                label: 'Price *',
                type: 'number',
                defaultValue: '',
                placeholder: 'e.g. 999',
                min: 0,
                onChange: (value, form, setForm) => {
                  if (value < 0) {
                    setFieldErrors(prev => ({ ...prev, price: 'Price cannot be negative' }))
                    return { ...form, price: '' }
                  } else {
                    setFieldErrors(prev => ({ ...prev, price: undefined }))
                    return { ...form, price: value }
                  }
                },
              },
              {
                name: 'effective_from',
                label: 'Effective from *',
                type: 'date',
                defaultValue: '',
              },
              {
                name: 'effective_to',
                label: 'Effective to',
                type: 'date',
                defaultValue: '',
              },
            ]
          }

          if (dialog?.type === 'editCategoryPricing') {
            const it = dialog?.item
            return [
              {
                name: 'category',
                label: 'Category *',
                type: 'select',
                defaultValue: it?.category || '',
                options: categories.map((c) => ({ value: c.id, label: c.name })),
              },
              {
                name: 'vehicle_type',
                label: 'Vehicle type *',
                type: 'select',
                defaultValue: it?.vehicle_type || 'owned',
                options: [
                  { value: 'owned', label: 'Owned' },
                  { value: 'partner', label: 'Partner' },
                ],
              },
              {
                name: 'price',
                label: 'Price *',
                type: 'number',
                defaultValue: it?.price || '',
                placeholder: 'e.g. 999',
                min: 0,
                onChange: (value, form, setForm) => {
                  if (value < 0) {
                    setFieldErrors(prev => ({ ...prev, price: 'Price cannot be negative' }))
                    return { ...form, price: '' }
                  } else {
                    setFieldErrors(prev => ({ ...prev, price: undefined }))
                    return { ...form, price: value }
                  }
                },
              },
              {
                name: 'effective_from',
                label: 'Effective from *',
                type: 'date',
                defaultValue: it?.effective_from || '',
              },
              {
                name: 'effective_to',
                label: 'Effective to',
                type: 'date',
                defaultValue: it?.effective_to || '',
              },
            ]
          }

          if (dialog?.type === 'deleteCategoryPricing') {
            return []
          }

          if (dialog?.type === 'createMapping') {
            return [
              {
                name: 'condition',
                label: 'Vehicle Type',
                type: 'select',
                defaultValue: '',
                options: CONDITION_OPTIONS,
              },
              {
                name: 'makeId',
                label: 'Brand',
                type: 'select',
                defaultValue: '',
                options: brands.map((b) => ({ value: b.id, label: b.name })),
                onChange: (nextMakeId, next) => {
                  if (!nextMakeId) return { ...next, modelId: '', variantId: '' }
                  const modelsList = nextMakeId ? models.filter((m) => String(m.brand) === String(nextMakeId)) : models
                  const nextModelId = modelsList?.[0]?.id || ''
                  const variantsList = nextModelId ? variants.filter((v) => String(v.model) === String(nextModelId)) : variants
                  return {
                    ...next,
                    modelId: nextModelId,
                    variantId: variantsList?.[0]?.id || '',
                  }
                },
              },
              {
                name: 'modelId',
                label: 'Model',
                type: 'select',
                defaultValue: '',
                options: (form) => {
                  if (!form.makeId) return models.map((m) => ({ value: m.id, label: m.name }))
                  const list = models.filter((m) => String(m.brand) === String(form.makeId))
                  return list.map((m) => ({ value: m.id, label: m.name }))
                },
                onChange: (nextModelId, next) => {
                  if (!nextModelId) return { ...next, variantId: '' }
                  const model = models.find((m) => m.id === nextModelId)
                  const makeId = model?.brand || next.makeId
                  const variantsList = nextModelId ? variants.filter((v) => String(v.model) === String(nextModelId)) : variants
                  return { ...next, makeId, variantId: variantsList?.[0]?.id || '' }
                },
              },
              {
                name: 'variantId',
                label: 'Variant',
                type: 'select',
                defaultValue: '',
                options: (form) => {
                  if (!form.modelId) return variants.map((v) => ({ value: v.id, label: v.name }))
                  const list = variants.filter((v) => String(v.model) === String(form.modelId))
                  return list.map((v) => ({ value: v.id, label: v.name }))
                },
                onChange: (nextVariantId, next) => {
                  if (!nextVariantId) return next
                  const variant = variants.find((v) => v.id === nextVariantId)
                  const modelId = variant?.model || next.modelId
                  const model = models.find((m) => m.id === modelId)
                  const makeId = model?.brand || next.makeId
                  return { ...next, modelId, makeId }
                },
              },
              {
                name: 'categoryId',
                label: 'Category',
                type: 'select',
                defaultValue: '',
                options: categories.map((c) => ({ value: c.id, label: c.name })),
              },
            ]
          }

          if (dialog?.type === 'editMapping') {
            const it = dialog?.item
            const defaultMakeId = it?.makeId || brands?.[0]?.id || ''
            const defaultModelId = it?.modelId || (brands.find((b) => b.id === defaultMakeId) ? models.filter((m) => String(m.brand) === String(defaultMakeId))?.[0]?.id : '') || ''
            const defaultVariantId = it?.variantId || (models.find((m) => m.id === defaultModelId) ? variants.filter((v) => String(v.model) === String(defaultModelId))?.[0]?.id : '') || ''

            return [
              {
                name: 'condition',
                label: 'Vehicle Type',
                type: 'select',
                defaultValue: it?.condition || CONDITION_OPTIONS?.[0]?.value || 'new',
                options: CONDITION_OPTIONS,
              },
              {
                name: 'makeId',
                label: 'Brand',
                type: 'select',
                defaultValue: defaultMakeId,
                options: brands.map((b) => ({ value: b.id, label: b.name })),
                onChange: (nextMakeId, next) => {
                  const modelsList = nextMakeId ? models.filter((m) => String(m.brand) === String(nextMakeId)) : models
                  const nextModelId = modelsList?.[0]?.id || ''
                  const variantsList = nextModelId ? variants.filter((v) => String(v.model) === String(nextModelId)) : variants
                  return { ...next, modelId: nextModelId, variantId: variantsList?.[0]?.id || '' }
                },
              },
              {
                name: 'modelId',
                label: 'Model',
                type: 'select',
                defaultValue: defaultModelId,
                options: (form) => {
                  const list = form.makeId ? models.filter((m) => String(m.brand) === String(form.makeId)) : models
                  return list.map((m) => ({ value: m.id, label: m.name }))
                },
                onChange: (nextModelId, next) => {
                  const variantsList = nextModelId ? variants.filter((v) => String(v.model) === String(nextModelId)) : variants
                  return { ...next, variantId: variantsList?.[0]?.id || '' }
                },
              },
              {
                name: 'variantId',
                label: 'Variant',
                type: 'select',
                defaultValue: defaultVariantId,
                options: (form) => {
                  const list = form.modelId ? variants.filter((v) => String(v.model) === String(form.modelId)) : variants
                  return list.map((v) => ({ value: v.id, label: v.name }))
                },
              },
              {
                name: 'categoryId',
                label: 'Category',
                type: 'select',
                defaultValue: it?.categoryId || categories?.[0]?.id || '',
                options: categories.map((c) => ({ value: c.id, label: c.name })),
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

            setFieldErrors({})

            const requireFields = (fields) => {
              const errs = {}
              for (const key of fields || []) {
                const v = form ? form[key] : undefined
                if (!String(v ?? '').trim()) errs[key] = 'This Field is Required'
              }
              if (Object.keys(errs).length) {
                setFieldErrors(errs)
                return false
              }
              return true
            }

            if (dialog.type === 'viewBase' || dialog.type === 'viewMapping' || dialog.type === 'viewPricing' || dialog.type === 'viewCategoryPricing') {
              setDialog(null)
              return
            }

            if (!permissions.managePricing) throw new Error('Insufficient permission')

            if (dialog.type === 'createBase') {
              if (dialog.kind === 'make') {
                if (!requireFields(['name'])) return
                const res = await createBrand({
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'model') {
                if (!requireFields(['brandId', 'name'])) return
                const res = await createModel({
                  brand: Number(form.brandId),
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'categoryType') {
                if (!requireFields(['name'])) return
                
                const res = await createCategoryType({
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'categoryValue') {
                if (!requireFields(['category_type', 'name'])) return
                
                const res = await createCategoryValue({
                  category_type: Number(form.category_type),
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'variant') {
                if (!requireFields(['brandId', 'modelId', 'name', 'cc'])) return
                const cc = String(form.cc || '').trim()
                const fuelType = String(form.fuel_type || '').trim()
                
                const engine_specs = cc || fuelType ? { cc: cc ? Number(cc) : null, fuel_type: fuelType || null } : null

                const res = await createVariant({
                  model: Number(form.modelId),
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                  engine_specs,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              }
            }

            if (dialog.type === 'editBase') {
              if (dialog.kind === 'make') {
                if (!requireFields(['name'])) return
                const res = await updateBrand(dialog.item.id, {
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'model') {
                if (!requireFields(['brandId', 'name'])) return
                const res = await updateModel(dialog.item.id, {
                  brand: Number(form.brandId),
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'categoryType') {
                if (!requireFields(['name'])) return
                
                const res = await updateCategoryType(dialog.item.id, {
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'categoryValue') {
                if (!requireFields(['category_type', 'name'])) return
                
                const res = await updateCategoryValue(dialog.item.id, {
                  category_type: Number(form.category_type),
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'variant') {
                if (!requireFields(['brandId', 'modelId', 'name', 'cc'])) return
                const cc = String(form.cc || '').trim()
                const fuelType = String(form.fuel_type || '').trim()
                
                const engine_specs = cc || fuelType ? { cc: cc ? Number(cc) : null, fuel_type: fuelType || null } : null

                const res = await updateVariant(dialog.item.id, {
                  model: Number(form.modelId),
                  name: String(form.name || '').trim(),
                  description: String(form.description || '').trim() || null,
                  engine_specs,
                })
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              }
            }

            if (dialog.type === 'deleteBase') {
              if (dialog.kind === 'make') {
                const res = await deleteBrand(dialog.item.id)
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'model') {
                const res = await deleteModel(dialog.item.id)
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'categoryType') {
                const res = await deleteCategoryType(dialog.item.id)
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'categoryValue') {
                const res = await deleteCategoryValue(dialog.item.id)
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              } else if (dialog.kind === 'variant') {
                const res = await deleteVariant(dialog.item.id)
                showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              }
            }

            if (dialog.type === 'createMapping') {
              if (!requireFields(['condition', 'makeId', 'modelId', 'variantId', 'categoryId'])) return
              const payload = {
                vehicle_type: String(form.condition || '').trim(),
                brand: Number(form.makeId),
                model: Number(form.modelId),
                variant: Number(form.variantId),
                category: Number(form.categoryId),
              }
              console.log('Creating mapping with payload:', payload)
              console.log('Available categories:', categories.map(c => ({ id: c.id, name: c.name })))
              const res = await createVehicleCategoryMapping(payload)
              showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
            }

            if (dialog.type === 'editMapping') {
              if (!requireFields(['condition', 'makeId', 'modelId', 'variantId', 'categoryId'])) return
              const payload = {
                vehicle_type: String(form.condition || '').trim(),
                brand: Number(form.makeId),
                model: Number(form.modelId),
                variant: Number(form.variantId),
                category: Number(form.categoryId),
              }
              console.log('Updating mapping with payload:', payload)
              console.log('Available categories:', categories.map(c => ({ id: c.id, name: c.name })))
              const res = await updateVehicleCategoryMapping(dialog.item.id, payload)
              showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
            }

            if (dialog.type === 'deleteMapping') {
              const res = await deleteVehicleCategoryMapping(dialog.item.id)
              showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
            }

            if (dialog.type === 'setPricing') {
              if (!requireFields(['priceInr'])) return
              showSnack({ tone: 'error', title: 'Not Implemented', message: 'Pricing functionality not available' })
            }

            if (dialog.type === 'setCategoryPricing') {
              if (!requireFields(['priceInr'])) return
              showSnack({ tone: 'error', title: 'Not Implemented', message: 'Category pricing functionality not available' })
            }

            if (dialog.type === 'createCategoryPricing') {
              if (!requireFields(['category', 'vehicle_type', 'price', 'effective_from'])) return
              const payload = {
                category: Number(form.category),
                vehicle_type: String(form.vehicle_type || '').trim(),
                price: String(form.price || '').trim(),
                effective_from: String(form.effective_from || '').trim(),
                effective_to: String(form.effective_to || '').trim() || null,
              }
              const res = await createCategoryPricing(payload)
              showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              await refreshCategoryPricing()
            }

            if (dialog.type === 'editCategoryPricing') {
              if (!requireFields(['category', 'vehicle_type', 'price', 'effective_from'])) return
              const payload = {
                category: Number(form.category),
                vehicle_type: String(form.vehicle_type || '').trim(),
                price: String(form.price || '').trim(),
                effective_from: String(form.effective_from || '').trim(),
                effective_to: String(form.effective_to || '').trim() || null,
              }
              const res = await updateCategoryPricing(dialog.item.id, payload)
              showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              await refreshCategoryPricing()
            }

            if (dialog.type === 'deleteCategoryPricing') {
              const res = await deleteCategoryPricing(dialog.item.id)
              showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
              await refreshCategoryPricing()
            }

            setDialog(null)
            await refresh()
            await refreshCategoryTypes()
            await refreshCategoryValues()
            await refreshBrands()
            await refreshModels()
            await refreshVariants()
            await refreshCategories()
            await refreshMappings()
            setTableNonce((n) => n + 1)
          } catch (e) {
            const nextFieldErrors = extractFieldErrors(e)
            if (Object.keys(nextFieldErrors).length) {
              setFieldErrors(nextFieldErrors)
            }
            showSnack({ tone: 'error', title: 'Failed', message: errorToMessage(e) })
          }
        }}
      />

      <Snackbar
        open={!!snack.open}
        tone={snack.tone}
        title={snack.title}
        message={snack.message}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      />
    </div>
  )
}