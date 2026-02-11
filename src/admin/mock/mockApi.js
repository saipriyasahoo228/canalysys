const COMMISSION_DEFAULT_INR = 500

const roles = {
  SUPER_ADMIN: 'super_admin',
  OPS_ADMIN: 'ops_admin',
  LOCATION_MANAGER: 'location_manager',
  FINANCE: 'finance',
  READ_ONLY: 'read_only',
}

const nowIso = () => new Date().toISOString()

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString()

const uid = (() => {
  let n = 1000
  return () => `EVT-${++n}`
})()

const todayKey = (iso) => {
  const d = iso ? new Date(iso) : new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const state = {
  rbac: {
    roles: [
      { id: roles.SUPER_ADMIN, name: 'Super Admin' },
      { id: roles.OPS_ADMIN, name: 'Ops Admin' },
      { id: roles.LOCATION_MANAGER, name: 'Location Manager' },
      { id: roles.FINANCE, name: 'Finance' },
      { id: roles.READ_ONLY, name: 'Read-only' },
    ],
    users: [
      {
        userId: 'USR-SA-1',
        name: 'Super Admin',
        role: roles.SUPER_ADMIN,
        email: 'admin@carnalysis.local',
        phone: '9999999999',
        username: 'superadmin',
        password: 'admin123',
        active: true,
      },
      {
        userId: 'USR-OPS-1',
        name: 'Ops Admin',
        role: roles.OPS_ADMIN,
        email: 'ops@carnalysis.local',
        phone: '9000000001',
        username: 'opsadmin',
        password: 'admin123',
        active: true,
      },
      {
        userId: 'USR-LM-1',
        name: 'Location Manager',
        role: roles.LOCATION_MANAGER,
        email: 'lm@carnalysis.local',
        phone: '9000000002',
        username: 'locmanager',
        password: 'admin123',
        active: true,
      },
      {
        userId: 'USR-FIN-1',
        name: 'Finance',
        role: roles.FINANCE,
        email: 'finance@carnalysis.local',
        phone: '9000000003',
        username: 'finance',
        password: 'admin123',
        active: true,
      },
      {
        userId: 'USR-RO-1',
        name: 'Read-only',
        role: roles.READ_ONLY,
        email: 'viewer@carnalysis.local',
        phone: '9000000004',
        username: 'viewer',
        password: 'admin123',
        active: true,
      },
    ],
    permissionsByRole: {
      [roles.SUPER_ADMIN]: {
        view: true,
        manageQueue: true,
        manageInspectors: true,
        managePricing: true,
        viewAudit: true,
        manageAccess: true,
        crud: {
          queue: { create: true, read: true, update: true, delete: true },
          inspectors: { create: true, read: true, update: true, delete: true },
          pricing: { create: true, read: true, update: true, delete: true },
          audit: { create: false, read: true, update: false, delete: false },
          access: { create: true, read: true, update: true, delete: true },
        },
      },
      [roles.OPS_ADMIN]: {
        view: true,
        manageQueue: true,
        manageInspectors: true,
        managePricing: true,
        viewAudit: true,
        manageAccess: false,
        crud: {
          queue: { create: true, read: true, update: true, delete: false },
          inspectors: { create: true, read: true, update: true, delete: false },
          pricing: { create: true, read: true, update: true, delete: false },
          audit: { create: false, read: true, update: false, delete: false },
          access: { create: false, read: false, update: false, delete: false },
        },
      },
      [roles.LOCATION_MANAGER]: {
        view: true,
        manageQueue: true,
        manageInspectors: true,
        managePricing: false,
        viewAudit: true,
        manageAccess: false,
        crud: {
          queue: { create: true, read: true, update: true, delete: false },
          inspectors: { create: true, read: true, update: true, delete: false },
          pricing: { create: false, read: true, update: false, delete: false },
          audit: { create: false, read: true, update: false, delete: false },
          access: { create: false, read: false, update: false, delete: false },
        },
      },
      [roles.FINANCE]: {
        view: true,
        manageQueue: false,
        manageInspectors: false,
        managePricing: true,
        viewAudit: true,
        manageAccess: false,
        crud: {
          queue: { create: false, read: true, update: false, delete: false },
          inspectors: { create: false, read: true, update: false, delete: false },
          pricing: { create: true, read: true, update: true, delete: false },
          audit: { create: false, read: true, update: false, delete: false },
          access: { create: false, read: false, update: false, delete: false },
        },
      },
      [roles.READ_ONLY]: {
        view: true,
        manageQueue: false,
        manageInspectors: false,
        managePricing: false,
        viewAudit: true,
        manageAccess: false,
        crud: {
          queue: { create: false, read: true, update: false, delete: false },
          inspectors: { create: false, read: true, update: false, delete: false },
          pricing: { create: false, read: true, update: false, delete: false },
          audit: { create: false, read: true, update: false, delete: false },
          access: { create: false, read: false, update: false, delete: false },
        },
      },
    },
    permissionsByUser: {},
  },
  locations: [
    { id: 'LOC-BLR-01', name: 'Bengaluru - HSR', slaMinutes: 45, capacityPerHour: 18 },
    { id: 'LOC-HYD-01', name: 'Hyderabad - Gachibowli', slaMinutes: 50, capacityPerHour: 14 },
    { id: 'LOC-PUN-01', name: 'Pune - Hinjewadi', slaMinutes: 55, capacityPerHour: 12 },
  ],
  inspectors: [
    {
      id: 'INSP-001',
      name: 'Asha N.',
      phone: '9000000101',
      email: 'asha@carnalysis.local',
      profilePhotoUrl: '',
      joinDate: '2025-11-15',
      employmentType: 'full_time',
      status: 'active',
      locationIds: ['LOC-BLR-01'],
      active: true,
      skills: ['new', 'pre_owned'],
      utilizationPct: 78,
      lastStateChangeAt: minutesAgo(12),
      state: 'busy',
    },
    {
      id: 'INSP-002',
      name: 'Ravi K.',
      phone: '9000000102',
      email: 'ravi@carnalysis.local',
      profilePhotoUrl: '',
      joinDate: '2025-09-01',
      employmentType: 'contract',
      status: 'active',
      locationIds: ['LOC-BLR-01'],
      active: true,
      skills: ['new'],
      utilizationPct: 52,
      lastStateChangeAt: minutesAgo(30),
      state: 'idle',
    },
    {
      id: 'INSP-003',
      name: 'Neha S.',
      phone: '9000000103',
      email: 'neha@carnalysis.local',
      profilePhotoUrl: '',
      joinDate: '2025-07-20',
      employmentType: 'freelancer',
      status: 'active',
      locationIds: ['LOC-HYD-01'],
      active: true,
      skills: ['pre_owned'],
      utilizationPct: 64,
      lastStateChangeAt: minutesAgo(5),
      state: 'busy',
    },
    {
      id: 'INSP-004',
      name: 'Imran A.',
      phone: '9000000104',
      email: 'imran@carnalysis.local',
      profilePhotoUrl: '',
      joinDate: '2025-10-10',
      employmentType: 'full_time',
      status: 'inactive',
      locationIds: ['LOC-HYD-01'],
      active: false,
      skills: ['new', 'pre_owned'],
      utilizationPct: 39,
      lastStateChangeAt: minutesAgo(42),
      state: 'idle',
    },
    {
      id: 'INSP-005',
      name: 'Priya M.',
      phone: '9000000105',
      email: 'priya@carnalysis.local',
      profilePhotoUrl: '',
      joinDate: '2025-08-05',
      employmentType: 'full_time',
      status: 'active',
      locationIds: ['LOC-PUN-01'],
      active: true,
      skills: ['new', 'pre_owned'],
      utilizationPct: 71,
      lastStateChangeAt: minutesAgo(18),
      state: 'busy',
    },
  ],
  inspectorLeaveRequests: [
    {
      id: 'LVR-0001',
      inspectorId: 'INSP-002',
      fromDate: '2026-02-15',
      toDate: '2026-02-16',
      reason: 'Family function',
      status: 'pending',
      requestedAt: minutesAgo(90),
      decidedAt: null,
      rejectionReason: null,
    },
  ],
  queue: [
    {
      id: 'PDI-24001',
      createdAt: minutesAgo(55),
      locationId: 'LOC-BLR-01',
      vehicleType: 'new',
      customerName: 'Amit Sharma',
      customerPhone: '+91 98765 43210',
      vehicleNumber: 'KA01AB2401',
      vehicleSummary: 'Honda City',
      priority: 'P1',
      status: 'pending',
      assignedInspectorId: null,
      customerEtaMinutes: 0,
      expectedDurationMinutes: 25,
      priceInr: 500,
      paymentAt: null,
      closedAt: null,
      commissionOverrideInr: null,
    },
    {
      id: 'PDI-24002',
      createdAt: minutesAgo(35),
      locationId: 'LOC-BLR-01',
      vehicleType: 'pre_owned',
      customerName: 'Neha Verma',
      customerPhone: '+91 91234 56789',
      vehicleNumber: 'KA05CD1202',
      vehicleSummary: 'Hyundai i20 (2019)',
      priority: 'P2',
      status: 'pending',
      assignedInspectorId: null,
      customerEtaMinutes: 10,
      expectedDurationMinutes: 30,
      priceInr: 500,
      paymentAt: null,
      closedAt: null,
      commissionOverrideInr: null,
    },
    {
      id: 'PDI-24003',
      createdAt: minutesAgo(80),
      locationId: 'LOC-HYD-01',
      vehicleType: 'pre_owned',
      customerName: 'Rahul Reddy',
      customerPhone: '+91 90000 12345',
      vehicleNumber: 'TS09EF9903',
      vehicleSummary: 'Maruti Swift (2018)',
      priority: 'P0',
      status: 'in_progress',
      assignedInspectorId: 'INSP-003',
      customerEtaMinutes: 0,
      expectedDurationMinutes: 35,
      priceInr: 500,
      paymentAt: minutesAgo(10),
      closedAt: null,
      commissionOverrideInr: null,
    },
    {
      id: 'PDI-24004',
      createdAt: minutesAgo(20),
      locationId: 'LOC-HYD-01',
      vehicleType: 'new',
      customerName: 'Sana Khan',
      customerPhone: '+91 90123 45678',
      vehicleNumber: 'TS10GH4404',
      vehicleSummary: 'Tata Nexon',
      priority: 'P3',
      status: 'pending',
      assignedInspectorId: null,
      customerEtaMinutes: 5,
      expectedDurationMinutes: 20,
      priceInr: 500,
      paymentAt: null,
      closedAt: null,
      commissionOverrideInr: null,
    },
    {
      id: 'PDI-24005',
      createdAt: minutesAgo(15),
      locationId: 'LOC-PUN-01',
      vehicleType: 'new',
      customerName: 'Vikram Patil',
      customerPhone: '+91 99887 77665',
      vehicleNumber: 'MH12JK2405',
      vehicleSummary: 'Mahindra XUV300',
      priority: 'P2',
      status: 'pending',
      assignedInspectorId: null,
      customerEtaMinutes: 0,
      expectedDurationMinutes: 25,
      priceInr: 500,
      paymentAt: null,
      closedAt: null,
      commissionOverrideInr: null,
    },
  ],
  commissions: [
    {
      id: 'COM-9001',
      inspectorId: 'INSP-001',
      locationId: 'LOC-BLR-01',
      pdiId: 'PDI-23988',
      visitAt: minutesAgo(320),
      amountInr: COMMISSION_DEFAULT_INR,
      status: 'pending',
      paymentAt: minutesAgo(300),
    },
    {
      id: 'COM-9002',
      inspectorId: 'INSP-003',
      locationId: 'LOC-HYD-01',
      pdiId: 'PDI-23991',
      visitAt: minutesAgo(210),
      amountInr: COMMISSION_DEFAULT_INR,
      status: 'approved',
      paymentAt: minutesAgo(205),
    },
  ],
  audit: [
    {
      id: uid(),
      at: minutesAgo(18),
      actor: { userId: 'USR-OPS-1', name: 'Ops Admin', role: roles.OPS_ADMIN },
      locationId: 'LOC-HYD-01',
      entity: { type: 'queue_item', id: 'PDI-24003' },
      action: 'manual_assign',
      diff: { assignedInspectorId: { from: null, to: 'INSP-003' } },
      reason: 'High priority customer arrival',
      correlationId: 'BULK-0001',
    },
  ],
  pricing: {
    defaultInr: 500,
  },

  vehicleMaster: {
    makes: [
      { id: 'MAKE-MARUTI', name: 'Maruti Suzuki' },
      { id: 'MAKE-HONDA', name: 'Honda' },
      { id: 'MAKE-HYUNDAI', name: 'Hyundai' },
      { id: 'MAKE-TATA', name: 'Tata' },
      { id: 'MAKE-MAHINDRA', name: 'Mahindra' },
      { id: 'MAKE-TOYOTA', name: 'Toyota' },
      { id: 'MAKE-KIA', name: 'Kia' },
      { id: 'MAKE-RENAULT', name: 'Renault' },
      { id: 'MAKE-SKODA', name: 'Skoda' },
      { id: 'MAKE-VW', name: 'Volkswagen' },
    ],
    models: [
      { id: 'MODEL-SWIFT', name: 'Swift', makeId: 'MAKE-MARUTI' },
      { id: 'MODEL-CITY', name: 'City', makeId: 'MAKE-HONDA' },
      { id: 'MODEL-BALENO', name: 'Baleno', makeId: 'MAKE-MARUTI' },
      { id: 'MODEL-BREZZA', name: 'Brezza', makeId: 'MAKE-MARUTI' },
      { id: 'MODEL-AMAZE', name: 'Amaze', makeId: 'MAKE-HONDA' },
      { id: 'MODEL-CRETA', name: 'Creta', makeId: 'MAKE-HYUNDAI' },
      { id: 'MODEL-I20', name: 'i20', makeId: 'MAKE-HYUNDAI' },
      { id: 'MODEL-NEXON', name: 'Nexon', makeId: 'MAKE-TATA' },
      { id: 'MODEL-PUNCH', name: 'Punch', makeId: 'MAKE-TATA' },
      { id: 'MODEL-XUV700', name: 'XUV700', makeId: 'MAKE-MAHINDRA' },
      { id: 'MODEL-SCORPIO', name: 'Scorpio-N', makeId: 'MAKE-MAHINDRA' },
      { id: 'MODEL-INNOVA', name: 'Innova Crysta', makeId: 'MAKE-TOYOTA' },
      { id: 'MODEL-SELTO', name: 'Seltos', makeId: 'MAKE-KIA' },
      { id: 'MODEL-KIGER', name: 'Kiger', makeId: 'MAKE-RENAULT' },
      { id: 'MODEL-SLAVIA', name: 'Slavia', makeId: 'MAKE-SKODA' },
      { id: 'MODEL-TAIGUN', name: 'Taigun', makeId: 'MAKE-VW' },
    ],
    variants: [
      { id: 'VAR-VXI', name: 'VXI', modelId: 'MODEL-SWIFT' },
      { id: 'VAR-ZXI', name: 'ZXI', modelId: 'MODEL-SWIFT' },
      { id: 'VAR-LXI', name: 'LXI', modelId: 'MODEL-SWIFT' },
      { id: 'VAR-DELTA', name: 'Delta', modelId: 'MODEL-BALENO' },
      { id: 'VAR-ALPHA', name: 'Alpha', modelId: 'MODEL-BALENO' },
      { id: 'VAR-VX', name: 'VX', modelId: 'MODEL-CITY' },
      { id: 'VAR-ZX', name: 'ZX', modelId: 'MODEL-CITY' },
      { id: 'VAR-SX', name: 'SX', modelId: 'MODEL-CRETA' },
      { id: 'VAR-SX-O', name: 'SX (O)', modelId: 'MODEL-CRETA' },
      { id: 'VAR-SPORTZ', name: 'Sportz', modelId: 'MODEL-I20' },
      { id: 'VAR-ASTA', name: 'Asta', modelId: 'MODEL-I20' },
      { id: 'VAR-XZ', name: 'XZ+', modelId: 'MODEL-NEXON' },
      { id: 'VAR-XM', name: 'XM', modelId: 'MODEL-PUNCH' },
      { id: 'VAR-AX7', name: 'AX7', modelId: 'MODEL-XUV700' },
      { id: 'VAR-Z8', name: 'Z8', modelId: 'MODEL-SCORPIO' },
      { id: 'VAR-Z7', name: 'Z7', modelId: 'MODEL-SCORPIO' },
      { id: 'VAR-GX', name: 'GX', modelId: 'MODEL-INNOVA' },
      { id: 'VAR-HTK', name: 'HTK', modelId: 'MODEL-SELTO' },
      { id: 'VAR-RXL', name: 'RXL', modelId: 'MODEL-KIGER' },
      { id: 'VAR-STYLE', name: 'Style', modelId: 'MODEL-SLAVIA' },
      { id: 'VAR-TOPLINE', name: 'Topline', modelId: 'MODEL-TAIGUN' },
    ],
    categories: [
      { id: 'CAT-HATCH', name: 'Hatchback' },
      { id: 'CAT-SEDAN', name: 'Sedan' },
      { id: 'CAT-SUV', name: 'SUV' },
      { id: 'CAT-MUV', name: 'MUV/MPV' },
      { id: 'CAT-LUX', name: 'Luxury' },
      { id: 'CAT-COMPACT', name: 'Compact' },
    ],
    mappings: [
      {
        id: 'MAP-0001',
        condition: 'new',
        makeId: 'MAKE-MARUTI',
        modelId: 'MODEL-SWIFT',
        variantId: 'VAR-VXI',
        categoryId: 'CAT-HATCH',
      },
      {
        id: 'MAP-0002',
        condition: 'new',
        makeId: 'MAKE-HONDA',
        modelId: 'MODEL-CITY',
        variantId: 'VAR-VX',
        categoryId: 'CAT-SEDAN',
      },
      {
        id: 'MAP-0003',
        condition: 'pre_owned',
        makeId: 'MAKE-HYUNDAI',
        modelId: 'MODEL-CRETA',
        variantId: 'VAR-SX',
        categoryId: 'CAT-SUV',
      },
      {
        id: 'MAP-0004',
        condition: 'new',
        makeId: 'MAKE-TATA',
        modelId: 'MODEL-NEXON',
        variantId: 'VAR-XZ',
        categoryId: 'CAT-SUV',
      },
      {
        id: 'MAP-0005',
        condition: 'new',
        makeId: 'MAKE-TOYOTA',
        modelId: 'MODEL-INNOVA',
        variantId: 'VAR-GX',
        categoryId: 'CAT-MUV',
      },
    ],
    mappingPricingByMappingId: {
      'MAP-0001': { baseInr: 500, distantAfterKm: 10, distantExtraInr: 50 },
      'MAP-0002': { baseInr: 650, distantAfterKm: 10, distantExtraInr: 50 },
      'MAP-0003': { baseInr: 800, distantAfterKm: 10, distantExtraInr: 50 },
      'MAP-0004': { baseInr: 800, distantAfterKm: 10, distantExtraInr: 50 },
      'MAP-0005': { baseInr: 900, distantAfterKm: 10, distantExtraInr: 50 },
    },
    pricingByCategoryId: {
      'CAT-HATCH': 500,
      'CAT-SEDAN': 650,
      'CAT-SUV': 800,
      'CAT-MUV': 900,
      'CAT-LUX': 1400,
      'CAT-COMPACT': 550,
    },
  },
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const simulateNetwork = async () => {
  await sleep(60 + Math.random() * 120)
}

const recordAudit = ({ actor, locationId, entity, action, diff, reason, correlationId }) => {
  state.audit.unshift({
    id: uid(),
    at: nowIso(),
    actor,
    locationId,
    entity,
    action,
    diff,
    reason,
    correlationId: correlationId || null,
  })
}

const defaultPermissions = () => ({
  view: true,
  manageQueue: false,
  manageInspectors: false,
  managePricing: false,
  viewAudit: true,
  manageAccess: false,
  crud: {
    queue: { create: false, read: true, update: false, delete: false },
    inspectors: { create: false, read: true, update: false, delete: false },
    pricing: { create: false, read: true, update: false, delete: false },
    audit: { create: false, read: true, update: false, delete: false },
    access: { create: false, read: false, update: false, delete: false },
  },
})

const queueAgeMinutes = (q) => Math.max(0, Math.floor((Date.now() - new Date(q.createdAt).getTime()) / 60_000))

const kpi = (locationId) => {
  const locations = state.locations
  const queue = state.queue.filter((q) => !locationId || q.locationId === locationId)
  const inspectors = state.inspectors.filter((i) => !locationId || i.locationIds.includes(locationId))

  const pending = queue.filter((q) => q.status === 'pending')
  const inProgress = queue.filter((q) => q.status === 'in_progress')
  const postponed = queue.filter((q) => q.status === 'postponed')
  const closedToday = queue.filter((q) => q.status === 'closed' && todayKey(q.closedAt) === todayKey())

  const avgWait = pending.length
    ? Math.round(pending.reduce((acc, q) => acc + queueAgeMinutes(q), 0) / pending.length)
    : 0

  const utilization = inspectors.length
    ? Math.round(inspectors.reduce((acc, i) => acc + i.utilizationPct, 0) / inspectors.length)
    : 0

  const idleInspectors = inspectors.filter((i) => i.active && i.state === 'idle')

  const breaches = pending.filter((q) => {
    const loc = locations.find((l) => l.id === q.locationId)
    if (!loc) return false
    return queueAgeMinutes(q) > loc.slaMinutes
  })

  return {
    totalInspectionsToday: closedToday.length + inProgress.length,
    queueLength: pending.length,
    postponedCount: postponed.length,
    avgWaitMinutes: avgWait,
    inspectorUtilizationPct: utilization,
    idleInspectorsCount: idleInspectors.length,
    slaBreachesCount: breaches.length,
    slaMetPct: Math.max(0, Math.min(100, 100 - Math.round((breaches.length / Math.max(1, pending.length)) * 100))),
  }
}

const buildAlerts = () => {
  const alerts = []

  for (const loc of state.locations) {
    const locQueue = state.queue.filter((q) => q.locationId === loc.id && q.status === 'pending')
    const avgWait = locQueue.length
      ? Math.round(locQueue.reduce((acc, q) => acc + queueAgeMinutes(q), 0) / locQueue.length)
      : 0

    if (locQueue.length >= 6 || avgWait >= loc.slaMinutes * 0.8) {
      alerts.push({
        id: `ALERT-QL-${loc.id}`,
        type: 'queue_overload',
        severity: locQueue.length >= 8 ? 'critical' : 'warning',
        locationId: loc.id,
        title: 'Queue overload risk',
        message: `${loc.name}: ${locQueue.length} waiting, avg wait ${avgWait}m`,
        at: nowIso(),
      })
    }

    const idle = state.inspectors.filter(
      (i) => i.active && i.state === 'idle' && i.locationIds.includes(loc.id)
    )

    for (const insp of idle) {
      const idleMins = Math.max(0, Math.floor((Date.now() - new Date(insp.lastStateChangeAt).getTime()) / 60_000))
      if (idleMins >= 20) {
        alerts.push({
          id: `ALERT-IDLE-${insp.id}`,
          type: 'inspector_idle',
          severity: idleMins >= 40 ? 'warning' : 'info',
          locationId: loc.id,
          title: 'Inspector idle',
          message: `${insp.name} idle for ${idleMins}m`,
          at: nowIso(),
        })
      }
    }
  }

  return alerts
}

const buildTrends = () => {
  const points = []
  const now = new Date()
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 60_000)
    points.push({
      t: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      inspections: 6 + Math.floor(Math.random() * 7),
      avgWait: 18 + Math.floor(Math.random() * 20),
    })
  }
  return points
}

const buildQueueLoadByLocation = () => {
  return state.locations.map((l) => {
    const pending = state.queue.filter((q) => q.locationId === l.id && q.status === 'pending').length
    const inProgress = state.queue.filter((q) => q.locationId === l.id && q.status === 'in_progress').length
    const postponed = state.queue.filter((q) => q.locationId === l.id && q.status === 'postponed').length
    return { locationId: l.id, name: l.name, waiting: pending, inProgress, postponed }
  })
}

const buildVehicleTypeRatio = () => {
  const active = state.queue.filter((q) => q.status !== 'closed')
  const newCount = active.filter((q) => q.vehicleType === 'new').length
  const preOwnedCount = active.filter((q) => q.vehicleType === 'pre_owned').length
  return [
    { name: 'New', value: newCount },
    { name: 'Pre-owned', value: preOwnedCount },
  ]
}

const computeCommissionAmount = (queueItem) => {
  if (!queueItem) return COMMISSION_DEFAULT_INR
  if (Number.isFinite(queueItem.commissionOverrideInr)) return Number(queueItem.commissionOverrideInr)
  return COMMISSION_DEFAULT_INR
}

const applySmallDrift = () => {
  for (const insp of state.inspectors) {
    if (!insp.active) continue
    const delta = Math.round((Math.random() - 0.5) * 6)
    insp.utilizationPct = Math.max(10, Math.min(95, insp.utilizationPct + delta))

    if (Math.random() < 0.08) {
      const nextState = insp.state === 'idle' ? 'busy' : 'idle'
      insp.state = nextState
      insp.lastStateChangeAt = nowIso()
    }
  }

  if (Math.random() < 0.18) {
    const loc = state.locations[Math.floor(Math.random() * state.locations.length)]
    const id = `PDI-${24000 + Math.floor(Math.random() * 400)}`
    state.queue.unshift({
      id,
      createdAt: nowIso(),
      locationId: loc.id,
      vehicleType: Math.random() < 0.55 ? 'new' : 'pre_owned',
      priority: ['P0', 'P1', 'P2', 'P3'][Math.floor(Math.random() * 4)],
      status: 'pending',
      assignedInspectorId: null,
      customerEtaMinutes: Math.floor(Math.random() * 16),
      expectedDurationMinutes: 20 + Math.floor(Math.random() * 20),
      priceInr: state.pricing.defaultInr,
      paymentAt: null,
      closedAt: null,
      commissionOverrideInr: null,
    })
  }
}

function driftNum(current, maxDelta, min, max) {
  return clamp(current + Math.floor(Math.random() * (maxDelta * 2 + 1)) - maxDelta, min, max)
}

function generateInspectorId() {
  return `INSP-${String(100 + Math.floor(Math.random() * 900)).padStart(3, '0')}`
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

export const mockApi = {
  generateInspectorId,
  roles,
  COMMISSION_DEFAULT_INR,

  async getVehicleMaster() {
    await simulateNetwork()
    return {
      makes: state.vehicleMaster.makes,
      models: state.vehicleMaster.models,
      variants: state.vehicleMaster.variants,
      categories: state.vehicleMaster.categories,
      mappings: state.vehicleMaster.mappings,
      mappingPricingByMappingId: state.vehicleMaster.mappingPricingByMappingId,
      pricingByCategoryId: state.vehicleMaster.pricingByCategoryId,
    }
  },

  async createVehicleMasterItem({ actor, kind, name, makeId, modelId, reason }) {
    await simulateNetwork()
    const cleaned = String(name || '').trim()
    if (!cleaned) throw new Error('Name is required')

    const map = {
      make: { key: 'makes', prefix: 'MAKE-' },
      model: { key: 'models', prefix: 'MODEL-' },
      variant: { key: 'variants', prefix: 'VAR-' },
      category: { key: 'categories', prefix: 'CAT-' },
    }

    const cfg = map[kind]
    if (!cfg) throw new Error('Unsupported kind')

    const list = state.vehicleMaster[cfg.key]

    const slug = cleaned
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 22)

    const id = `${cfg.prefix}${slug || Date.now().toString(36).toUpperCase()}`
    if (list.some((x) => x.id === id)) throw new Error('Duplicate ID')
    if (list.some((x) => String(x.name).toLowerCase() === cleaned.toLowerCase())) throw new Error('Duplicate name')

    if (kind === 'model') {
      if (!makeId) throw new Error('Make is required')
      if (!state.vehicleMaster.makes.some((m) => m.id === makeId)) throw new Error('Make not found')
    }

    if (kind === 'variant') {
      if (!modelId) throw new Error('Model is required')
      if (!state.vehicleMaster.models.some((m) => m.id === modelId)) throw new Error('Model not found')
    }

    const next = {
      id,
      name: cleaned,
      ...(kind === 'model' ? { makeId } : null),
      ...(kind === 'variant' ? { modelId } : null),
    }
    list.unshift(next)

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'vehicle_master', id },
      action: 'create_vehicle_master_item',
      diff: { kind: { from: null, to: kind }, created: { from: null, to: next } },
      reason,
    })

    return { ok: true, item: next }
  },

  async deleteVehicleMasterItem({ actor, kind, id, reason }) {
    await simulateNetwork()
    const map = {
      make: { key: 'makes' },
      model: { key: 'models' },
      variant: { key: 'variants' },
      category: { key: 'categories' },
    }

    const cfg = map[kind]
    if (!cfg) throw new Error('Unsupported kind')

    const list = state.vehicleMaster[cfg.key]
    const idx = list.findIndex((x) => x.id === id)
    if (idx === -1) throw new Error('Item not found')

    const before = list[idx]
    list.splice(idx, 1)

    if (kind === 'category') {
      delete state.vehicleMaster.pricingByCategoryId[id]
      const removedMappingIds = state.vehicleMaster.mappings.filter((m) => m.categoryId === id).map((m) => m.id)
      state.vehicleMaster.mappings = state.vehicleMaster.mappings.filter((m) => m.categoryId !== id)
      for (const mid of removedMappingIds) delete state.vehicleMaster.mappingPricingByMappingId[mid]
    }

    if (kind === 'make') {
      const modelIds = state.vehicleMaster.models.filter((m) => m.makeId === id).map((m) => m.id)
      if (modelIds.length) {
        state.vehicleMaster.models = state.vehicleMaster.models.filter((m) => m.makeId !== id)
        state.vehicleMaster.variants = state.vehicleMaster.variants.filter((v) => !modelIds.includes(v.modelId))
        state.vehicleMaster.mappings = state.vehicleMaster.mappings.filter(
          (m) => m.makeId !== id && !modelIds.includes(m.modelId)
        )
      } else {
        state.vehicleMaster.mappings = state.vehicleMaster.mappings.filter((m) => m.makeId !== id)
      }
    }

    if (kind === 'model') {
      state.vehicleMaster.variants = state.vehicleMaster.variants.filter((v) => v.modelId !== id)
      state.vehicleMaster.mappings = state.vehicleMaster.mappings.filter((m) => m.modelId !== id)
    }

    if (kind === 'variant') {
      state.vehicleMaster.mappings = state.vehicleMaster.mappings.filter((m) => m.variantId !== id)
    }

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'vehicle_master', id },
      action: 'delete_vehicle_master_item',
      diff: { kind: { from: kind, to: null }, deleted: { from: before, to: null } },
      reason,
    })

    return { ok: true }
  },

  async setMappingPricing({ actor, mappingId, baseInr, distantAfterKm, distantExtraInr, reason }) {
    await simulateNetwork()
    const mapping = state.vehicleMaster.mappings.find((m) => m.id === mappingId)
    if (!mapping) throw new Error('Mapping not found')

    const nextBase = Number(baseInr)
    if (!Number.isFinite(nextBase) || nextBase < 0) throw new Error('Invalid base price')

    const nextKm = Number(distantAfterKm)
    if (!Number.isFinite(nextKm) || nextKm < 0) throw new Error('Invalid distance threshold')

    const nextExtra = Number(distantExtraInr)
    if (!Number.isFinite(nextExtra) || nextExtra < 0) throw new Error('Invalid extra price')

    const before = state.vehicleMaster.mappingPricingByMappingId[mappingId] ?? null
    const next = { baseInr: nextBase, distantAfterKm: nextKm, distantExtraInr: nextExtra }
    state.vehicleMaster.mappingPricingByMappingId[mappingId] = next

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'mapping_pricing', id: mappingId },
      action: 'set_mapping_pricing',
      diff: { before, after: next },
      reason,
    })

    return { ok: true }
  },

  async updateVehicleMasterItem({ actor, kind, id, patch, reason }) {
    await simulateNetwork()
    const map = {
      make: { key: 'makes' },
      model: { key: 'models' },
      variant: { key: 'variants' },
      category: { key: 'categories' },
    }

    const cfg = map[kind]
    if (!cfg) throw new Error('Unsupported kind')
    const list = state.vehicleMaster[cfg.key]

    const item = list.find((x) => x.id === id)
    if (!item) throw new Error('Item not found')

    const before = { ...item }
    const nextName = patch?.name !== undefined ? String(patch?.name || '').trim() : undefined
    if (nextName !== undefined) {
      if (!nextName) throw new Error('Name is required')
      if (list.some((x) => x.id !== id && String(x.name).toLowerCase() === nextName.toLowerCase())) throw new Error('Duplicate name')
      item.name = nextName
    }

    if (kind === 'model' && patch?.makeId !== undefined) {
      const nextMakeId = String(patch.makeId || '').trim()
      if (!nextMakeId) throw new Error('Make is required')
      if (!state.vehicleMaster.makes.some((m) => m.id === nextMakeId)) throw new Error('Make not found')

      const prevMakeId = item.makeId
      item.makeId = nextMakeId

      if (prevMakeId !== nextMakeId) {
        for (const m of state.vehicleMaster.mappings) {
          if (m.modelId === id) m.makeId = nextMakeId
        }
      }
    }

    if (kind === 'variant' && patch?.modelId !== undefined) {
      const nextModelId = String(patch.modelId || '').trim()
      if (!nextModelId) throw new Error('Model is required')
      const model = state.vehicleMaster.models.find((m) => m.id === nextModelId)
      if (!model) throw new Error('Model not found')

      const prevModelId = item.modelId
      item.modelId = nextModelId

      if (prevModelId !== nextModelId) {
        for (const m of state.vehicleMaster.mappings) {
          if (m.variantId === id) {
            m.modelId = nextModelId
            m.makeId = model.makeId
          }
        }
      }
    }

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'vehicle_master', id },
      action: 'update_vehicle_master_item',
      diff: { kind: { from: kind, to: kind }, before, after: { ...item } },
      reason,
    })

    return { ok: true, item }
  },

  async upsertVehicleMapping({ actor, condition, makeId, modelId, variantId, categoryId, reason }) {
    await simulateNetwork()

    const exists = (key, id) => state.vehicleMaster[key].some((x) => x.id === id)
    if (!exists('makes', makeId)) throw new Error('Make not found')
    if (!exists('models', modelId)) throw new Error('Model not found')
    if (!exists('variants', variantId)) throw new Error('Variant not found')
    if (!exists('categories', categoryId)) throw new Error('Category not found')

    const safeCondition = String(condition || '').trim()
    if (safeCondition !== 'new' && safeCondition !== 'pre_owned') throw new Error('Condition is required')

    const model = state.vehicleMaster.models.find((m) => m.id === modelId)
    if (model?.makeId && model.makeId !== makeId) throw new Error('Model does not belong to selected Make')
    const variant = state.vehicleMaster.variants.find((v) => v.id === variantId)
    if (variant?.modelId && variant.modelId !== modelId) throw new Error('Variant does not belong to selected Model')

    const existing = state.vehicleMaster.mappings.find(
      (m) => m.condition === safeCondition && m.makeId === makeId && m.modelId === modelId && m.variantId === variantId
    )

    if (existing) {
      const before = existing.categoryId
      existing.categoryId = categoryId
      recordAudit({
        actor,
        locationId: null,
        entity: { type: 'vehicle_mapping', id: existing.id },
        action: 'update_vehicle_mapping',
        diff: { categoryId: { from: before, to: categoryId } },
        reason,
      })
      return { ok: true, item: existing }
    }

    const id = `MAP-${String(1000 + Math.floor(Math.random() * 9000))}`
    const next = { id, condition: safeCondition, makeId, modelId, variantId, categoryId }
    state.vehicleMaster.mappings.unshift(next)

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'vehicle_mapping', id },
      action: 'create_vehicle_mapping',
      diff: { created: { from: null, to: next } },
      reason,
    })

    return { ok: true, item: next }
  },

  async deleteVehicleMapping({ actor, id, reason }) {
    await simulateNetwork()
    const idx = state.vehicleMaster.mappings.findIndex((m) => m.id === id)
    if (idx === -1) throw new Error('Mapping not found')
    const before = state.vehicleMaster.mappings[idx]
    state.vehicleMaster.mappings.splice(idx, 1)
    delete state.vehicleMaster.mappingPricingByMappingId[id]

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'vehicle_mapping', id },
      action: 'delete_vehicle_mapping',
      diff: { deleted: { from: before, to: null } },
      reason,
    })

    return { ok: true }
  },

  async updateVehicleMapping({ actor, id, patch, reason }) {
    await simulateNetwork()
    const item = state.vehicleMaster.mappings.find((m) => m.id === id)
    if (!item) throw new Error('Mapping not found')

    const before = { ...item }
    const next = { ...item, ...(patch || {}) }

    const exists = (key, _id) => state.vehicleMaster[key].some((x) => x.id === _id)
    const safeCondition = String(next.condition || '').trim()
    if (safeCondition !== 'new' && safeCondition !== 'pre_owned') throw new Error('Condition is required')
    if (!exists('makes', next.makeId)) throw new Error('Make not found')
    if (!exists('models', next.modelId)) throw new Error('Model not found')
    if (!exists('variants', next.variantId)) throw new Error('Variant not found')
    if (!exists('categories', next.categoryId)) throw new Error('Category not found')

    const model = state.vehicleMaster.models.find((m) => m.id === next.modelId)
    if (model?.makeId && model.makeId !== next.makeId) throw new Error('Model does not belong to selected Make')
    const variant = state.vehicleMaster.variants.find((v) => v.id === next.variantId)
    if (variant?.modelId && variant.modelId !== next.modelId) throw new Error('Variant does not belong to selected Model')

    Object.assign(item, { ...next, condition: safeCondition })

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'vehicle_mapping', id },
      action: 'update_vehicle_mapping',
      diff: { before, after: { ...item } },
      reason,
    })

    return { ok: true, item }
  },

  async setCategoryPricing({ actor, categoryId, priceInr, reason }) {
    await simulateNetwork()
    const cat = state.vehicleMaster.categories.find((c) => c.id === categoryId)
    if (!cat) throw new Error('Category not found')

    const next = Number(priceInr)
    if (!Number.isFinite(next) || next < 0) throw new Error('Invalid price')

    const before = state.vehicleMaster.pricingByCategoryId[categoryId] ?? null
    state.vehicleMaster.pricingByCategoryId[categoryId] = next

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'category_pricing', id: categoryId },
      action: 'set_category_pricing',
      diff: { priceInr: { from: before, to: next } },
      reason,
    })

    return { ok: true }
  },

  async getBootstrap() {
    await simulateNetwork()
    applySmallDrift()
    return {
      locations: state.locations,
      pricing: state.pricing,
      rbac: {
        roles: state.rbac.roles,
        users: state.rbac.users,
        permissionsByRole: state.rbac.permissionsByRole,
        permissionsByUser: state.rbac.permissionsByUser,
      },
    }
  },

  async getAccessControl() {
    await simulateNetwork()
    return {
      roles: state.rbac.roles,
      users: state.rbac.users,
      permissionsByRole: state.rbac.permissionsByRole,
      permissionsByUser: state.rbac.permissionsByUser,
    }
  },

  async createRole({ actor, roleId, name, reason }) {
    await simulateNetwork()
    const id = String(roleId || '').trim()
    if (!id) throw new Error('Role ID is required')
    if (state.rbac.roles.some((r) => r.id === id)) throw new Error('Role already exists')

    const role = { id, name: String(name || id) }
    state.rbac.roles.push(role)
    state.rbac.permissionsByRole[id] = defaultPermissions()

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_role', id },
      action: 'create_role',
      diff: { created: { from: null, to: role } },
      reason,
    })

    return { ok: true }
  },

  async updateUserPermissions({ actor, userId, permissions, reason }) {
    await simulateNetwork()
    const user = state.rbac.users.find((u) => u.userId === userId)
    if (!user) throw new Error('User not found')

    const before = state.rbac.permissionsByUser[userId] || {}
    const beforeCrud = before.crud || {}
    const next = {
      ...before,
      ...(permissions || {}),
      crud: {
        ...(beforeCrud || {}),
        ...((permissions || {}).crud || {}),
      },
    }
    state.rbac.permissionsByUser[userId] = next

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_user', id: userId },
      action: 'update_user_permissions',
      diff: { permissions: { from: before, to: next } },
      reason,
    })

    return { ok: true }
  },

  async updateRole({ actor, roleId, patch, reason }) {
    await simulateNetwork()
    const role = state.rbac.roles.find((r) => r.id === roleId)
    if (!role) throw new Error('Role not found')

    const before = { ...role }
    Object.assign(role, patch)

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_role', id: roleId },
      action: 'update_role',
      diff: { before, after: { ...role } },
      reason,
    })

    return { ok: true }
  },

  async deleteRole({ actor, roleId, reason }) {
    await simulateNetwork()
    if (roleId === roles.SUPER_ADMIN) throw new Error('Cannot delete Super Admin role')

    const idx = state.rbac.roles.findIndex((r) => r.id === roleId)
    if (idx === -1) throw new Error('Role not found')

    if (state.rbac.users.some((u) => u.role === roleId)) {
      throw new Error('Reassign users from this role before deleting')
    }

    const before = state.rbac.roles[idx]
    state.rbac.roles.splice(idx, 1)
    delete state.rbac.permissionsByRole[roleId]

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_role', id: roleId },
      action: 'delete_role',
      diff: { deleted: { from: before, to: null } },
      reason,
    })

    return { ok: true }
  },

  async updateRolePermissions({ actor, roleId, permissions, reason }) {
    await simulateNetwork()
    if (!state.rbac.roles.some((r) => r.id === roleId)) throw new Error('Role not found')
    const before = state.rbac.permissionsByRole[roleId] || defaultPermissions()
    const next = {
      ...before,
      ...(permissions || {}),
      crud: {
        ...(before.crud || defaultPermissions().crud),
        ...((permissions || {}).crud || {}),
      },
    }
    state.rbac.permissionsByRole[roleId] = next

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_role', id: roleId },
      action: 'update_role_permissions',
      diff: { permissions: { from: before, to: next } },
      reason,
    })

    return { ok: true }
  },

  async createUser({ actor, userId, name, roleId, email, phone, username, password, active, reason }) {
    await simulateNetwork()
    const id = String(userId || '').trim()
    if (!id) throw new Error('User ID is required')
    if (state.rbac.users.some((u) => u.userId === id)) throw new Error('User already exists')
    if (!state.rbac.roles.some((r) => r.id === roleId)) throw new Error('Role not found')

    const user = {
      userId: id,
      name: String(name || id),
      role: roleId,
      email: email ? String(email) : null,
      phone: phone ? String(phone) : null,
      username: username ? String(username) : id.toLowerCase(),
      password: password ? String(password) : 'admin123',
      active: typeof active === 'boolean' ? active : true,
    }
    state.rbac.users.push(user)

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_user', id },
      action: 'create_user',
      diff: { created: { from: null, to: user } },
      reason,
    })

    return { ok: true }
  },

  async updateUser({ actor, userId, patch, reason }) {
    await simulateNetwork()
    const user = state.rbac.users.find((u) => u.userId === userId)
    if (!user) throw new Error('User not found')

    const before = { ...user }
    Object.assign(user, patch)

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_user', id: userId },
      action: 'update_user',
      diff: { before, after: { ...user } },
      reason,
    })

    return { ok: true }
  },

  async deleteUser({ actor, userId, reason }) {
    await simulateNetwork()
    if (userId === 'USR-SA-1') throw new Error('Cannot delete Super Admin user')

    const idx = state.rbac.users.findIndex((u) => u.userId === userId)
    if (idx === -1) throw new Error('User not found')

    const before = state.rbac.users[idx]
    state.rbac.users.splice(idx, 1)

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_user', id: userId },
      action: 'delete_user',
      diff: { deleted: { from: before, to: null } },
      reason,
    })

    return { ok: true }
  },

  async assignUserRole({ actor, userId, roleId, reason }) {
    await simulateNetwork()
    const user = state.rbac.users.find((u) => u.userId === userId)
    if (!user) throw new Error('User not found')
    if (!state.rbac.roles.some((r) => r.id === roleId)) throw new Error('Role not found')

    const before = user.role
    user.role = roleId

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'rbac_user', id: userId },
      action: 'assign_user_role',
      diff: { role: { from: before, to: roleId } },
      reason,
    })

    return { ok: true }
  },

  async getDashboard({ locationId } = {}) {
    await simulateNetwork()
    applySmallDrift()

    return {
      kpi: kpi(locationId),
      trends: buildTrends(),
      queueLoad: buildQueueLoadByLocation(),
      vehicleRatio: buildVehicleTypeRatio(),
      alerts: buildAlerts(),
    }
  },

  async getQueue({ locationId, vehicleType } = {}) {
    await simulateNetwork()
    applySmallDrift()
    let items = state.queue
    if (locationId) items = items.filter((q) => q.locationId === locationId)
    if (vehicleType) items = items.filter((q) => q.vehicleType === vehicleType)

    return {
      items,
      inspectors: state.inspectors,
      locations: state.locations,
    }
  },

  async getInspectors({ locationId } = {}) {
    await simulateNetwork()
    applySmallDrift()

    let items = state.inspectors
    if (locationId) items = items.filter((i) => i.locationIds.includes(locationId))

    return { items, locations: state.locations }
  },

  async getInspectorLeaveRequests() {
    await simulateNetwork()
    applySmallDrift()

    const items = state.inspectorLeaveRequests
    return { items, inspectors: state.inspectors }
  },

  // Mobile app: create leave request
  async submitInspectorLeaveRequest({ inspectorId, fromDate, toDate, reason }) {
    await simulateNetwork()
    const inspector = state.inspectors.find((i) => i.id === inspectorId)
    if (!inspector) throw new Error('Inspector not found')

    const fd = String(fromDate || '').trim()
    const td = String(toDate || '').trim()
    if (!fd || !td) throw new Error('Leave dates are required')

    const cleanedReason = String(reason || '').trim()
    if (!cleanedReason) throw new Error('Reason is required')

    const id = `LVR-${String(1000 + Math.floor(Math.random() * 9000))}`
    const next = {
      id,
      inspectorId,
      fromDate: fd,
      toDate: td,
      reason: cleanedReason,
      status: 'pending',
      requestedAt: nowIso(),
      decidedAt: null,
      rejectionReason: null,
    }

    state.inspectorLeaveRequests.unshift(next)
    return { ok: true, item: next }
  },

  async approveInspectorLeaveRequest({ actor, requestId, reason }) {
    await simulateNetwork()
    const item = state.inspectorLeaveRequests.find((x) => x.id === requestId)
    if (!item) throw new Error('Leave request not found')
    if (item.status !== 'pending') throw new Error('Only pending requests can be approved')

    const beforeStatus = item.status
    const beforeDecidedAt = item.decidedAt
    const beforeRejectionReason = item.rejectionReason
    item.status = 'approved'
    item.decidedAt = nowIso()
    item.rejectionReason = null

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'inspector_leave_request', id: item.id },
      action: 'approve_leave_request',
      diff: {
        status: { from: beforeStatus, to: 'approved' },
        decidedAt: { from: beforeDecidedAt, to: item.decidedAt },
        rejectionReason: { from: beforeRejectionReason, to: null },
      },
      reason: String(reason || '').trim() || 'Approved',
    })

    return { ok: true }
  },

  async rejectInspectorLeaveRequest({ actor, requestId, reason }) {
    await simulateNetwork()
    const item = state.inspectorLeaveRequests.find((x) => x.id === requestId)
    if (!item) throw new Error('Leave request not found')
    if (item.status !== 'pending') throw new Error('Only pending requests can be rejected')

    const cleanedReason = String(reason || '').trim()
    if (!cleanedReason) throw new Error('Rejection reason is required')

    const beforeStatus = item.status
    const beforeDecidedAt = item.decidedAt
    const beforeRejectionReason = item.rejectionReason
    item.status = 'rejected'
    item.decidedAt = nowIso()
    item.rejectionReason = cleanedReason

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'inspector_leave_request', id: item.id },
      action: 'reject_leave_request',
      diff: {
        status: { from: beforeStatus, to: 'rejected' },
        decidedAt: { from: beforeDecidedAt, to: item.decidedAt },
        rejectionReason: { from: beforeRejectionReason, to: cleanedReason },
      },
      reason: cleanedReason,
    })

    return { ok: true }
  },

  async getCommissions({ locationId } = {}) {
    await simulateNetwork()
    applySmallDrift()

    let items = state.commissions
    if (locationId) items = items.filter((c) => c.locationId === locationId)

    return { items, inspectors: state.inspectors, locations: state.locations, pricing: state.pricing }
  },

  async setQueueStatus({ actor, pdiId, status, reason }) {
    await simulateNetwork()
    const item = state.queue.find((q) => q.id === pdiId)
    if (!item) throw new Error('Queue item not found')

    const allowed = ['pending', 'in_progress', 'postponed', 'closed']
    if (!allowed.includes(status)) throw new Error('Invalid status')

    if (status === 'closed' && !item.paymentAt) {
      throw new Error('Payment required before closing')
    }

    const before = item.status
    item.status = status
    if (status === 'closed') item.closedAt = nowIso()
    if (status !== 'closed') item.closedAt = null
    if (status === 'pending') item.assignedInspectorId = null

    recordAudit({
      actor,
      locationId: item.locationId,
      entity: { type: 'queue_item', id: item.id },
      action: 'set_status',
      diff: { status: { from: before, to: status } },
      reason,
    })

    return { ok: true }
  },

  async recordPayment({ actor, pdiId, reason }) {
    await simulateNetwork()
    const item = state.queue.find((q) => q.id === pdiId)
    if (!item) throw new Error('Queue item not found')

    const before = item.paymentAt
    if (!item.paymentAt) item.paymentAt = nowIso()

    const existing = state.commissions.find((c) => c.pdiId === pdiId)
    if (!existing) {
      const inspectorId = item.assignedInspectorId
      if (!inspectorId) throw new Error('Assign inspector before payment')
      state.commissions.unshift({
        id: `COM-${9000 + Math.floor(Math.random() * 8000)}`,
        inspectorId,
        locationId: item.locationId,
        pdiId: item.id,
        visitAt: nowIso(),
        amountInr: computeCommissionAmount(item),
        status: 'pending',
        paymentAt: item.paymentAt,
      })
    }

    recordAudit({
      actor,
      locationId: item.locationId,
      entity: { type: 'queue_item', id: item.id },
      action: 'record_payment',
      diff: { paymentAt: { from: before, to: item.paymentAt } },
      reason,
    })

    return { ok: true }
  },

  async overrideCommission({ actor, pdiId, amountInr, reason }) {
    await simulateNetwork()
    const item = state.queue.find((q) => q.id === pdiId)
    if (!item) throw new Error('Queue item not found')

    const before = item.commissionOverrideInr
    item.commissionOverrideInr = Number(amountInr)

    const commission = state.commissions.find((c) => c.pdiId === pdiId)
    if (commission) {
      commission.amountInr = Number(amountInr)
    }

    recordAudit({
      actor,
      locationId: item.locationId,
      entity: { type: 'commission', id: commission?.id || pdiId },
      action: 'override_commission',
      diff: { amountInr: { from: before, to: Number(amountInr) } },
      reason,
    })

    return { ok: true }
  },

  async approveCommission({ actor, commissionId, reason }) {
    await simulateNetwork()
    const c = state.commissions.find((x) => x.id === commissionId)
    if (!c) throw new Error('Commission not found')

    const before = c.status
    c.status = 'approved'

    recordAudit({
      actor,
      locationId: c.locationId,
      entity: { type: 'commission', id: c.id },
      action: 'approve_commission',
      diff: { status: { from: before, to: 'approved' } },
      reason,
    })

    return { ok: true }
  },

  async autoAssign({ actor, locationId, vehicleType, reason }) {
    await simulateNetwork()
    const queue = state.queue
      .filter((q) => q.status === 'pending')
      .filter((q) => (!locationId ? true : q.locationId === locationId))
      .filter((q) => (!vehicleType ? true : q.vehicleType === vehicleType))

    const byPriority = { P0: 0, P1: 1, P2: 2, P3: 3 }
    queue.sort((a, b) => (byPriority[a.priority] ?? 9) - (byPriority[b.priority] ?? 9))

    let assigned = 0

    for (const item of queue) {
      const eligible = state.inspectors
        .filter((i) => i.active)
        .filter((i) => i.locationIds.includes(item.locationId))
        .filter((i) => i.skills.includes(item.vehicleType))
        .filter((i) => i.state === 'idle')

      if (eligible.length === 0) continue

      eligible.sort((a, b) => (a.utilizationPct ?? 0) - (b.utilizationPct ?? 0))
      const pick = eligible[0]

      const before = item.assignedInspectorId
      item.assignedInspectorId = pick.id
      item.status = 'in_progress'
      pick.state = 'busy'
      pick.lastStateChangeAt = nowIso()

      recordAudit({
        actor,
        locationId: item.locationId,
        entity: { type: 'queue_item', id: item.id },
        action: 'auto_assign',
        diff: { assignedInspectorId: { from: before, to: pick.id } },
        reason,
        correlationId: `AUTO-${Date.now()}`,
      })

      assigned += 1
    }

    return { ok: true, assigned }
  },

  async createInspector({ actor, inspector, reason }) {
    await simulateNetwork()
    const name = String(inspector?.name || '').trim()
    const phone = String(inspector?.phone || '').trim()
    const email = String(inspector?.email || '').trim()
    const joinDate = String(inspector?.joinDate || '').trim()
    const employmentType = String(inspector?.employmentType || '').trim()
    const status = String(inspector?.status || '').trim()
    const profilePhotoUrl = String(inspector?.profilePhotoUrl || '').trim()
    const providedId = String(inspector?.id || '').trim()

    if (!name) throw new Error('Full name is required')
    if (!phone) throw new Error('Mobile number is required')
    if (!email) throw new Error('Email is required')
    if (!joinDate) throw new Error('Date of joining is required')
    if (!employmentType) throw new Error('Employment type is required')
    if (!['full_time', 'contract', 'freelancer'].includes(employmentType)) throw new Error('Invalid employment type')
    if (!['active', 'inactive', 'suspended'].includes(status)) throw new Error('Invalid status')

    const id = providedId || generateInspectorId()
    if (state.inspectors.some((i) => i.id === id)) throw new Error('Inspector ID already exists')
    const next = {
      id,
      name,
      phone,
      email,
      profilePhotoUrl,
      joinDate,
      employmentType,
      status,
      locationIds: inspector.locationIds || [],
      active: status === 'active',
      skills: inspector.skills || ['new', 'pre_owned'],
      utilizationPct: 10 + Math.floor(Math.random() * 60),
      lastStateChangeAt: nowIso(),
      state: 'idle',
    }

    state.inspectors.unshift(next)

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'inspector', id },
      action: 'create_inspector',
      diff: { created: { from: null, to: next } },
      reason,
    })

    return { ok: true, item: next }
  },

  async updateInspector({ actor, inspectorId, patch, reason }) {
    await simulateNetwork()
    const item = state.inspectors.find((i) => i.id === inspectorId)
    if (!item) throw new Error('Inspector not found')

    const next = { ...item, ...(patch || {}) }
    const name = String(next.name || '').trim()
    const phone = String(next.phone || '').trim()
    const email = String(next.email || '').trim()
    const joinDate = String(next.joinDate || '').trim()
    const employmentType = String(next.employmentType || '').trim()
    const status = String(next.status || '').trim()
    const profilePhotoUrl = String(next.profilePhotoUrl || '').trim()

    if (!name) throw new Error('Full name is required')
    if (!phone) throw new Error('Mobile number is required')
    if (!email) throw new Error('Email is required')
    if (!joinDate) throw new Error('Date of joining is required')
    if (!employmentType) throw new Error('Employment type is required')
    if (!['full_time', 'contract', 'freelancer'].includes(employmentType)) throw new Error('Invalid employment type')
    if (!['active', 'inactive', 'suspended'].includes(status)) throw new Error('Invalid status')

    const beforeName = item.name
    const beforePhone = item.phone
    const beforeEmail = item.email
    const beforeJoinDate = item.joinDate
    const beforeEmploymentType = item.employmentType
    const beforeStatus = item.status
    const beforeProfilePhotoUrl = item.profilePhotoUrl
    const beforeActive = item.active

    Object.assign(item, {
      ...next,
      name,
      phone,
      email,
      joinDate,
      employmentType,
      status,
      profilePhotoUrl,
      active: status === 'active',
    })

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'inspector', id: inspectorId },
      action: 'update_inspector',
      diff: {
        name: { from: beforeName, to: item.name },
        phone: { from: beforePhone, to: item.phone },
        email: { from: beforeEmail, to: item.email },
        joinDate: { from: beforeJoinDate, to: item.joinDate },
        employmentType: { from: beforeEmploymentType, to: item.employmentType },
        status: { from: beforeStatus, to: item.status },
        profilePhotoUrl: { from: beforeProfilePhotoUrl, to: item.profilePhotoUrl },
        active: { from: beforeActive, to: item.active },
      },
      reason,
    })

    return { ok: true }
  },

  async getAudit({ locationId } = {}) {
    await simulateNetwork()
    applySmallDrift()

    let items = state.audit
    if (locationId) items = items.filter((a) => a.locationId === locationId)

    return { items, locations: state.locations }
  },

  async setPriority({ actor, pdiId, priority, reason }) {
    await simulateNetwork()
    const item = state.queue.find((q) => q.id === pdiId)
    if (!item) throw new Error('Queue item not found')

    const before = item.priority
    item.priority = priority

    recordAudit({
      actor,
      locationId: item.locationId,
      entity: { type: 'queue_item', id: item.id },
      action: 'set_priority',
      diff: { priority: { from: before, to: priority } },
      reason,
    })

    return { ok: true }
  },

  async assignInspector({ actor, pdiId, inspectorId, reason }) {
    await simulateNetwork()
    const item = state.queue.find((q) => q.id === pdiId)
    if (!item) throw new Error('Queue item not found')

    const before = item.assignedInspectorId
    item.assignedInspectorId = inspectorId
    if (inspectorId) item.status = 'in_progress'
    if (!inspectorId && item.status === 'in_progress') item.status = 'pending'

    recordAudit({
      actor,
      locationId: item.locationId,
      entity: { type: 'queue_item', id: item.id },
      action: inspectorId ? 'manual_assign' : 'manual_unassign',
      diff: { assignedInspectorId: { from: before, to: inspectorId } },
      reason,
    })

    return { ok: true }
  },

  async overridePrice({ actor, pdiId, newPriceInr, reason }) {
    await simulateNetwork()
    const item = state.queue.find((q) => q.id === pdiId)
    if (!item) throw new Error('Queue item not found')

    const before = item.priceInr
    item.priceInr = newPriceInr

    recordAudit({
      actor,
      locationId: item.locationId,
      entity: { type: 'queue_item', id: item.id },
      action: 'override_price',
      diff: { priceInr: { from: before, to: newPriceInr } },
      reason,
    })

    return { ok: true }
  },

  async setDefaultPricing({ actor, defaultInr, reason }) {
    await simulateNetwork()
    const before = state.pricing.defaultInr
    state.pricing.defaultInr = defaultInr

    recordAudit({
      actor,
      locationId: null,
      entity: { type: 'pricing', id: 'DEFAULT' },
      action: 'set_default_pricing',
      diff: { defaultInr: { from: before, to: defaultInr } },
      reason,
    })

    return { ok: true }
  },
}
