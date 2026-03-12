import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, cx, Input, Select } from './Ui'
import { CustomDatePicker } from './CustomDatePicker'
import { createInspectorProfile, getInspectorProfile, updateInspectorProfile } from '../../api/inspectoronboard'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function InspectorProfileDialog({ open, inspector, onClose, onSave }) {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const initial = useMemo(() => {
    const it = inspector || {}
    const profile = profileData || {}
    return {
      id: it.user_id || '', // user_id becomes inspector_id
      name: profile.full_name || it.name || '',
      phone: profile.mobile_number || it.mobile_number || '',
      joinDate: profile.date_of_joining || '',
      employmentType: profile.employment_type || 'full_time',
      email: profile.email_id || it.email || '',
      status: profile.status || (it.is_active ? 'active' : 'inactive'),
      profilePhotoUrl: profile.profile_photo || '',
    }
  }, [inspector, profileData])

  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (open && inspector?.user_id) {
      setLoading(true)
      getInspectorProfile({ inspector_id: inspector.user_id })
        .then((profile) => {
          setProfileData(profile)
        })
        .catch(() => {
          // Profile not found, keep null
          setProfileData(null)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, inspector?.user_id])

  useEffect(() => {
    if (open) {
      setForm(initial)
      setSubmitting(false)
      setError('')
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [open, initial])

  if (!open) return null

  const photo = String(form.profilePhotoUrl || '').trim()
  const showPhoto = /^data:image\//i.test(photo) || /^https?:\/\//i.test(photo)
  
  // Debug logging
  console.log('Photo URL:', photo)
  console.log('Show photo:', showPhoto)
  console.log('Form data:', form)

  const canSave = !submitting

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={submitting ? undefined : onClose} />
      <div className="absolute left-1/2 top-1/2 flex max-h-[92vh] w-[92vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="relative shrink-0 border-b border-slate-200 px-4 py-3">
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
          <div className="text-sm font-semibold">Manage profile</div>
          <div className="mt-1 text-xs text-slate-500">Review profile details and update editable fields</div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-3">
            <Card accent="cyan" className="p-0 lg:col-span-1">
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {showPhoto ? (
                      <>
                        <img 
                          src={photo} 
                          alt="Inspector" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', photo)
                            e.target.style.display = 'none'
                            // Show fallback with URL for debugging
                            const fallback = e.target.nextSibling
                            fallback.style.display = 'flex'
                            fallback.innerHTML = `<span style="font-size: 8px;">IMG</span>`
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', photo)
                          }}
                        />
                        {/* Fallback always present but hidden when image loads */}
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600 bg-slate-100" style={{ display: 'none' }}>
                          {(String(form.name || 'I').trim().slice(0, 1) || 'I').toUpperCase()}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600 bg-slate-100">
                        {(String(form.name || 'I').trim().slice(0, 1) || 'I').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{form.name || '—'}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">{form.id || '—'}</div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Mobile number</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">{form.phone || '—'}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Date of joining</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">{form.joinDate || '—'}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Employment type</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">{form.employmentType || '—'}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-0 lg:col-span-2">
              <div className="border-b border-slate-200 px-3 py-2.5">
                <div className="text-sm font-semibold">Editable fields</div>
              </div>
              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                  {error}
                </div>
              ) : null}

              <div className="space-y-3 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Full name</div>
                    <div className="mt-1">
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        disabled={true}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Mobile number</div>
                    <div className="mt-1">
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                        disabled={true}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Date of joining</div>
                    <div className={cx('mt-1', submitting ? 'pointer-events-none opacity-60' : '')}>
                      <CustomDatePicker
                        value={form.joinDate}
                        onChange={(v) => setForm((s) => ({ ...s, joinDate: v }))}
                        disabled={false} // Enable date picker
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Employment type</div>
                    <div className="mt-1">
                      <Select
                        value={form.employmentType}
                        disabled={false} // Enable employment type dropdown
                        onChange={(e) => setForm((s) => ({ ...s, employmentType: e.target.value }))}
                      >
                        <option value="full_time">Full-time</option>
                        <option value="contract">Contract</option>
                        <option value="freelancer">Freelancer</option>
                      </Select>
                    </div>
                  </label>

                  <label className="block sm:col-span-2">
                    <div className="text-xs font-medium text-slate-900">Email</div>
                    <div className="mt-1">
                      <Input
                        value={form.email}
                        onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                        disabled={submitting}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Status</div>
                    <div className="mt-1">
                      <Select
                        value={form.status}
                        onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                        disabled={submitting}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="terminated">Terminated</option>
                      </Select>
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-900">Profile photo</div>
                    <div className="mt-1">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        disabled={submitting}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setSelectedFile(file)
                          try {
                            const url = await readFileAsDataUrl(file)
                            setForm((s) => ({ ...s, profilePhotoUrl: url }))
                          } catch {
                            setError('Failed to read selected photo. Please try again.')
                          }
                        }}
                      />
                    </div>
                  </label>
                </div>

                

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                  <Button
                    variant="ghost"
                    onClick={submitting ? undefined : onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!canSave}
                    onClick={async () => {
                      setError('')
                      setSubmitting(true)
                      try {
                        const payload = {
                          inspector_id: form.id, // user_id becomes inspector_id
                          date_of_joining: form.joinDate,
                          employment_type: form.employmentType,
                          status: form.status,
                        }
                        
                        let result
                        
                        if (profileData) {
                          // Update existing profile
                          if (selectedFile) {
                            // For updates with photo, use FormData
                            const formData = new FormData()
                            formData.append('inspector_id', form.id)
                            formData.append('date_of_joining', form.joinDate)
                            formData.append('employment_type', form.employmentType)
                            formData.append('status', form.status)
                            formData.append('profile_photo', selectedFile)
                            
                            result = await updateInspectorProfile({
                              inspector_id: form.id,
                              profile_photo: selectedFile,
                              date_of_joining: form.joinDate,
                              employment_type: form.employmentType,
                              status: form.status,
                            })
                          } else {
                            // Update without photo
                            result = await updateInspectorProfile({
                              inspector_id: form.id,
                              ...payload,
                            })
                          }
                        } else {
                          // Create new profile
                          if (selectedFile) {
                            // For creation with photo, use FormData
                            const formData = new FormData()
                            formData.append('inspector_id', form.id)
                            formData.append('date_of_joining', form.joinDate)
                            formData.append('employment_type', form.employmentType)
                            formData.append('status', form.status)
                            formData.append('profile_photo', selectedFile)
                            
                            result = await createInspectorProfile({
                              inspector_id: form.id,
                              profile_photo: selectedFile,
                              date_of_joining: form.joinDate,
                              employment_type: form.employmentType,
                              status: form.status,
                            })
                          } else {
                            // Create without photo
                            result = await createInspectorProfile(payload)
                          }
                        }
                        
                        await onSave(result)
                        onClose()
                      } catch (err) {
                        setError(err.message || 'Failed to save profile. Please try again.')
                      } finally {
                        setSubmitting(false)
                      }
                    }}
                  >
                    {submitting ? 'Saving...' : (profileData ? 'Update Profile' : 'Create Profile')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
