import { useState, useMemo, useEffect } from 'react'
import {
  MapPin,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  ListPlus,
} from 'lucide-react'
import { Card, Button, Input, PaginatedTable, cx } from '../ui/Ui'
import { Snackbar } from '../ui/Snackbar'
import {
  listDistricts,
  createDistrict,
  patchDistrict,
  deleteDistrict as apiDeleteDistrict,
  listCities,
  createCities,
  patchCity,
  deleteCity as apiDeleteCity,
} from '../../api/city'

const INITIAL_DISTRICTS = []

const tabs = [
  { key: 'district', label: 'District' },
  { key: 'city', label: 'Cities' },
]

function TabButton({ active, children, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
        active
          ? 'border-amber-600/30 bg-amber-700 text-white'
          : 'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200'
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function CityConfigurationPage() {
  const [districts, setDistricts] = useState(INITIAL_DISTRICTS)
  const [activeTab, setActiveTab] = useState('district')
  const [loading, setLoading] = useState(false)

  // Inline form states
  const [addDistrictForm, setAddDistrictForm] = useState({ name: '', description: '' })
  const [addCityForm, setAddCityForm] = useState({ districtId: '', cities: [{ name: '', description: '' }] })

  // Modal states for editing
  const [districtModal, setDistrictModal] = useState({ open: false, editing: null })
  const [districtModalForm, setDistrictModalForm] = useState({ name: '', description: '' })
  const [cityModal, setCityModal] = useState({ open: false, editing: null })
  const [cityModalForm, setCityModalForm] = useState({ name: '', description: '' })
  const [viewDistrict, setViewDistrict] = useState(null)
  const [cities, setCities] = useState([])

  const [snack, setSnack] = useState({ open: false, tone: 'success', title: '', message: '' })

  const showSnack = (next) => {
    setSnack({ open: true, tone: next.tone || 'info', title: next.title || '', message: next.message || '' })
  }

  // ---- Fetch districts on mount ----
  const fetchDistricts = async () => {
    setLoading(true)
    try {
      const data = await listDistricts()
      const items = Array.isArray(data) ? data : data?.items || data?.results || []
      setDistricts(
        items.map((d) => ({
          id: d.id,
          name: d.name || '',
          description: d.description || '',
        }))
      )
    } catch (err) {
      showSnack({ tone: 'danger', title: 'Error', message: err?.detail || err?.message || 'Failed to load districts.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDistricts()
    fetchCities()
  }, [])

  // ---- Fetch cities ----
  const fetchCities = async () => {
    setLoading(true)
    try {
      const data = await listCities()
      const items = Array.isArray(data) ? data : data?.items || data?.results || []
      setCities(items)
    } catch (err) {
      showSnack({ tone: 'danger', title: 'Error', message: err?.detail || err?.message || 'Failed to load cities.' })
    } finally {
      setLoading(false)
    }
  }

  // ---- Inline Add District ----
  const saveDistrictInline = async (e) => {
    e.preventDefault()
    if (!addDistrictForm.name.trim()) {
      showSnack({ tone: 'danger', title: 'Validation Error', message: 'District name is required.' })
      return
    }
    try {
      const payload = {
        name: addDistrictForm.name.trim().toUpperCase(),
        description: (addDistrictForm.description || '').trim().toUpperCase(),
      }
      await createDistrict(payload)
      setAddDistrictForm({ name: '', description: '' })
      showSnack({ tone: 'success', title: 'Created', message: 'District created successfully.' })
      await fetchDistricts()
    } catch (err) {
      showSnack({ tone: 'danger', title: 'Error', message: err?.detail || err?.message || 'Failed to create district.' })
    }
  }

  // ---- Inline Add Cities ----
  const addCityField = () => {
    setAddCityForm((p) => ({ ...p, cities: [...p.cities, { name: '', description: '' }] }))
  }

  const removeCityField = (index) => {
    if (addCityForm.cities.length > 1) {
      setAddCityForm((p) => ({ ...p, cities: p.cities.filter((_, i) => i !== index) }))
    }
  }

  const updateCityName = (index, value) => {
    setAddCityForm((p) => ({ ...p, cities: p.cities.map((c, i) => (i === index ? { ...c, name: value } : c)) }))
  }

  const updateCityDescription = (index, value) => {
    setAddCityForm((p) => ({ ...p, cities: p.cities.map((c, i) => (i === index ? { ...c, description: value } : c)) }))
  }

  const saveCityInline = async (e) => {
    e.preventDefault()
    if (!addCityForm.districtId) {
      showSnack({ tone: 'danger', title: 'Validation Error', message: 'Please select a district.' })
      return
    }
    const validCities = addCityForm.cities
      .map((c) => ({ name: c.name.trim(), description: c.description.trim() }))
      .filter((c) => c.name.length > 0)
    if (validCities.length === 0) {
      showSnack({ tone: 'danger', title: 'Validation Error', message: 'Please enter at least one city name.' })
      return
    }

    try {
      const payload = {
        district: Number(addCityForm.districtId),
        cities: validCities.map((c) => ({
          name: c.name.toUpperCase(),
          description: c.description.toUpperCase(),
        })),
      }
      await createCities(payload)
      setAddCityForm({ districtId: '', cities: [{ name: '', description: '' }] })
      showSnack({
        tone: 'success',
        title: 'Created',
        message: `${validCities.length} city${validCities.length > 1 ? 'ies' : 'y'} added successfully.`,
      })
      await fetchCities()
    } catch (err) {
      showSnack({ tone: 'danger', title: 'Error', message: err?.detail || err?.message || 'Failed to create cities.' })
    }
  }

  // ---- District helpers (list + modal edit) ----
  const openEditDistrict = (district) => {
    setDistrictModalForm({ name: district.name, description: district.description || '' })
    setDistrictModal({ open: true, editing: district })
  }

  const saveDistrictModal = async (e) => {
    e.preventDefault()
    if (!districtModalForm.name.trim()) {
      showSnack({ tone: 'danger', title: 'Validation Error', message: 'District name is required.' })
      return
    }
    try {
      const payload = {
        name: districtModalForm.name.trim().toUpperCase(),
        description: (districtModalForm.description || '').trim().toUpperCase(),
      }
      await patchDistrict(districtModal.editing.id, payload)
      showSnack({ tone: 'success', title: 'Updated', message: 'District updated successfully.' })
      setDistrictModal({ open: false, editing: null })
      await fetchDistricts()
    } catch (err) {
      showSnack({ tone: 'danger', title: 'Error', message: err?.detail || err?.message || 'Failed to update district.' })
    }
  }

  const deleteDistrict = async (id) => {
    if (window.confirm('Are you sure you want to delete this district and all its cities?')) {
      try {
        await apiDeleteDistrict(id)
        showSnack({ tone: 'success', title: 'Deleted', message: 'District deleted successfully.' })
        await fetchDistricts()
      } catch (err) {
        showSnack({ tone: 'danger', title: 'Error', message: err?.detail || err?.message || 'Failed to delete district.' })
      }
    }
  }

  // ---- City helpers (list + modal edit) ----
  const openEditCity = (city) => {
    setCityModalForm({ name: city.cityName, description: city.description || '' })
    setCityModal({ open: true, editing: city })
  }

  const saveCityModal = async (e) => {
    e.preventDefault()
    if (!cityModalForm.name.trim()) {
      showSnack({ tone: 'danger', title: 'Validation Error', message: 'City name is required.' })
      return
    }
    try {
      const payload = {
        name: cityModalForm.name.trim().toUpperCase(),
        description: cityModalForm.description.trim().toUpperCase(),
      }
      await patchCity(cityModal.editing.id, payload)
      showSnack({ tone: 'success', title: 'Updated', message: 'City updated successfully.' })
      setCityModal({ open: false, editing: null })
      await fetchCities()
    } catch (err) {
      showSnack({ tone: 'danger', title: 'Error', message: err?.detail || err?.message || 'Failed to update city.' })
    }
  }

  const deleteCity = async (id) => {
    if (window.confirm('Are you sure you want to delete this city?')) {
      try {
        await apiDeleteCity(id)
        showSnack({ tone: 'success', title: 'Deleted', message: 'City deleted successfully.' })
        await fetchCities()
      } catch (err) {
        showSnack({ tone: 'danger', title: 'Error', message: err?.detail || err?.message || 'Failed to delete city.' })
      }
    }
  }

  // ---- Derived data ----
  const allCities = useMemo(() => {
    return cities.map((c) => ({
      id: c.id,
      cityName: c.name,
      districtName: districts.find((d) => d.id === c.district)?.name || 'Unknown',
      districtId: c.district,
      description: c.description || '',
    }))
  }, [cities, districts])

  return (
    <div className="space-y-3">
      {/* Main Card with Tabs */}
      <Card
        title="City Configuration"
        subtitle="Manage districts and cities for service coverage"
        accent="amber"
        right={
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((t) => (
              <TabButton key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </TabButton>
            ))}
          </div>
        }
      >
        {/* District Tab */}
        {activeTab === 'district' && (
          <div className="space-y-3">
            {/* Add District Form */}
            <Card
              title="Add District"
              subtitle="Create a new district"
              accent="slate"
              className="mb-3"
              right={
                <Button onClick={saveDistrictInline} disabled={loading}>
                  <ListPlus className="h-4 w-4" />
                  Add
                </Button>
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District Name *</label>
                  <Input
                    value={addDistrictForm.name}
                    onChange={(e) => setAddDistrictForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Enter district name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <Input
                    value={addDistrictForm.description}
                    onChange={(e) => setAddDistrictForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Enter description"
                  />
                </div>
              </div>
            </Card>

            {/* Districts Table */}
            <Card
              title="Districts"
              subtitle="Create and manage"
              accent="slate"
            >
              {districts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MapPin className="h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No districts found</h3>
                  <p className="text-sm text-slate-600 mt-1">Add a district to start managing cities.</p>
                </div>
              ) : (
                <PaginatedTable
                  columns={[
                    {
                      key: 'name',
                      header: 'Name',
                      cell: (r) => (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-amber-700 shrink-0" />
                            <span className="truncate text-sm font-semibold text-slate-900">{r.name}</span>
                          </div>
                          {r.description ? (
                            <div className="truncate text-[11px] text-slate-500">{r.description}</div>
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
                              onClick={() => setViewDistrict(r)}
                              title="View"
                            >
                              <Eye className="h-4 w-4 text-slate-700" />
                            </Button>
                            <Button
                              variant="icon"
                              size="icon"
                              onClick={() => openEditDistrict(r)}
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="icon"
                              size="icon"
                              onClick={() => deleteDistrict(r.id)}
                              title="Delete"
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
                  rows={districts}
                  rowKey={(r) => r.id}
                  enableSearch
                  searchPlaceholder="Search districts..."
                  getSearchText={(r) => r.name}
                  enableExport
                  exportBaseName="districts"
                  initialRowsPerPage={10}
                />
              )}
            </Card>
          </div>
        )}

        {/* Cities Tab */}
        {activeTab === 'city' && (
          <div className="space-y-3">
            {/* Add Cities Form */}
            <Card
              title="Add Cities"
              subtitle="Add multiple cities to a district"
              accent="slate"
              className="mb-3"
              right={
                <Button onClick={saveCityInline}>
                  <ListPlus className="h-4 w-4" />
                  Add
                </Button>
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District Name *</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm focus:border-amber-500/80 focus:ring-2 focus:ring-amber-200/70"
                    value={addCityForm.districtId}
                    onChange={(e) => setAddCityForm((p) => ({ ...p, districtId: e.target.value }))}
                  >
                    <option value="">Select a district</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {districts.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1">No districts available. Please add a district first.</p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cities *</label>
                  {addCityForm.cities.map((city, index) => (
                    <div key={index} className="space-y-2 rounded-lg border border-slate-200 p-3">
                      <div className="flex gap-2">
                        <Input
                          value={city.name}
                          onChange={(e) => updateCityName(index, e.target.value)}
                          placeholder={`City ${index + 1} Name`}
                          className="flex-1"
                        />
                        {addCityForm.cities.length > 1 && (
                          <Button
                            type="button"
                            variant="danger"
                            size="icon"
                            onClick={() => removeCityField(index)}
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={city.description}
                        onChange={(e) => updateCityDescription(index, e.target.value)}
                        placeholder={`City ${index + 1} Description`}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={addCityField}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Add More Cities
                  </Button>
                </div>
              </div>
            </Card>

            {/* Cities Table */}
            <Card
              title="Cities"
              subtitle="Create and manage"
              accent="slate"
            >
              {allCities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MapPin className="h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No cities found</h3>
                  <p className="text-sm text-slate-600 mt-1">Add cities to a district.</p>
                </div>
              ) : (
                <PaginatedTable
                  columns={[
                    {
                      key: 'cityName',
                      header: 'City',
                      cell: (r) => (
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{r.cityName}</div>
                          {r.description ? (
                            <div className="truncate text-[11px] text-slate-500">{r.description}</div>
                          ) : null}
                        </div>
                      ),
                    },
                    {
                      key: 'districtName',
                      header: 'District',
                      cell: (r) => <div className="text-sm text-slate-700">{r.districtName}</div>,
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
                              onClick={() => openEditCity(r)}
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="icon"
                              size="icon"
                              onClick={() => deleteCity(r.id)}
                              title="Delete"
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
                  rows={allCities}
                  rowKey={(r) => r.id}
                  enableSearch
                  searchPlaceholder="Search cities..."
                  getSearchText={(r) => `${r.cityName} ${r.districtName}`}
                  enableExport
                  exportBaseName="cities"
                  initialRowsPerPage={10}
                />
              )}
            </Card>
          </div>
        )}
      </Card>

      {/* District Edit Modal */}
      {districtModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit District</h2>
              <button
                onClick={() => setDistrictModal({ open: false, editing: null })}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={saveDistrictModal} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District Name *</label>
                <Input
                  value={districtModalForm.name}
                  onChange={(e) => setDistrictModalForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter district name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Input
                  value={districtModalForm.description}
                  onChange={(e) => setDistrictModalForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Enter description"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" className="flex-1">
                  Update District
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={() => setDistrictModal({ open: false, editing: null })}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* City Edit Modal */}
      {cityModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit City</h2>
              <button
                onClick={() => setCityModal({ open: false, editing: null })}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={saveCityModal} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City Name *</label>
                <Input
                  value={cityModalForm.name || ''}
                  onChange={(e) => setCityModalForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter city name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Input
                  value={cityModalForm.description || ''}
                  onChange={(e) => setCityModalForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Enter description"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" className="flex-1">
                  Update City
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={() => setCityModal({ open: false, editing: null })}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View District Modal */}
      {viewDistrict && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">District Details</h2>
              <button
                onClick={() => setViewDistrict(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{viewDistrict.name}</div>
                  {viewDistrict.description ? (
                    <div className="text-sm text-slate-500">{viewDistrict.description}</div>
                  ) : null}
                </div>
              </div>
              <div className="pt-2">
                <Button variant="default" className="w-full" onClick={() => setViewDistrict(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Snackbar
        open={snack.open}
        tone={snack.tone}
        title={snack.title}
        message={snack.message}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
      />
    </div>
  )
}
