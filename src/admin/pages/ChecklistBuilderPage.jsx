import { useMemo, useState } from 'react'
import { ListChecks, Plus, Trash2, Pencil } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'

const CONDITION_TABS = [
  { key: 'pre_owned', label: 'Pre-Owned' },
  { key: 'new', label: 'New' },
]

function inputTypeLabel(t) {
  if (t === 'dropdown') return 'Dropdown'
  if (t === 'multi_select') return 'Multi-select'
  if (t === 'numeric') return 'Numeric'
  if (t === 'yes_no') return 'Yes/No'
  if (t === 'photos') return 'Photos'
  if (t === 'toggle') return 'Toggle'
  if (t === 'rating') return 'Rating'
  return t || '—'
}

function inputTypeTone(t) {
  if (t === 'photos') return 'amber'
  if (t === 'numeric') return 'violet'
  if (t === 'multi_select') return 'cyan'
  if (t === 'dropdown') return 'slate'
  if (t === 'yes_no') return 'emerald'
  return 'slate'
}

export function ChecklistBuilderPage() {
  const { actor, permissions } = useRbac()
  const canEdit = !!permissions?.manageInspectors

  const [condition, setCondition] = useState('pre_owned')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [dialog, setDialog] = useState(null)

  const { data, loading, error, refresh } = usePolling(
    ['checklist', condition].join(':'),
    () => mockApi.getInspectionChecklist({ condition }),
    { intervalMs: 20_000 }
  )

  const sections = (data?.sections || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
  const scoringRules = (data?.scoringRules || []).slice().sort((a, b) => (a.minChecked || 0) - (b.minChecked || 0))

  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections])

  const selectedSection = useMemo(() => {
    const id = dialog?.sectionId || selectedSectionId
    if (!id) return null
    return sectionById.get(id) || null
  }, [dialog?.sectionId, sectionById, selectedSectionId])

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
        key: 'fields',
        header: 'Fields',
        exportValue: (r) => (r.fields || []).length,
        cell: (r) => <div className="text-xs text-slate-600">{(r.fields || []).length} items</div>,
      },
      {
        key: 'actions',
        header: <div className="w-full text-right">Actions</div>,
        cell: (r) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              className="h-8"
              title="View fields"
              onClick={() => setSelectedSectionId(r.id)}
            >
              Fields
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
              onClick={() => setDialog({ type: 'deleteSection', sectionId: r.id })}
              disabled={!canEdit}
            >
              <Trash2 className="h-4 w-4 text-rose-700" />
            </Button>
            <Button
              title="Add field"
              onClick={() => {
                setSelectedSectionId(r.id)
                setDialog({ type: 'createField', sectionId: r.id })
              }}
              disabled={!canEdit}
            >
              <Plus className="h-4 w-4" />
              Field
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [canEdit]
  )

  const fieldRows = selectedSection?.fields || []

  const fieldColumns = useMemo(
    () => [
      {
        key: 'label',
        header: 'Field',
        exportValue: (r) => r.label,
        cell: (r) => <div className="text-sm font-semibold text-slate-900">{r.label}</div>,
      },
      {
        key: 'type',
        header: 'Type',
        exportValue: (r) => r.inputType,
        cell: (r) => <Badge tone={inputTypeTone(r.inputType)}>{inputTypeLabel(r.inputType)}</Badge>,
      },
      {
        key: 'required',
        header: 'Required',
        exportValue: (r) => (r.required ? 'Yes' : 'No'),
        cell: (r) => <div className="text-xs text-slate-700">{r.required ? 'Yes' : 'No'}</div>,
      },
      {
        key: 'options',
        header: 'Options',
        exportValue: (r) => (r.options || []).join(', '),
        cell: (r) => {
          const opts = r.options || []
          if (!opts.length) return <div className="text-xs text-slate-500">—</div>
          return <div className="max-w-[420px] whitespace-normal text-xs text-slate-700">{opts.join(', ')}</div>
        },
      },
      {
        key: 'minPhotos',
        header: 'Min Photos',
        exportValue: (r) => r.minPhotos ?? '',
        cell: (r) => <div className="text-xs text-slate-700">{r.minPhotos ?? '—'}</div>,
      },
      {
        key: 'actions',
        header: <div className="w-full text-right">Actions</div>,
        cell: (r) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="icon"
              size="icon"
              title="Edit field"
              onClick={() => setDialog({ type: 'editField', sectionId: selectedSection?.id, fieldId: r.id })}
              disabled={!canEdit}
            >
              <Pencil className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              title="Delete field"
              onClick={() => setDialog({ type: 'deleteField', sectionId: selectedSection?.id, fieldId: r.id })}
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

  const sectionDialogOpen =
    dialog?.type === 'createSection' || dialog?.type === 'editSection' || dialog?.type === 'deleteSection'
  const fieldDialogOpen =
    dialog?.type === 'createField' || dialog?.type === 'editField' || dialog?.type === 'deleteField'
  const scoringDialogOpen =
    dialog?.type === 'createScoreRule' || dialog?.type === 'editScoreRule' || dialog?.type === 'deleteScoreRule'

  return (
    <div className="space-y-3">
      <Card
        title="Inspection Checklist Builder"
        subtitle="Create the inspection checklist used by PDI inspectors in the mobile app"
        accent="cyan"
        right={
          <div className="flex items-center gap-2">
            <Button onClick={() => refresh()} variant="ghost">
              Refresh
            </Button>
            <Button onClick={() => setDialog({ type: 'createSection' })} disabled={!canEdit}>
              <Plus className="h-4 w-4" />
              Section
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ListChecks className="h-4 w-4 text-cyan-700" />
            {canEdit ? 'You can edit checklist.' : 'View only (insufficient permission).'}
          </div>
          <div className="text-xs text-slate-500">{loading && !data ? 'Loading…' : `${sections.length} sections`}</div>
        </div>

        <div className="flex items-center gap-2 pb-3">
          {CONDITION_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={
                condition === t.key
                  ? 'cursor-pointer rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800'
                  : 'cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700'
              }
              onClick={() => {
                setCondition(t.key)
                setSelectedSectionId('')
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load checklist.</div>
        ) : null}

        <PaginatedTable
          columns={sectionColumns}
          rows={sections}
          rowKey={(r) => r.id}
          initialRowsPerPage={10}
          rowsPerPageOptions={[10, 20, 50, 'all']}
          enableSearch
          searchPlaceholder="Search sections…"
          enableExport
          exportFilename={`checklist-${condition}-sections.csv`}
        />

        {selectedSection ? (
          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">Fields: {selectedSection.title}</div>
            <PaginatedTable
              columns={fieldColumns}
              rows={fieldRows}
              rowKey={(r) => r.id}
              initialRowsPerPage={10}
              rowsPerPageOptions={[10, 20, 50, 'all']}
              enableSearch
              searchPlaceholder="Search fields…"
              enableExport
              exportFilename={`checklist-${condition}-${selectedSection.id}-fields.csv`}
            />
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">Score management</div>
              <div className="text-xs text-slate-500">Define how checklist completion translates to a PDI score</div>
            </div>
            <Button
              onClick={() => setDialog({ type: 'createScoreRule' })}
              disabled={!canEdit}
              title={canEdit ? 'Add score rule' : 'Insufficient permission'}
            >
              <Plus className="h-4 w-4" />
              Rule
            </Button>
          </div>

          {scoringRules.length ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-200/70 text-[11px] uppercase tracking-wide text-slate-700">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2.5">Min checked</th>
                    <th className="whitespace-nowrap px-3 py-2.5">Score %</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringRules.map((r) => (
                    <tr key={r.id} className="border-t border-slate-200/80">
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-800">
                        <span className="font-semibold">{r.minChecked}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-800">
                        <Badge tone="cyan">{r.scorePct}%</Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="icon"
                            size="icon"
                            title="Edit rule"
                            onClick={() => setDialog({ type: 'editScoreRule', ruleId: r.id })}
                            disabled={!canEdit}
                          >
                            <Pencil className="h-4 w-4 text-slate-700" />
                          </Button>
                          <Button
                            variant="icon"
                            size="icon"
                            title="Delete rule"
                            onClick={() => setDialog({ type: 'deleteScoreRule', ruleId: r.id })}
                            disabled={!canEdit}
                          >
                            <Trash2 className="h-4 w-4 text-rose-700" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              No scoring rules configured.
            </div>
          )}
        </div>
      </Card>

      <ReasonDialog
        open={sectionDialogOpen}
        title={
          dialog?.type === 'createSection'
            ? 'Add checklist section'
            : dialog?.type === 'editSection'
              ? 'Edit checklist section'
              : 'Delete checklist section'
        }
        description={
          dialog?.type === 'deleteSection'
            ? 'This will permanently delete the section and all its fields.'
            : 'Sections group checklist fields used by inspectors.'
        }
        submitLabel={dialog?.type === 'deleteSection' ? 'Delete' : 'Save'}
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={
          dialog?.type === 'deleteSection'
            ? []
            : [
                {
                  name: 'title',
                  label: 'Section title',
                  type: 'text',
                  defaultValue: dialog?.type === 'editSection' ? selectedSection?.title || '' : '',
                },
                {
                  name: 'order',
                  label: 'Order',
                  type: 'text',
                  defaultValue: dialog?.type === 'editSection' ? String(selectedSection?.order ?? '') : String(sections.length + 1),
                },
              ]
        }
        onSubmit={async (form) => {
          if (!canEdit) throw new Error('Insufficient permission')
          if (dialog?.type === 'deleteSection') {
            await mockApi.deleteChecklistSection({
              actor,
              condition,
              sectionId: dialog.sectionId,
              reason: form.reason,
            })
            setDialog(null)
            if (selectedSectionId === dialog.sectionId) setSelectedSectionId('')
            await refresh()
            return
          }

          const base = {
            id: dialog?.type === 'editSection' ? selectedSection?.id : undefined,
            title: form.title,
            order: Number(form.order || 0),
          }

          await mockApi.upsertChecklistSection({ actor, condition, section: base, reason: form.reason })
          setDialog(null)
          await refresh()
        }}
      />

      <ReasonDialog
        open={scoringDialogOpen}
        title={
          dialog?.type === 'createScoreRule'
            ? 'Add scoring rule'
            : dialog?.type === 'editScoreRule'
              ? 'Edit scoring rule'
              : 'Delete scoring rule'
        }
        description={
          dialog?.type === 'deleteScoreRule'
            ? 'This will remove the scoring rule.'
            : 'If checked items are at least this number, the score % can be awarded. In-between counts interpolate automatically.'
        }
        submitLabel={dialog?.type === 'deleteScoreRule' ? 'Delete' : 'Save'}
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={
          dialog?.type === 'deleteScoreRule'
            ? []
            : [
                {
                  name: 'minChecked',
                  label: 'Min checked items',
                  type: 'text',
                  defaultValue:
                    dialog?.type === 'editScoreRule'
                      ? String(scoringRules.find((r) => r.id === dialog.ruleId)?.minChecked ?? '')
                      : '',
                  placeholder: 'e.g. 3',
                },
                {
                  name: 'scorePct',
                  label: 'Score (%)',
                  type: 'text',
                  defaultValue:
                    dialog?.type === 'editScoreRule'
                      ? String(scoringRules.find((r) => r.id === dialog.ruleId)?.scorePct ?? '')
                      : '',
                  placeholder: 'e.g. 30',
                },
              ]
        }
        onSubmit={async (form) => {
          if (!canEdit) throw new Error('Insufficient permission')

          if (dialog?.type === 'deleteScoreRule') {
            await mockApi.deleteChecklistScoringRule({ actor, condition, ruleId: dialog.ruleId, reason: form.reason })
            setDialog(null)
            await refresh()
            return
          }

          await mockApi.upsertChecklistScoringRule({
            actor,
            condition,
            rule: {
              id: dialog?.type === 'editScoreRule' ? dialog.ruleId : undefined,
              minChecked: form.minChecked,
              scorePct: form.scorePct,
            },
            reason: form.reason,
          })
          setDialog(null)
          await refresh()
        }}
      />

      <ReasonDialog
        open={fieldDialogOpen}
        title={
          dialog?.type === 'createField'
            ? 'Add checklist field'
            : dialog?.type === 'editField'
              ? 'Edit checklist field'
              : 'Delete checklist field'
        }
        description={
          dialog?.type === 'deleteField'
            ? 'This will permanently delete the field.'
            : 'Fields define what the inspector must fill during inspection.'
        }
        submitLabel={dialog?.type === 'deleteField' ? 'Delete' : 'Save'}
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={
          dialog?.type === 'deleteField'
            ? []
            : [
                {
                  name: 'label',
                  label: 'Field label',
                  type: 'text',
                  defaultValue:
                    dialog?.type === 'editField'
                      ? (selectedSection?.fields || []).find((f) => f.id === dialog.fieldId)?.label || ''
                      : '',
                },
                {
                  name: 'inputType',
                  label: 'Input type',
                  type: 'select',
                  defaultValue:
                    dialog?.type === 'editField'
                      ? (selectedSection?.fields || []).find((f) => f.id === dialog.fieldId)?.inputType || 'dropdown'
                      : 'dropdown',
                  options: [
                    { value: 'dropdown', label: 'Dropdown' },
                    { value: 'multi_select', label: 'Multi-select' },
                    { value: 'yes_no', label: 'Yes/No' },
                    { value: 'numeric', label: 'Numeric' },
                    { value: 'photos', label: 'Photos' },
                    { value: 'toggle', label: 'Toggle' },
                    { value: 'rating', label: 'Rating' },
                  ],
                },
                {
                  name: 'required',
                  label: 'Required',
                  type: 'select',
                  defaultValue: dialog?.type === 'editField'
                    ? ((selectedSection?.fields || []).find((f) => f.id === dialog.fieldId)?.required ? 'true' : 'false')
                    : 'true',
                  options: [
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ],
                },
                {
                  name: 'options',
                  label: 'Options (comma separated)',
                  type: 'text',
                  defaultValue:
                    dialog?.type === 'editField'
                      ? ((selectedSection?.fields || []).find((f) => f.id === dialog.fieldId)?.options || []).join(', ')
                      : '',
                  placeholder: 'e.g. Good, Average, Poor',
                },
                {
                  name: 'minPhotos',
                  label: 'Min photos (only for Photos type)',
                  type: 'text',
                  defaultValue: dialog?.type === 'editField'
                    ? String((selectedSection?.fields || []).find((f) => f.id === dialog.fieldId)?.minPhotos ?? '')
                    : '',
                  placeholder: 'e.g. 4',
                },
              ]
        }
        onSubmit={async (form) => {
          if (!canEdit) throw new Error('Insufficient permission')
          if (!dialog?.sectionId) throw new Error('Section not selected')

          if (dialog?.type === 'deleteField') {
            await mockApi.deleteChecklistField({
              actor,
              condition,
              sectionId: dialog.sectionId,
              fieldId: dialog.fieldId,
              reason: form.reason,
            })
            setDialog(null)
            await refresh()
            return
          }

          const existing = dialog?.type === 'editField'
            ? (selectedSection?.fields || []).find((f) => f.id === dialog.fieldId)
            : null

          await mockApi.upsertChecklistField({
            actor,
            condition,
            sectionId: dialog.sectionId,
            field: {
              id: existing?.id,
              label: form.label,
              inputType: form.inputType,
              required: form.required === 'true',
              options: form.options,
              minPhotos: form.minPhotos,
            },
            reason: form.reason,
          })

          setDialog(null)
          await refresh()
        }}
      />
    </div>
  )
}
