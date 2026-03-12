import { useMemo, useState } from 'react'
import { ListChecks, Plus, Trash2, Pencil, FileText, Eye } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { listTemplates, createTemplate, updateTemplate, deleteTemplate, getTemplate } from '../../api/template'

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

  const { data: templatesData, loading, error, refresh } = usePolling(
    'inspection-templates',
    () => listTemplates(),
    { intervalMs: 20_000 }
  )

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
              variant="icon"
              size="icon"
              title="Edit template"
              onClick={() => setDialog({ type: 'editTemplate', templateId: r.id })}
              disabled={!canEdit}
            >
              <Pencil className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              title="Delete template"
              onClick={() => setConfirmDialog({
                type: 'deleteTemplate',
                templateId: r.id,
                templateName: r.name,
                message: `Are you sure you want to delete "${r.name}"? This will permanently delete the template and all its sections and questions.`
              })}
              disabled={!canEdit || r.is_active}
            >
              <Trash2 className="h-4 w-4 text-rose-700" />
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
              variant="icon"
              size="icon"
              title="Delete section"
              onClick={() => setConfirmDialog({
                type: 'deleteSection',
                sectionId: r.id,
                sectionName: r.title,
                message: `Are you sure you want to delete section "${r.title}"? This will permanently delete the section and all its questions.`
              })}
              disabled={!canEdit}
            >
              <Trash2 className="h-4 w-4 text-rose-700" />
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
            <Button
              variant="icon"
              size="icon"
              title="Delete question"
              onClick={() => setConfirmDialog({
                type: 'deleteQuestion',
                sectionId: selectedSection?.id,
                questionId: r.id,
                questionName: r.title,
                message: `Are you sure you want to delete question "${r.title}"? This will permanently delete the question.`
              })}
              disabled={!canEdit}
            >
              <Trash2 className="h-4 w-4 text-rose-700" />
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
        onClose={() => setDialog(null)}
        showReason={false}
        requireReason={false}
        fields={[
          {
            name: 'name',
            label: 'Template Name',
            type: 'text',
            defaultValue: dialog?.type === 'editTemplate' ? selectedTemplate?.name || '' : '',
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 3,
            defaultValue: dialog?.type === 'editTemplate' ? selectedTemplate?.description || '' : '',
          },
          {
            name: 'is_active',
            label: 'Active Template',
            type: 'checkbox',
            defaultValue: dialog?.type === 'editTemplate' ? selectedTemplate?.is_active || false : false,
            checkboxLabel: 'Make this the active template (only one can be active)',
          },
        ]}
        onSubmit={async (form) => {
          if (!canEdit) throw new Error('Insufficient permission')

          const templateData = {
            name: form.name,
            description: form.description,
            is_active: form.is_active,
            sections: dialog?.type === 'editTemplate' ? selectedTemplate?.sections || [] : []
          }

          if (dialog?.type === 'createTemplate') {
            await createTemplate(templateData)
          } else {
            await updateTemplate(dialog.templateId, templateData)
          }

          setDialog(null)
          await refresh()
        }}
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
        onClose={() => setDialog(null)}
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

          const sectionData = {
            title: form.title,
            description: form.description,
            order: Number(form.order || 1),
            questions: dialog?.type === 'editSection' ? selectedSection?.questions || [] : []
          }

          let updatedSections
          if (dialog?.type === 'createSection') {
            updatedSections = [...(selectedTemplate.sections || []), sectionData]
          } else {
            updatedSections = selectedTemplate.sections.map(s => 
              s.id === dialog.sectionId ? { ...s, ...sectionData } : s
            )
          }

          await updateTemplate(selectedTemplate.id, { ...selectedTemplate, sections: updatedSections })
          setDialog(null)
          await refresh()
        }}
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
        onClose={() => setDialog(null)}
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
            label: 'Options (comma separated)',
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

          let updatedSections
          if (dialog?.type === 'createQuestion') {
            updatedSections = selectedTemplate.sections.map(s => 
              s.id === dialog.sectionId 
                ? { ...s, questions: [...(s.questions || []), questionData] }
                : s
            )
          } else {
            updatedSections = selectedTemplate.sections.map(s => 
              s.id === dialog.sectionId 
                ? { 
                    ...s, 
                    questions: s.questions.map(q => 
                      q.id === dialog.questionId ? { ...q, ...questionData } : q
                    )
                  }
                : s
            )
          }

          await updateTemplate(selectedTemplate.id, { ...selectedTemplate, sections: updatedSections })
          setDialog(null)
          await refresh()
        }}
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
    </div>
  )
}
