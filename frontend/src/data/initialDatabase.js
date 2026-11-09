// ============================================================================
// SEPARATE NORMALIZED DATABASE TABLES (FRONTEND SEED DATA)
// Grades: 'Non-Manual' (Engineers/Foremen) and 'Manual' (Labor)
// ============================================================================

export const INITIAL_USERS = [
  {
    id: 'u-1',
    staffId: 'ADM-001',
    name: 'Lohith Kamineni',
    email: 'admin@al-dhow.com',
    passwordHash: 'AdminPassword123!',
    title: 'Camp Systems Director',
    role: 'SUPER_ADMIN',
    campScope: 'ALL',
    status: 'Active',
    permissions: {
      canManageUsers: true,
      canAddCamps: true,
      canDeleteCamps: true,
      canEditOccupants: true,
      canExportReports: true,
      canApproveTransfers: true,
    },
    lastLogin: '2026-11-08 09:00 AM'
  },
  {
    id: 'u-2',
    staffId: 'EDT-014',
    name: 'Tariq Al-Mansoor',
    email: 'tariq@al-dhow.com',
    passwordHash: 'EditorPassword123!',
    title: 'Camp Operations Supervisor',
    role: 'CAMP_EDITOR',
    campScope: 'CAMP-01',
    status: 'Active',
    permissions: {
      canManageUsers: false,
      canAddCamps: false,
      canDeleteCamps: true,
      canEditOccupants: true,
      canExportReports: true,
      canApproveTransfers: false,
    },
    lastLogin: '2026-11-07 04:15 PM'
  },
  {
    id: 'u-3',
    staffId: 'AUD-009',
    name: 'Nadia Al-Sabah',
    email: 'nadia@al-dhow.com',
    passwordHash: 'ViewerPassword123!',
    title: 'HR & Finance Compliance Auditor',
    role: 'AUDITOR',
    campScope: 'ALL',
    status: 'Active',
    permissions: {
      canManageUsers: false,
      canAddCamps: false,
      canDeleteCamps: false,
      canEditOccupants: false,
      canExportReports: true,
      canApproveTransfers: true,
    },
    lastLogin: '2026-11-07 11:30 AM'
  }
];

export const INITIAL_COST_CENTERS = [
  { id: 'cc-1', code: '1IDS038-KIPIC', name: 'KIPIC Al-Zour Refinery Site', division: 'IDS', status: 'Active' },
  { id: 'cc-2', code: '1IDS051-KNPC', name: 'KNPC Clean Fuels Project', division: 'IDS', status: 'Active' },
  { id: 'cc-3', code: '1MEP019-KNPC', name: 'KNPC Electrical & Mechanical Maintenance', division: 'MEP', status: 'Active' },
  { id: 'cc-4', code: '1CIV011-KOC', name: 'KOC Heavy Civil & Pipeline Works', division: 'CIVIL', status: 'Active' },
  { id: 'cc-5', code: '1CIV014-MEW', name: 'MEW Substation Infrastructure', division: 'CIVIL', status: 'Active' }
];

// Helper to generate the 10-Floor Tower where Floor 1 has 2 flats and Floors 2-10 have 3 flats
function generateTenFloorCamp() {
  const floors = [];
  for (let f = 1; f <= 10; f++) {
    const flatsCount = f === 1 ? 2 : 3; // Floor 1 = 2 flats, Floors 2-10 = 3 flats!
    const flStr = String(f).padStart(2, '0');
    const flats = [];
    for (let fl = 1; fl <= flatsCount; fl++) {
      const flatStr = String(fl).padStart(2, '0');
      const isNonManual = f === 1 && fl === 1;
      const grade = isNonManual ? 'Non-Manual' : 'Manual';
      const suffix = isNonManual ? 'NM' : 'M';
      const cap = isNonManual ? 2 : 3;
      const flatCode = `3-${flStr}-${flatStr}-${suffix}`;
      flats.push({
        flatNo: fl,
        flatCode,
        roomGrade: grade,
        rooms: [
          { roomNo: `3-${flStr}-${flatStr}-A`, capacity: cap, occupants: [] },
          { roomNo: `3-${flStr}-${flatStr}-B`, capacity: cap, occupants: [] },
          { roomNo: `3-${flStr}-${flatStr}-C`, capacity: cap, occupants: [] }
        ]
      });
    }
    floors.push({ floorNo: f, flats });
  }
  return floors;
}

export const INITIAL_CAMPS = [
  {
    id: 'camp-1',
    campNo: 'CAMP-01',
    campArea: 'Farwaniya 1',
    costCenter: '1ACD000',
    campDigit: '1',
    campStartDate: '2021-06-15',
    status: 'Active',
    floors: [
      {
        floorNo: 1,
        flats: [
          {
            flatNo: 1,
            flatCode: '1-01-01-NM',
            roomGrade: 'Non-Manual',
            rooms: [
              { roomNo: '1-01-01-A', capacity: 2, occupants: ['5838', '6104'] },
              { roomNo: '1-01-01-B', capacity: 2, occupants: ['6290'] },
              { roomNo: '1-01-01-C', capacity: 2, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '1-01-02-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '1-01-02-A', capacity: 3, occupants: ['5912'] },
              { roomNo: '1-01-02-B', capacity: 3, occupants: [] },
              { roomNo: '1-01-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '1-01-03-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '1-01-03-A', capacity: 3, occupants: [] },
              { roomNo: '1-01-03-B', capacity: 3, occupants: [] },
              { roomNo: '1-01-03-C', capacity: 3, occupants: [] },
            ]
          }
        ]
      },
      {
        floorNo: 2,
        flats: [
          {
            flatNo: 1,
            flatCode: '1-02-01-NM',
            roomGrade: 'Non-Manual',
            rooms: [
              { roomNo: '1-02-01-A', capacity: 2, occupants: ['7101', '7102'] },
              { roomNo: '1-02-01-B', capacity: 2, occupants: ['7103', '7104'] },
              { roomNo: '1-02-01-C', capacity: 2, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '1-02-02-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '1-02-02-A', capacity: 3, occupants: [] },
              { roomNo: '1-02-02-B', capacity: 3, occupants: [] },
              { roomNo: '1-02-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '1-02-03-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '1-02-03-A', capacity: 3, occupants: [] },
              { roomNo: '1-02-03-B', capacity: 3, occupants: [] },
              { roomNo: '1-02-03-C', capacity: 3, occupants: [] },
            ]
          }
        ]
      },
      {
        floorNo: 3,
        flats: [
          {
            flatNo: 1,
            flatCode: '1-03-01-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '1-03-01-A', capacity: 3, occupants: ['8201', '8202'] },
              { roomNo: '1-03-01-B', capacity: 3, occupants: [] },
              { roomNo: '1-03-01-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '1-03-02-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '1-03-02-A', capacity: 3, occupants: [] },
              { roomNo: '1-03-02-B', capacity: 3, occupants: [] },
              { roomNo: '1-03-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '1-03-03-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '1-03-03-A', capacity: 3, occupants: [] },
              { roomNo: '1-03-03-B', capacity: 3, occupants: [] },
              { roomNo: '1-03-03-C', capacity: 3, occupants: [] },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'camp-2',
    campNo: 'CAMP-02',
    campArea: 'Mahboula Block B',
    costCenter: '1ACD000',
    campDigit: '2',
    campStartDate: '2023-01-10',
    status: 'Active',
    floors: [
      {
        floorNo: 1,
        flats: [
          {
            flatNo: 1,
            flatCode: '2-01-01-NM',
            roomGrade: 'Non-Manual',
            rooms: [
              { roomNo: '2-01-01-A', capacity: 2, occupants: ['9011'] },
              { roomNo: '2-01-01-B', capacity: 2, occupants: [] },
              { roomNo: '2-01-01-C', capacity: 2, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '2-01-02-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '2-01-02-A', capacity: 3, occupants: [] },
              { roomNo: '2-01-02-B', capacity: 3, occupants: [] },
              { roomNo: '2-01-02-C', capacity: 3, occupants: [] },
            ]
          }
        ]
      },
      {
        floorNo: 2,
        flats: [
          {
            flatNo: 1,
            flatCode: '2-02-01-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '2-02-01-A', capacity: 3, occupants: [] },
              { roomNo: '2-02-01-B', capacity: 3, occupants: [] },
              { roomNo: '2-02-01-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '2-02-02-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '2-02-02-A', capacity: 3, occupants: [] },
              { roomNo: '2-02-02-B', capacity: 3, occupants: [] },
              { roomNo: '2-02-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '2-02-03-M',
            roomGrade: 'Manual',
            rooms: [
              { roomNo: '2-02-03-A', capacity: 3, occupants: [] },
              { roomNo: '2-02-03-B', capacity: 3, occupants: [] },
              { roomNo: '2-02-03-C', capacity: 3, occupants: [] },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'camp-3',
    campNo: 'CAMP-03',
    campArea: 'Mangaf 10-Story Tower (Floor 1: 2 Flats, Floors 2-10: 3 Flats)',
    costCenter: '1ACD000',
    campDigit: '3',
    campStartDate: '2024-03-01',
    status: 'Active',
    floors: generateTenFloorCamp()
  }
];

export const INITIAL_OCCUPANTS = [
  {
    srNo: 1,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'IDS',
    costCenter: '1IDS038-KIPIC',
    employeeId: '5838',
    afrEntryRef: 'AFR-2022-041',
    employeeName: 'Amr Mohamed Mohamed Ali Abdellbaki',
    nationality: 'Egypt',
    title: 'Civil Foreman',
    productivityType: 'DE',
    entryDate: '2022-04-10',
    passportNo: 'A23757909',
    civilId: '295022004812',
    roomGrade: 'Non-Manual',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 1,
    flatCode: '1-01-01-NM',
    roomNo: '1-01-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 9876 5432',
    emergencyContactName: 'Mohamed Ali Abdellbaki (Father)',
    emergencyContactPhone: '+20 100 234 5678',
    homeCountryAddress: '14 El-Tahrir St, Dokki, Giza, Cairo, Egypt',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-5838',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1IDS051',
    exitDate: '',
    afrExitRef: '',
    remarks: 'Master Record Row 3',
    stayHistory: [
      {
        campNo: 'CAMP-01',
        campArea: 'Farwaniya 1',
        flatCode: '1-02-01-NM',
        roomNo: '1-02-01-A',
        roomGrade: 'Non-Manual',
        costCenter: '1IDS038-KIPIC',
        startDate: '2022-04-10',
        endDate: '2023-09-15',
        reason: 'Initial AFR Bed Allocation on Joining'
      },
      {
        campNo: 'CAMP-02',
        campArea: 'Mahboula Block B',
        flatCode: '2-01-01-NM',
        roomNo: '2-01-01-B',
        roomGrade: 'Non-Manual',
        costCenter: '1IDS051-KNPC',
        startDate: '2023-09-15',
        endDate: '2024-03-01',
        reason: 'Relocated to Mahboula Project Site'
      }
    ]
  },
  {
    srNo: 2,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'IDS',
    costCenter: '1IDS038-KIPIC',
    employeeId: '6104',
    afrEntryRef: 'AFR-2023-102',
    employeeName: 'Tariq Mahmoud El-Sayed Hassan',
    nationality: 'Egypt',
    title: 'Senior Project Engineer',
    productivityType: 'DE',
    entryDate: '2023-02-14',
    passportNo: 'A30948122',
    civilId: '292051408821',
    roomGrade: 'Non-Manual',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 1,
    flatCode: '1-01-01-NM',
    roomNo: '1-01-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 9911 2233',
    emergencyContactName: 'Salma El-Sayed (Spouse)',
    emergencyContactPhone: '+20 112 987 6543',
    homeCountryAddress: '88 Corniche El-Nil, Smouha, Alexandria, Egypt',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-6104',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1IDS051',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  },
  {
    srNo: 3,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'MEP',
    costCenter: '1MEP019-KNPC',
    employeeId: '6290',
    afrEntryRef: 'AFR-2023-215',
    employeeName: 'Rajesh Kumar Nair',
    nationality: 'India',
    title: 'Electrical Engineer',
    productivityType: 'DE',
    entryDate: '2023-06-01',
    passportNo: 'V8829104',
    civilId: '291081504991',
    roomGrade: 'Non-Manual',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 1,
    flatCode: '1-01-01-NM',
    roomNo: '1-01-01-B',
    employeeStatus: 'On Job',
    mobileNo: '+965 6543 2109',
    emergencyContactName: 'Anitha Nair (Spouse)',
    emergencyContactPhone: '+91 98470 11223',
    homeCountryAddress: 'TC 24/190, Sasthamangalam, Trivandrum, Kerala 695010, India',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-6290',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1MEP019',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  },
  {
    srNo: 4,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'CIVIL',
    costCenter: '1CIV011-KOC',
    employeeId: '5912',
    afrEntryRef: 'AFR-2022-890',
    employeeName: 'Syed Tanveer Hussain',
    nationality: 'Pakistan',
    title: 'QA/QC Inspector',
    productivityType: 'DE',
    entryDate: '2022-11-20',
    passportNo: 'PK4491823',
    civilId: '290121003412',
    roomGrade: 'Manual',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 2,
    flatCode: '1-01-02-M',
    roomNo: '1-01-02-A',
    employeeStatus: 'On Leave',
    mobileNo: '+965 5012 3456',
    emergencyContactName: 'Syed Tariq Hussain (Brother)',
    emergencyContactPhone: '+92 300 4567890',
    homeCountryAddress: 'House 42, Block F, Model Town, Lahore, Punjab, Pakistan',
    leaveStartDate: '2026-10-20',
    leaveEndDate: '2026-11-25',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-5912',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1CIV011',
    exitDate: '',
    afrExitRef: '',
    remarks: 'Annual Vacation',
    stayHistory: []
  },
  {
    srNo: 5,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'MEP',
    costCenter: '1MEP019-KNPC',
    employeeId: '7101',
    afrEntryRef: 'AFR-2024-011',
    employeeName: 'Biju Mathew Varghese',
    nationality: 'India',
    title: 'HVAC Foreman',
    productivityType: 'DE',
    entryDate: '2024-01-12',
    passportNo: 'M7712390',
    civilId: '293040501928',
    roomGrade: 'Non-Manual',
    campArea: 'Farwaniya 1',
    floorNo: 2,
    flatNo: 1,
    flatCode: '1-02-01-NM',
    roomNo: '1-02-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 6677 8899',
    emergencyContactName: 'Mathew Varghese (Father)',
    emergencyContactPhone: '+91 94471 88990',
    homeCountryAddress: 'Puthenpurackal House, Kottayam, Kerala 686001, India',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-7101',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1MEP019',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  },
  {
    srNo: 6,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'MEP',
    costCenter: '1MEP019-KNPC',
    employeeId: '7102',
    afrEntryRef: 'AFR-2024-012',
    employeeName: 'Arunachalam Palanisamy',
    nationality: 'India',
    title: 'Piping Foreman',
    productivityType: 'DE',
    entryDate: '2024-01-15',
    passportNo: 'N8834120',
    civilId: '294071902381',
    roomGrade: 'Non-Manual',
    campArea: 'Farwaniya 1',
    floorNo: 2,
    flatNo: 1,
    flatCode: '1-02-01-NM',
    roomNo: '1-02-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 6611 0022',
    emergencyContactName: 'Lakshmi Palanisamy (Mother)',
    emergencyContactPhone: '+91 98422 33445',
    homeCountryAddress: '12 Gandhi Road, Peelamedu, Coimbatore, Tamil Nadu 641004, India',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-7102',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1MEP019',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  },
  {
    srNo: 7,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'CIVIL',
    costCenter: '1CIV011-KOC',
    employeeId: '7103',
    afrEntryRef: 'AFR-2024-045',
    employeeName: 'Ibrahim Khalil Al-Masri',
    nationality: 'Egypt',
    title: 'Rigging Supervisor',
    productivityType: 'DE',
    entryDate: '2024-02-10',
    passportNo: 'A4412983',
    civilId: '296012008471',
    roomGrade: 'Non-Manual',
    campArea: 'Farwaniya 1',
    floorNo: 2,
    flatNo: 1,
    flatCode: '1-02-01-NM',
    roomNo: '1-02-01-B',
    employeeStatus: 'On Job',
    mobileNo: '+965 9771 3344',
    emergencyContactName: 'Khalil Al-Masri (Father)',
    emergencyContactPhone: '+20 101 555 9090',
    homeCountryAddress: '23 Port Said St, Mansoura, Dakahlia, Egypt',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-7103',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1CIV011',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  },
  {
    srNo: 8,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'IDS',
    costCenter: '1IDS038-KIPIC',
    employeeId: '7104',
    afrEntryRef: 'AFR-2024-052',
    employeeName: 'Ramesh Babu Konda',
    nationality: 'India',
    title: 'Scaffolding Foreman',
    productivityType: 'DE',
    entryDate: '2024-02-18',
    passportNo: 'P9920184',
    civilId: '295110203948',
    roomGrade: 'Non-Manual',
    campArea: 'Farwaniya 1',
    floorNo: 2,
    flatNo: 1,
    flatCode: '1-02-01-NM',
    roomNo: '1-02-01-B',
    employeeStatus: 'On Job',
    mobileNo: '+965 6099 8877',
    emergencyContactName: 'Padma Konda (Spouse)',
    emergencyContactPhone: '+91 98480 55667',
    homeCountryAddress: 'H.No 4-12/8, Benz Circle, Vijayawada, Andhra Pradesh 520010, India',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-7104',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1IDS038',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  },
  {
    srNo: 9,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'CIVIL',
    costCenter: '1CIV011-KOC',
    employeeId: '8201',
    afrEntryRef: 'AFR-2024-110',
    employeeName: 'Mohammad Farooq Khan',
    nationality: 'Pakistan',
    title: 'Steel Fixer',
    productivityType: 'DE',
    entryDate: '2024-03-01',
    passportNo: 'PK9012384',
    civilId: '298110502394',
    roomGrade: 'Manual',
    campArea: 'Farwaniya 1',
    floorNo: 3,
    flatNo: 1,
    flatCode: '1-03-01-M',
    roomNo: '1-03-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 5544 3322',
    emergencyContactName: 'Ahmed Khan (Brother)',
    emergencyContactPhone: '+92 312 9988776',
    homeCountryAddress: 'Street 7, Saddar Bazar, Rawalpindi, Punjab, Pakistan',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-8201',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1CIV011',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  },
  {
    srNo: 10,
    campNo: 'CAMP-01',
    status: 'Permanent',
    division: 'CIVIL',
    costCenter: '1CIV011-KOC',
    employeeId: '8202',
    afrEntryRef: 'AFR-2024-112',
    employeeName: 'Sanjay Kumar Yadav',
    nationality: 'India',
    title: 'Mason',
    productivityType: 'DE',
    entryDate: '2024-03-05',
    passportNo: 'T1129384',
    civilId: '297061209182',
    roomGrade: 'Manual',
    campArea: 'Farwaniya 1',
    floorNo: 3,
    flatNo: 1,
    flatCode: '1-03-01-M',
    roomNo: '1-03-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 5588 7766',
    emergencyContactName: 'Ramesh Yadav (Father)',
    emergencyContactPhone: '+91 99350 44332',
    homeCountryAddress: 'Vill. Rampur, Post Sohawal, Dist. Ayodhya, Uttar Pradesh 224188, India',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-8202',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1CIV011',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  },
  {
    srNo: 11,
    campNo: 'CAMP-02',
    status: 'Permanent',
    division: 'IDS',
    costCenter: '1IDS038-KIPIC',
    employeeId: '9011',
    afrEntryRef: 'AFR-2024-205',
    employeeName: 'Karamjit Singh Gill',
    nationality: 'India',
    title: 'Mechanical Engineer',
    productivityType: 'DE',
    entryDate: '2024-04-12',
    passportNo: 'Z5540192',
    civilId: '292092201847',
    roomGrade: 'Non-Manual',
    campArea: 'Mahboula Block B',
    floorNo: 1,
    flatNo: 1,
    flatCode: '2-01-01-NM',
    roomNo: '2-01-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 6789 0123',
    emergencyContactName: 'Harpreet Kaur Gill (Spouse)',
    emergencyContactPhone: '+91 98140 77889',
    homeCountryAddress: '458 Model Town Extension, Ludhiana, Punjab 141002, India',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    rtdType: '',
    rtdDate: '',
    afrLogNo: 'LOG-9011',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1IDS038',
    exitDate: '',
    afrExitRef: '',
    remarks: '',
    stayHistory: []
  }
];

export const INITIAL_LEAVE_LOGS = [
  {
    id: 'lv-101',
    employeeId: '5912',
    employeeName: 'Syed Tanveer Hussain',
    campNo: 'CAMP-01',
    roomNo: '1-01-02-A',
    leaveStartDate: '2026-10-20',
    expectedEndDate: '2026-11-25',
    actualReturnDate: '',
    afrLogNo: 'LOG-5912',
    remarks: 'Annual Vacation to Lahore',
    status: 'Active Leave',
    createdBy: 'Lohith Kamineni',
    createdAt: '2026-10-20T08:30:00Z'
  }
];

export const INITIAL_RTD_LOGS = [];

export const INITIAL_TRANSFER_REQUESTS = [
  {
    id: 'tr-101',
    employeeId: '7104',
    employeeName: 'Ramesh Babu Konda',
    fromCostCenter: '1IDS038-KIPIC',
    fromDivision: 'IDS',
    toCostCenter: '1MEP019-KNPC',
    toDivision: 'MEP',
    reason: 'Reassigned to KNPC MEP Turnaround Support Team',
    requestedBy: 'Tariq Al-Mansoor',
    requestedByRole: 'CAMP_EDITOR',
    requestDate: '2026-11-07 02:30 PM',
    status: 'PENDING',
    reviewedBy: '',
    reviewDate: '',
    reviewRemarks: ''
  }
];

export const INITIAL_BILLING_OTHER_COSTS = {
  '1IDS038-KIPIC': { amount: 45.0, description: 'Extra catering & water supply allocation' },
  '1MEP019-KNPC': { amount: 25.0, description: 'Camp shuttle bus fuel surcharge' },
  '1CIV011-KOC': { amount: 15.0, description: 'Room maintenance & laundry consumables' }
};

export const INITIAL_ACTIVITY_LOGS = [
  {
    id: 'act-1',
    timestamp: '2026-11-08T08:45:12Z',
    actorName: 'Lohith Kamineni',
    actorRole: 'SUPER_ADMIN',
    category: 'CAMP_CONFIG',
    actionTitle: 'Configured 10-Floor Building (CAMP-03)',
    details: 'Initialized CAMP-03 (Mangaf 10-Story Tower) with Floor 1 = 2 Flats and Floors 2-10 = 3 Flats.',
    campNo: 'CAMP-03'
  },
  {
    id: 'act-2',
    timestamp: '2026-11-07T14:30:00Z',
    actorName: 'Tariq Al-Mansoor',
    actorRole: 'CAMP_EDITOR',
    category: 'COST_CENTER_REQUEST',
    actionTitle: 'Requested Cost Center Transfer for #7104',
    details: 'Requested moving #7104 (Ramesh Babu Konda) from 1IDS038-KIPIC to 1MEP019-KNPC. Awaiting Super Admin / Auditor approval.',
    campNo: 'CAMP-01'
  },
  {
    id: 'act-3',
    timestamp: '2026-10-20T08:30:00Z',
    actorName: 'Lohith Kamineni',
    actorRole: 'SUPER_ADMIN',
    category: 'LEAVE_START',
    actionTitle: 'Marked #5912 On Leave',
    details: 'Syed Tanveer Hussain (#5912) started leave on 2026-10-20, expected return 2026-11-25 (Room 1-01-02-A).',
    campNo: 'CAMP-01'
  }
];