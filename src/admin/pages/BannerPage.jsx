import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, X, Upload, Image as ImageIcon } from 'lucide-react'
import { cx } from '../ui/Ui'
import { Snackbar } from '../ui/Snackbar'
import { formatDate } from '../utils/format'
import { 
  getBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner 
} from '../../api/banner'

export function BannerPage() {
  const [banners, setBanners] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [viewingBanner, setViewingBanner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState({ open: false, tone: 'success', title: '', message: '' })
  const [formData, setFormData] = useState({
    description: '',
    imageFile: null,
    imageUrl: ''
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const data = await getBanners()
      // Ensure we always set an array - API returns {count, items: [...]}
      const bannersArray = Array.isArray(data) ? data : (data.items || data.results || [])
      setBanners(bannersArray)
    } catch (error) {
      console.error('Error fetching banners:', error)
      setBanners([]) // Set empty array on error
      setSnack({
        open: true,
        tone: 'danger',
        title: 'Error',
        message: 'Failed to load banners'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const formDataToSend = new FormData()
      
      // Only append banner if a new file is selected
      if (formData.imageFile) {
        formDataToSend.append('banner', formData.imageFile)
      }
      
      // Always append description (can be empty)
      if (formData.description !== undefined) {
        formDataToSend.append('description', formData.description)
      }
      
      if (editingBanner) {
        // Use PATCH for updates to avoid requiring file
        await updateBanner(editingBanner.id, formDataToSend)
        setSnack({
          open: true,
          tone: 'success',
          title: 'Success',
          message: 'Banner updated successfully'
        })
      } else {
        // Use POST for creation (requires file)
        if (!formData.imageFile) {
          setSnack({
            open: true,
            tone: 'danger',
            title: 'Error',
            message: 'Please select an image file for new banner'
          })
          return
        }
        await createBanner(formDataToSend)
        setSnack({
          open: true,
          tone: 'success',
          title: 'Success',
          message: 'Banner created successfully'
        })
      }
      
      await fetchBanners()
      resetForm()
    } catch (error) {
      console.error('Submit error:', error)
      setSnack({
        open: true,
        tone: 'danger',
        title: 'Error',
        message: error.message || 'Failed to save banner'
      })
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      description: banner.description || '',
      imageFile: null,
      imageUrl: banner.banner || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await deleteBanner(id)
        setSnack({
          open: true,
          tone: 'success',
          title: 'Success',
          message: 'Banner deleted successfully'
        })
        await fetchBanners()
      } catch (error) {
        setSnack({
          open: true,
          tone: 'danger',
          title: 'Error',
          message: error.message || 'Failed to delete banner'
        })
      }
    }
  }

  const handleView = (banner) => {
    setViewingBanner(banner)
  }

  const resetForm = () => {
    setFormData({
      description: '',
      imageFile: null,
      imageUrl: ''
    })
    setEditingBanner(null)
    setShowModal(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Create preview URL for the selected image
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imageUrl: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600">Create, update, and manage your website banners</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-950 text-amber-50 rounded-lg hover:bg-amber-900 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-950 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
          <p className="text-gray-600 mb-6">Create your first banner to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-950 text-amber-50 rounded-lg hover:bg-amber-900 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {banner.banner ? (
                  <img 
                    src={banner.banner} 
                    alt={banner.description || 'Banner'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="p-5">
                <h3 className="font-semibold text-lg text-gray-900 mb-4 truncate">
                  {banner.description || `Banner ${banner.id}`}
                </h3>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(banner)}
                    className="flex-1 flex items-center justify-center px-3 py-2.5 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="View Banner"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 flex items-center justify-center px-3 py-2.5 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Edit Banner"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Delete Banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Banner Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter banner description..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Banner Image
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      name="imageFile"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-950 hover:file:bg-amber-100"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Upload className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Select an image file from your device (JPG, PNG, GIF, WebP)</p>
                </div>
              </div>
              
              {formData.imageUrl && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Image Preview
                  </label>
                  <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                    <img 
                      src={formData.imageUrl} 
                      alt="Banner preview"
                      className="w-full h-64 object-cover"
                    />
                    {formData.imageFile && (
                      <div className="absolute top-2 right-2 bg-amber-950 text-amber-50 px-2 py-1 rounded-lg text-xs font-medium">
                        New Image
                      </div>
                    )}
                  </div>
                  {formData.imageFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected file: <span className="font-medium">{formData.imageFile.name}</span>
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-amber-950 text-amber-50 rounded-xl hover:bg-amber-900 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingBanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Banner Details</h2>
              <button
                onClick={() => setViewingBanner(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                    {viewingBanner.banner ? (
                      <img 
                        src={viewingBanner.banner} 
                        alt={viewingBanner.description || 'Banner'}
                        className="w-full h-96 object-cover"
                      />
                    ) : (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <ImageIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg text-gray-500 font-medium">No image available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {viewingBanner.description || `Banner ${viewingBanner.id}`}
                  </h3>
                  {viewingBanner.created_at && (
                    <p className="text-sm text-gray-500">
                      Created: {formatDate(viewingBanner.created_at)}
                    </p>
                  )}
                </div>
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
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
      />
    </div>
  )
}
