import { useMemo, useState, useEffect } from 'react'
import { ListChecks, Plus, Trash2, Pencil, FileText, Eye, User, Calendar, CheckCircle, Image } from 'lucide-react'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { Snackbar } from '../ui/Snackbar'
import { listTemplates, createTemplate, updateTemplate, deleteTemplate, getTemplate, patchTemplate, patchSection, patchQuestion, createSection, createQuestion } from '../../api/template'
import { listVariants } from '../../api/vehiclemaster'

const CONDITION_TABS = [
  { key: 'pre_owned', label: 'Pre-Owned' },
  { key: 'new', label: 'New' },
]

function inputTypeLabel(t) {
  if (t === 'single_choice') return 'Single Choice'
  if (t === 'multi_choice') return 'Multi Choice'
  if (t === 'yes_no') return 'Yes/No'
  if (t === 'short_text') return 'Short Text'
  if (t === 'long_text') return 'Long Text'
  if (t === 'number') return 'Number'
  if (t === 'date') return 'Date'
  return t || '—'
}

function inputTypeTone(t) {
  if (t === 'yes_no') return 'emerald'
  if (t === 'single_choice') return 'cyan'
  if (t === 'multi_choice') return 'violet'
  if (t === 'short_text') return 'slate'
  if (t === 'long_text') return 'slate'
  if (t === 'number') return 'amber'
  if (t === 'date') return 'rose'
  return 'slate'
}

export function ChecklistBuilderPage() {
  const { actor, permissions } = useRbac()
  const canEdit = !!permissions?.manageInspectors

  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [dialog, setDialog] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [backendErrors, setBackendErrors] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, tone: 'error', title: '', message: '' })
  const [fuelTypes, setFuelTypes] = useState([])
  const [loadingFuelTypes, setLoadingFuelTypes] = useState(false)
  const [viewTemplateDialog, setViewTemplateDialog] = useState(null)
  const [viewTemplateData, setViewTemplateData] = useState(null)
  const [loadingViewTemplate, setLoadingViewTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const [templatesData, setTemplatesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listTemplates()
      setTemplatesData(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = fetchTemplates

  useEffect(() => {
    fetchTemplates()
  }, [])

  const templates = templatesData?.items || []
  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null
    return templates.find(t => t.id === selectedTemplateId) || null
  }, [selectedTemplateId, templates])

  const sections = (selectedTemplate?.sections || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))

  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections])

  const selectedSection = useMemo(() => {
    const id = dialog?.sectionId || selectedSectionId
    if (!id) return null
    return sectionById.get(id) || null
  }, [dialog?.sectionId, sectionById, selectedSectionId])

  // Helper function to format backend errors
  const formatBackendErrors = (errors) => {
    if (typeof errors === 'string') return errors
    if (typeof errors === 'object' && errors !== null) {
      const errorMessages = []
      
      // Handle nested structure with sections and questions
      if (errors.sections && Array.isArray(errors.sections)) {
        errors.sections.forEach((section, sectionIndex) => {
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question, questionIndex) => {
              if (typeof question === 'object' && question !== null) {
                for (const [field, messages] of Object.entries(question)) {
                  if (Array.isArray(messages)) {
                    errorMessages.push(`${field}: ${messages.join(', ')}`)
                  } else {
                    errorMessages.push(`${field}: ${messages}`)
                  }
                }
              }
            })
          }
        })
      }
      
      // Handle flat structure (fallback)
      for (const [field, messages] of Object.entries(errors)) {
        if (field === 'sections') continue // Skip sections as handled above
        
        if (Array.isArray(messages)) {
          errorMessages.push(`${field}: ${messages.join(', ')}`)
        } else {
          errorMessages.push(`${field}: ${messages}`)
        }
      }
      
      return errorMessages.length > 0 ? errorMessages.join('\n') : 'Validation failed'
    }
    return 'An unknown error occurred'
  }

  // Helper function to show snackbar
  const showSnackbar = (tone, title, message) => {
    setSnackbar({ open: true, tone, title, message })
  }

  // Function to fetch template data for viewing
  const fetchViewTemplate = async (templateId) => {
    try {
      setLoadingViewTemplate(true)
      const templateData = await getTemplate(templateId)
      setViewTemplateData(templateData)
      setViewTemplateDialog({ templateId })
    } catch (error) {
      showSnackbar('error', 'Error', 'Failed to load template details')
    } finally {
      setLoadingViewTemplate(false)
    }
  }

  // Fetch fuel types from variants API
  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        setLoadingFuelTypes(true)
        const response = await listVariants({ page: 1 })
        const variants = response.items || []
        
        // Extract unique fuel types from variants and convert to uppercase
        const uniqueFuelTypes = [...new Set(variants
          .map(variant => variant.fuel_type)
          .filter(fuelType => fuelType && fuelType.trim() !== '')
        )].map(fuelType => fuelType.toUpperCase()).sort()
        
        setFuelTypes(uniqueFuelTypes)
      } catch (error) {
        console.error('Failed to fetch fuel types:', error)
      } finally {
        setLoadingFuelTypes(false)
      }
    }

    fetchFuelTypes()
  }, [])

  const templateColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Template Name',
        exportValue: (r) => r.name,
        cell: (r) => (
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{r.name}</div>
            {r.is_active && <Badge tone="emerald">Active</Badge>}
          </div>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        exportValue: (r) => r.description,
        cell: (r) => <div className="text-sm text-slate-700">{r.description || '—'}</div>,
      },
      {
        key: 'sections',
        header: 'Sections',
        exportValue: (r) => (r.sections || []).length,
        cell: (r) => <div className="text-xs text-slate-600">{(r.sections || []).length} sections</div>,
      },
      {
        key: 'created_at',
        header: 'Created',
        exportValue: (r) => r.created_at,
        cell: (r) => <div className="text-xs text-slate-600">{new Date(r.created_at).toLocaleDateString()}</div>,
      },
      {
        key: 'actions',
        header: <div className="w-full text-right">Actions</div>,
        cell: (r) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              className="h-8"
              title="View sections"
              onClick={() => setSelectedTemplateId(r.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="ghost"
              className="h-8"
              title="View template details"
              onClick={() => fetchViewTemplate(r.id)}
              disabled={loadingViewTemplate}
            >
              <FileText className="h-4 w-4 mr-1" />
              Template
            </Button>
            <Button
              variant="icon"
              size="icon"
              title="Edit template"
              onClick={async () => {
                try {
                  const templateData = await getTemplate(r.id)
                  setEditingTemplate(templateData)
                  setDialog({ type: 'editTemplate', templateId: r.id })
                } catch (error) {
                  showSnackbar('error', 'Error', 'Failed to load template for editing')
                }
              }}
              disabled={!canEdit}
            >
              <Pencil className="h-4 w-4 text-slate-700" />
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [canEdit]
  )

  const sectionColumns = useMemo(
    () => [
      {
        key: 'order',
        header: '#',
        exportValue: (r) => r.order,
        cell: (r) => <div className="text-xs font-semibold text-slate-700">{r.order ?? '—'}</div>,
      },
      {
        key: 'title',
        header: 'Section',
        exportValue: (r) => r.title,
        cell: (r) => <div className="text-sm font-semibold text-slate-900">{r.title}</div>,
      },
      {
        key: 'questions',
        header: 'Questions',
        exportValue: (r) => (r.questions || []).length,
        cell: (r) => <div className="text-xs text-slate-600">{(r.questions || []).length} questions</div>,
      },
      {
        key: 'description',
        header: 'Description',
        exportValue: (r) => r.description,
        cell: (r) => <div className="text-xs text-slate-700">{r.description || '—'}</div>,
      },
      {
        key: 'actions',
        header: <div className="w-full text-right">Actions</div>,
        cell: (r) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              className="h-8"
              title="View questions"
              onClick={() => setSelectedSectionId(r.id)}
            >
              View Questions
            </Button>
            <Button
              variant="icon"
              size="icon"
              title="Edit section"
              onClick={() => setDialog({ type: 'editSection', sectionId: r.id })}
              disabled={!canEdit}
            >
              <Pencil className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              title="Add question"
              onClick={() => {
                setSelectedSectionId(r.id)
                setDialog({ type: 'createQuestion', sectionId: r.id })
              }}
              disabled={!canEdit}
            >
              <Plus className="h-4 w-4" />
              Question
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [canEdit]
  )

  const questionRows = selectedSection?.questions || []

  const questionColumns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Question',
        exportValue: (r) => r.title,
        cell: (r) => <div className="text-sm font-semibold text-slate-900">{r.title}</div>,
      },
      {
        key: 'answer_type',
        header: 'Type',
        exportValue: (r) => r.answer_type,
        cell: (r) => <Badge tone={inputTypeTone(r.answer_type)}>{inputTypeLabel(r.answer_type)}</Badge>,
      },
      {
        key: 'is_required',
        header: 'Required',
        exportValue: (r) => (r.is_required ? 'Yes' : 'No'),
        cell: (r) => <div className="text-xs text-slate-700">{r.is_required ? 'Yes' : 'No'}</div>,
      },
      {
        key: 'options',
        header: 'Options',
        exportValue: (r) => (r.options || []).map(o => o.label).join(', '),
        cell: (r) => {
          const opts = r.options || []
          if (!opts.length) return <div className="text-xs text-slate-500">—</div>
          return <div className="max-w-[420px] whitespace-normal text-xs text-slate-700">{opts.map(o => o.label).join(', ')}</div>
        },
      },
      {
        key: 'images',
        header: 'Images',
        exportValue: (r) => `${r.expected_images_min || 0}-${r.expected_images_max || 0}`,
        cell: (r) => (
          <div className="text-xs text-slate-700">
            {r.expected_images_min || 0} - {r.expected_images_max || 0}
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
              title="Edit question"
              onClick={() => setDialog({ type: 'editQuestion', sectionId: selectedSection?.id, questionId: r.id })}
              disabled={!canEdit}
            >
              <Pencil className="h-4 w-4 text-slate-700" />
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [canEdit, selectedSection?.id]
  )

  const templateDialogOpen = dialog?.type === 'createTemplate' || dialog?.type === 'editTemplate'
  const sectionDialogOpen = dialog?.type === 'createSection' || dialog?.type === 'editSection'
  const questionDialogOpen = dialog?.type === 'createQuestion' || dialog?.type === 'editQuestion'

  return (
    <div className="space-y-6">
      <Card
        title="Inspection Template Management"
        subtitle="Create and manage inspection templates used by inspectors"
        accent="cyan"
        right={
          <div className="flex items-center gap-2">
            <Button onClick={() => refresh()} variant="ghost">
              Refresh
            </Button>
            <Button onClick={() => setDialog({ type: 'createTemplate' })} disabled={!canEdit}>
              <Plus className="h-4 w-4" />
              Template
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <FileText className="h-4 w-4 text-cyan-700" />
            {canEdit ? 'You can edit templates.' : 'View only (insufficient permission).'}
          </div>
          <div className="text-xs text-slate-500">{loading && !templatesData ? 'Loading…' : `${templates.length} templates`}</div>
        </div>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load templates.</div>
        ) : null}

        <PaginatedTable
          columns={templateColumns}
          rows={templates}
          rowKey={(r) => r.id}
          initialRowsPerPage={10}
          rowsPerPageOptions={[10, 20, 50, 'all']}
          enableSearch
          searchPlaceholder="Search templates…"
          enableExport
          exportFilename="inspection-templates.csv"
        />

        {selectedTemplate ? (
          <div className="mt-6">
            <div className="mb-4">
              <div className="text-lg font-semibold text-slate-900">Template: {selectedTemplate.name}</div>
              <div className="text-sm text-slate-600">{selectedTemplate.description}</div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-slate-900">Sections</div>
                <Button
                  onClick={() => setDialog({ type: 'createSection', templateId: selectedTemplate.id })}
                  disabled={!canEdit}
                >
                  <Plus className="h-4 w-4" />
                  Section
                </Button>
              </div>
              <PaginatedTable
                columns={sectionColumns}
                rows={sections}
                rowKey={(r) => r.id}
                initialRowsPerPage={10}
                rowsPerPageOptions={[10, 20, 50, 'all']}
                enableSearch
                searchPlaceholder="Search sections…"
                enableExport
                exportFilename={`${selectedTemplate.name}-sections.csv`}
              />
            </div>

            {selectedSection ? (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-900">Questions: {selectedSection.title}</div>
                  <Button
                    onClick={() => setDialog({ type: 'createQuestion', sectionId: selectedSection.id })}
                    disabled={!canEdit}
                  >
                    <Plus className="h-4 w-4" />
                    Question
                  </Button>
                </div>
                <PaginatedTable
                  columns={questionColumns}
                  rows={questionRows}
                  rowKey={(r) => r.id}
                  initialRowsPerPage={10}
                  rowsPerPageOptions={[10, 20, 50, 'all']}
                  enableSearch
                  searchPlaceholder="Search questions…"
                  enableExport
                  exportFilename={`${selectedTemplate.name}-${selectedSection.title}-questions.csv`}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Template Management Dialog */}
      <ReasonDialog
        open={templateDialogOpen}
        title={
          dialog?.type === 'createTemplate'
            ? 'Create Template'
            : 'Edit Template'
        }
        description="Templates define the structure of inspection forms used by inspectors."
        submitLabel="Save"
        onClose={() => {
          setDialog(null)
          setBackendErrors(null)
          setEditingTemplate(null)
        }}
        showReason={false}
        requireReason={false}
        fields={[
          {
            name: 'name',
            label: 'Template Name',
            type: 'text',
            defaultValue: dialog?.type === 'editTemplate' ? editingTemplate?.name || '' : '',
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 3,
            defaultValue: dialog?.type === 'editTemplate' ? editingTemplate?.description || '' : '',
          },
          {
            name: 'vehicle_type',
            label: 'Vehicle Type',
            type: 'select',
            defaultValue: dialog?.type === 'editTemplate' ? editingTemplate?.vehicle_type || '' : '',
            options: [
              { value: 'owned', label: 'Owned' },
              { value: 'new', label: 'New' },
            ],
          },
          {
            name: 'fuel_type',
            label: 'Fuel Type',
            type: 'select',
            defaultValue: dialog?.type === 'editTemplate' ? 
              (fuelTypes.find(fuelType => fuelType === editingTemplate?.fuel_type?.toUpperCase()) || '') : '',
            options: fuelTypes.map(fuelType => ({ value: fuelType, label: fuelType })),
            placeholder: loadingFuelTypes ? 'Loading fuel types...' : 'Select fuel type',
          },
          {
            name: 'is_active',
            label: 'Active Template',
            type: 'checkbox',
            defaultValue: dialog?.type === 'editTemplate' ? editingTemplate?.is_active || false : false,
            checkboxLabel: 'Make this the active template (only one can be active)',
          },
        ]}
        onSubmit={async (form) => {
          if (!canEdit) throw new Error('Insufficient permission')

          try {
            setBackendErrors(null)

            const templateData = {
              name: form.name,
              description: form.description,
              vehicle_type: form.vehicle_type?.toLowerCase(),
              fuel_type: form.fuel_type,
              is_active: form.is_active
            }

            if (dialog?.type === 'createTemplate') {
              await createTemplate(templateData)
            } else {
              // Use PATCH for metadata-only updates
              await patchTemplate(dialog.templateId, templateData)
            }

            setDialog(null)
            setEditingTemplate(null)
            await refresh()
          } catch (error) {
            if (error.response?.data) {
              setBackendErrors(error.response.data)
              showSnackbar('error', 'Validation Error', formatBackendErrors(error.response.data))
            } else {
              setBackendErrors({ detail: error.message })
              showSnackbar('error', 'Error', error.message)
            }
            throw error // Re-throw to prevent dialog from closing
          }
        }}
        errorMessage={backendErrors ? formatBackendErrors(backendErrors) : undefined}
      />

      <ReasonDialog
        open={sectionDialogOpen}
        title={
          dialog?.type === 'createSection'
            ? 'Add Section'
            : 'Edit Section'
        }
        description="Sections group related questions in the inspection template."
        submitLabel="Save"
        onClose={() => {
          setDialog(null)
          setBackendErrors(null)
        }}
        showReason={false}
        requireReason={false}
        fields={[
          {
            name: 'title',
            label: 'Section Title',
            type: 'text',
            defaultValue: dialog?.type === 'editSection' ? selectedSection?.title || '' : '',
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 2,
            defaultValue: dialog?.type === 'editSection' ? selectedSection?.description || '' : '',
          },
          {
            name: 'order',
            label: 'Order',
            type: 'number',
            defaultValue: dialog?.type === 'editSection' ? selectedSection?.order || 1 : sections.length + 1,
          },
        ]}
        onSubmit={async (form) => {
          if (!canEdit) throw new Error('Insufficient permission')

          try {
            setBackendErrors(null)

            const sectionData = {
              title: form.title,
              description: form.description,
              order: Number(form.order || 1)
            }

            if (dialog?.type === 'createSection') {
              // Use the new POST API to create section under template
              await createSection(dialog.templateId, sectionData)
            } else {
              // Use PATCH for editing existing sections
              await patchSection(dialog.sectionId, sectionData)
            }

            setDialog(null)
            await refresh()
          } catch (error) {
            if (error.response?.data) {
              setBackendErrors(error.response.data)
              showSnackbar('error', 'Validation Error', formatBackendErrors(error.response.data))
            } else {
              setBackendErrors({ detail: error.message })
              showSnackbar('error', 'Error', error.message)
            }
            throw error // Re-throw to prevent dialog from closing
          }
        }}
        errorMessage={backendErrors ? formatBackendErrors(backendErrors) : undefined}
      />

      <ReasonDialog
        open={questionDialogOpen}
        title={
          dialog?.type === 'createQuestion'
            ? 'Add Question'
            : 'Edit Question'
        }
        description="Questions define what the inspector must fill during inspection."
        submitLabel="Save"
        onClose={() => {
          setDialog(null)
          setBackendErrors(null)
        }}
        showReason={false}
        requireReason={false}
        fields={[
          {
            name: 'title',
            label: 'Question Title',
            type: 'text',
            defaultValue: dialog?.type === 'editQuestion' ? selectedSection?.questions?.find(q => q.id === dialog.questionId)?.title || '' : '',
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 2,
            defaultValue: dialog?.type === 'editQuestion' ? selectedSection?.questions?.find(q => q.id === dialog.questionId)?.description || '' : '',
          },
          {
            name: 'answer_type',
            label: 'Answer Type',
            type: 'select',
            defaultValue: dialog?.type === 'editQuestion' ? selectedSection?.questions?.find(q => q.id === dialog.questionId)?.answer_type || 'single_choice' : 'single_choice',
            options: [
              { value: 'yes_no', label: 'Yes/No' },
              { value: 'short_text', label: 'Short Text' },
              { value: 'long_text', label: 'Long Text' },
              { value: 'number', label: 'Number' },
              { value: 'date', label: 'Date' },
              { value: 'single_choice', label: 'Single Choice' },
              { value: 'multi_choice', label: 'Multi Choice' },
            ],
          },
          {
            name: 'options',
            label: 'Options (comma " , " separated)',
            type: 'text',
            defaultValue: dialog?.type === 'editQuestion' ? selectedSection?.questions?.find(q => q.id === dialog.questionId)?.options?.map(o => o.label).join(', ') || '' : '',
            placeholder: 'e.g. Excellent, Good, Average, Poor',
            condition: (form) => form.answer_type === 'single_choice' || form.answer_type === 'multi_choice',
          },
          {
            name: 'is_required',
            label: 'Required',
            type: 'checkbox',
            defaultValue: dialog?.type === 'editQuestion' ? selectedSection?.questions?.find(q => q.id === dialog.questionId)?.is_required || false : true,
            checkboxLabel: 'This question must be answered',
          },
          {
            name: 'expected_images_min',
            label: 'Min Images',
            type: 'number',
            defaultValue: dialog?.type === 'editQuestion' ? selectedSection?.questions?.find(q => q.id === dialog.questionId)?.expected_images_min || 0 : 0,
            placeholder: '0',
          },
          {
            name: 'expected_images_max',
            label: 'Max Images',
            type: 'number',
            defaultValue: dialog?.type === 'editQuestion' ? selectedSection?.questions?.find(q => q.id === dialog.questionId)?.expected_images_max || 5 : 5,
            placeholder: '5',
          },
          {
            name: 'order',
            label: 'Order',
            type: 'number',
            defaultValue: dialog?.type === 'editQuestion' ? selectedSection?.questions?.find(q => q.id === dialog.questionId)?.order || 1 : (selectedSection?.questions?.length || 0) + 1,
          },
        ]}
        onSubmit={async (form) => {
          if (!canEdit) throw new Error('Insufficient permission')

          try {
            setBackendErrors(null)

            const questionData = {
              title: form.title,
              description: form.description,
              answer_type: form.answer_type,
              is_required: form.is_required,
              expected_images_min: Number(form.expected_images_min || 0),
              expected_images_max: Number(form.expected_images_max || 5),
              order: Number(form.order || 1),
              options: []
            }

            // Parse options for choice questions
            if (form.answer_type === 'single_choice' || form.answer_type === 'multi_choice') {
              if (form.options && form.options.trim()) {
                const optionLabels = form.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0)
                questionData.options = optionLabels.map((label, index) => ({
                  label: label,
                  value: label.toLowerCase().replace(/\s+/g, '_'),
                  order: index + 1
                }))
              } else {
                throw new Error('Options are required for single choice and multi choice questions')
              }
            }

            if (dialog?.type === 'createQuestion') {
              // Use the new POST API to create question under section
              await createQuestion(dialog.sectionId, questionData)
            } else {
              // Use PATCH for editing existing questions
              await patchQuestion(dialog.questionId, questionData)
            }

            setDialog(null)
            await refresh()
          } catch (error) {
            if (error.response?.data) {
              setBackendErrors(error.response.data)
              showSnackbar('error', 'Validation Error', formatBackendErrors(error.response.data))
            } else {
              setBackendErrors({ detail: error.message })
              showSnackbar('error', 'Error', error.message)
            }
            throw error // Re-throw to prevent dialog from closing
          }
        }}
        errorMessage={backendErrors ? formatBackendErrors(backendErrors) : undefined}
      />

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700"
                onClick={async () => {
                  try {
                    if (!canEdit) throw new Error('Insufficient permission')

                    if (confirmDialog.type === 'deleteTemplate') {
                      await deleteTemplate(confirmDialog.templateId)
                      setConfirmDialog(null)
                      if (selectedTemplateId === confirmDialog.templateId) setSelectedTemplateId('')
                      await refresh()
                    } else if (confirmDialog.type === 'deleteSection') {
                      const updatedSections = selectedTemplate.sections.filter(s => s.id !== confirmDialog.sectionId)
                      await updateTemplate(selectedTemplate.id, { ...selectedTemplate, sections: updatedSections })
                      setConfirmDialog(null)
                      if (selectedSectionId === confirmDialog.sectionId) setSelectedSectionId('')
                      await refresh()
                    } else if (confirmDialog.type === 'deleteQuestion') {
                      const updatedQuestions = selectedSection.questions.filter(q => q.id !== confirmDialog.questionId)
                      const updatedSections = selectedTemplate.sections.map(s => 
                        s.id === confirmDialog.sectionId ? { ...s, questions: updatedQuestions } : s
                      )
                      await updateTemplate(selectedTemplate.id, { ...selectedTemplate, sections: updatedSections })
                      setConfirmDialog(null)
                      await refresh()
                    }
                  } catch (error) {
                    console.error('Delete failed:', error)
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Template Dialog */}
      {viewTemplateDialog && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-violet-600 text-white p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{viewTemplateData?.name}</h2>
                <p className="text-cyan-100 text-xs">{viewTemplateData?.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {viewTemplateData?.is_active && (
                  <Badge className="bg-emerald-500 text-white border-emerald-400">
                    Active
                  </Badge>
                )}
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  Version {viewTemplateData?.version || 1}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-700 bg-white"
                  onClick={() => {
                    setViewTemplateDialog(null)
                    setViewTemplateData(null)
                  }}
                >
                  ×
                </Button>
              </div>
            </div>
            
            {/* Template Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <div className="bg-white/10 backdrop-blur-sm rounded p-2 border border-white/20">
                <div className="text-xs font-semibold text-cyan-100 uppercase tracking-wide">Vehicle Type</div>
                <div className="text-sm font-bold text-white capitalize">{viewTemplateData?.vehicle_type || 'Not specified'}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded p-2 border border-white/20">
                <div className="text-xs font-semibold text-cyan-100 uppercase tracking-wide">Fuel Type</div>
                <div className="text-sm font-bold text-white capitalize">{viewTemplateData?.fuel_type || 'Not specified'}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded p-2 border border-white/20">
                <div className="text-xs font-semibold text-cyan-100 uppercase tracking-wide">Sections</div>
                <div className="text-sm font-bold text-white">{viewTemplateData?.sections?.length || 0}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded p-2 border border-white/20">
                <div className="text-xs font-semibold text-cyan-100 uppercase tracking-wide">Created</div>
                <div className="text-sm font-bold text-white">
                  {new Date(viewTemplateData?.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-3 pt-1">
            {/* Content */}
            <div className="space-y-3">
              {loadingViewTemplate ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(viewTemplateData?.sections || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((section, sectionIndex) => {
                    const sortedQuestions = (section.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0))
                    
                    return (
                      <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* Section Header */}
                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-7 h-7 bg-violet-600 text-white rounded-full font-bold text-sm">
                              {sectionIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                              {section.description && (
                                <p className="text-xs text-slate-600 mt-1">{section.description}</p>
                              )}
                            </div>
                            <Badge tone="violet" className="text-xs">
                              {sortedQuestions.length} questions
                            </Badge>
                          </div>
                        </div>

                        {/* Questions */}
                        <div className="p-3 space-y-3 bg-white">
                          {sortedQuestions.map((question, questionIndex) => (
                            <div key={question.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                              <div className="flex items-start gap-2">
                                <div className="flex items-center justify-center w-5 h-5 bg-slate-300 text-slate-700 rounded-full text-xs font-bold mt-1">
                                  {questionIndex + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-sm text-slate-900">{question.title}</h4>
                                    {question.is_required && (
                                      <Badge tone="rose" className="text-xs">Required</Badge>
                                    )}
                                    <Badge tone={inputTypeTone(question.answer_type)} className="text-xs">
                                      {inputTypeLabel(question.answer_type)}
                                    </Badge>
                                  </div>
                                  
                                  {question.description && (
                                    <p className="text-xs text-slate-600 mb-2">{question.description}</p>
                                  )}

                                  {/* Render input field based on answer type */}
                                  <div className="mt-2">
                                    {question.answer_type === 'yes_no' && (
                                      <div className="flex gap-3 p-2 bg-white rounded border border-slate-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`view-question-${question.id}`}
                                            value="yes"
                                            className="w-4 h-4 text-emerald-600"
                                            disabled
                                          />
                                          <span className="text-xs text-slate-700 font-medium">Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`view-question-${question.id}`}
                                            value="no"
                                            className="w-4 h-4 text-rose-600"
                                            disabled
                                          />
                                          <span className="text-xs text-slate-700 font-medium">No</span>
                                        </label>
                                      </div>
                                    )}

                                    {(question.answer_type === 'single_choice' || question.answer_type === 'multi_choice') && (
                                      <div className="p-2 bg-white rounded border border-slate-200 space-y-1">
                                        {question.options?.map((option) => (
                                          <label key={option.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-50">
                                            <input
                                              type={question.answer_type === 'single_choice' ? 'radio' : 'checkbox'}
                                              name={question.answer_type === 'single_choice' ? `view-question-${question.id}` : `view-question-${question.id}-${option.id}`}
                                              value={option.value}
                                              className="w-4 h-4 text-cyan-600"
                                              disabled
                                            />
                                            <span className="text-xs text-slate-700 font-medium">{option.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}

                                    {question.answer_type === 'short_text' && (
                                      <input
                                        type="text"
                                        placeholder="Enter short answer..."
                                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                        disabled
                                      />
                                    )}

                                    {question.answer_type === 'long_text' && (
                                      <textarea
                                        placeholder="Enter detailed answer..."
                                        rows={2}
                                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs resize-none bg-white"
                                        disabled
                                      />
                                    )}

                                    {question.answer_type === 'number' && (
                                      <input
                                        type="number"
                                        placeholder="Enter number..."
                                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                        disabled
                                      />
                                    )}

                                    {question.answer_type === 'date' && (
                                      <input
                                        type="date"
                                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                        disabled
                                      />
                                    )}
                                  </div>

                                  {/* Image requirements */}
                                  {(question.expected_images_min > 0 || question.expected_images_max > 0) && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-amber-50 p-1 rounded">
                                      <Image className="h-3 w-3 text-amber-600" />
                                      <span className="font-medium">
                                        {question.expected_images_min || 0} - {question.expected_images_max || 0} images required
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-slate-200 p-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-cyan-600" />
                  <span className="font-medium">Created by: Admin User</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-cyan-600" />
                  <span className="font-medium">Created: {new Date(viewTemplateData?.created_at).toLocaleDateString()}</span>
                </div>
                {viewTemplateData?.published_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-cyan-600" />
                    <span className="font-medium">Published: {new Date(viewTemplateData.published_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <img src="/carnalysysnew1.jpg" alt="Carnalysis" className="h-5 w-auto rounded" />
                <span className="text-xs font-semibold text-cyan-600">CARNALYSYS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar for error notifications */}
      <Snackbar
        open={snackbar.open}
        tone={snackbar.tone}
        title={snackbar.title}
        message={snackbar.message}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </div>
  )
}
