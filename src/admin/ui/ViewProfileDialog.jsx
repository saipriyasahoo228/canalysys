import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card } from './Ui'
import { getInspectorProfile } from '../../api/inspectoronboard'

export function ViewProfileDialog({ open, inspector, onClose }) {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && inspector?.user_id) {
      setLoading(true)
      setError('')
      getInspectorProfile({ inspector_id: inspector.user_id })
        .then((profile) => {
          setProfileData(profile)
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err)
          setError('Failed to load profile details')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, inspector?.user_id])

  if (!open) return null

  const photo = profileData?.profile_photo || ''
  const showPhoto = /^data:image\//i.test(photo) || /^https?:\/\//i.test(photo)

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 flex max-h-[92vh] w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="relative shrink-0 border-b border-slate-200 px-4 py-3">
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
          <div className="text-sm font-semibold">View Profile</div>
          <div className="mt-1 text-xs text-slate-500">Complete inspector profile details</div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-slate-500">Loading profile...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-rose-600">{error}</div>
            </div>
          ) : profileData ? (
            <div className="space-y-3">
              {/* Profile Header */}
              <Card accent="cyan" className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {showPhoto ? (
                      <img 
                        src={photo} 
                        alt="Inspector" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600 bg-slate-100" style={{ display: showPhoto ? 'none' : 'flex' }}>
                      {(String(profileData.full_name || 'I').trim().slice(0, 1) || 'I').toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-slate-900">{profileData.full_name || '—'}</div>
                    <div className="mt-0.5 text-xs text-slate-500">ID: {profileData.inspector_id || '—'}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{profileData.email_id || '—'}</div>
                  </div>
                </div>
              </Card>

              {/* Profile Details */}
              <Card className="p-3">
                <div className="text-sm font-semibold text-slate-900 mb-2">Profile Information</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-slate-600">Inspector ID</div>
                    <div className="mt-1 text-sm text-slate-900">{profileData.inspector_id || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">Full Name</div>
                    <div className="mt-1 text-sm text-slate-900">{profileData.full_name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">Mobile Number</div>
                    <div className="mt-1 text-sm text-slate-900">{profileData.mobile_number || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">Email</div>
                    <div className="mt-1 text-sm text-slate-900">{profileData.email_id || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">Date of Joining</div>
                    <div className="mt-1 text-sm text-slate-900">{profileData.date_of_joining || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">Employment Type</div>
                    <div className="mt-1 text-sm text-slate-900 capitalize">{profileData.employment_type || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">Status</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        profileData.status === 'active' ? 'bg-green-100 text-green-800' :
                        profileData.status === 'inactive' ? 'bg-slate-100 text-slate-800' :
                        profileData.status === 'suspended' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {profileData.status || '—'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">Profile Photo</div>
                    <div className="mt-1 text-sm text-slate-900">
                      {profileData.profile_photo ? (
                        <a href={profileData.profile_photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          View Photo
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-slate-500">No profile data available</div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3">
          <div className="flex justify-end">
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
