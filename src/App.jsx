import dhowLogoImg from './assets/dhow-logo.png';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2, Users, ShieldCheck, Eye, EyeOff, Lock, Mail, LogOut,
  Plus, Search, Filter, Download, CheckCircle2, AlertCircle, Trash2,
  UserPlus, KeyRound, Bed, Home, RefreshCw, X, ChevronRight, UserCheck,
  Calendar, Layers, FileSpreadsheet, BarChart3, Plane, Settings
} from 'lucide-react';
const DhowLogo = ({ className = "h-8 w-auto" }) => (
  <img
    src={dhowLogoImg}
    alt="Dhow Engineering"
    className={className}
  />
);

// ==========================================
// 2. INITIAL SYSTEM USERS (RBAC & AUTH)
// ==========================================
const INITIAL_USERS = [
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
    },
    lastLogin: '2026-11-05 10:20 AM'
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
      canDeleteCamps: false,
      canEditOccupants: true,
      canExportReports: true,
    },
    lastLogin: '2026-11-04 04:15 PM'
  },
  {
    id: 'u-3',
    staffId: 'AUD-009',
    name: 'Nadia Al-Sabah',
    email: 'nadia@al-dhow.com',
    passwordHash: 'ViewerPassword123!',
    title: 'HR Compliance Auditor',
    role: 'AUDITOR',
    campScope: 'ALL',
    status: 'Active',
    permissions: {
      canManageUsers: false,
      canAddCamps: false,
      canDeleteCamps: false,
      canEditOccupants: false,
      canExportReports: true,
    },
    lastLogin: '2026-11-03 09:30 AM'
  }
];

const getRoleDefaultPermissions = (role) => {
  if (role === 'SUPER_ADMIN') {
    return {
      canManageUsers: true,
      canAddCamps: true,
      canDeleteCamps: true,
      canEditOccupants: true,
      canExportReports: true,
    };
  }
  if (role === 'CAMP_EDITOR') {
    return {
      canManageUsers: false,
      canAddCamps: false,
      canDeleteCamps: false,
      canEditOccupants: true,
      canExportReports: true,
    };
  }
  return {
    canManageUsers: false,
    canAddCamps: false,
    canDeleteCamps: false,
    canEditOccupants: false,
    canExportReports: true,
  };
};

// ==========================================
// 3. INITIAL APARTMENT / CAMP HIERARCHY
// ==========================================
const INITIAL_CAMPS = [
  {
    id: 'camp-1',
    campNo: 'CAMP-01',
    campArea: 'Farwaniya 1',
    costCenter: '1ACD000',
    campDigit: '1',
    floors: [
      {
        floorNo: 1,
        floorGrade: 'Engineer',
        flats: [
          {
            flatNo: 1,
            flatCode: '1-01-01-E',
            roomGrade: 'Engineer',
            rooms: [
              { roomNo: '1-01-01-A', capacity: 2, occupants: ['5838', '6104'] },
              { roomNo: '1-01-01-B', capacity: 2, occupants: ['6290'] },
              { roomNo: '1-01-01-C', capacity: 2, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '1-01-02-E',
            roomGrade: 'Engineer',
            rooms: [
              { roomNo: '1-01-02-A', capacity: 2, occupants: ['5912'] },
              { roomNo: '1-01-02-B', capacity: 2, occupants: [] },
              { roomNo: '1-01-02-C', capacity: 2, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '1-01-03-E',
            roomGrade: 'Engineer',
            rooms: [
              { roomNo: '1-01-03-A', capacity: 2, occupants: [] },
              { roomNo: '1-01-03-B', capacity: 2, occupants: [] },
              { roomNo: '1-01-03-C', capacity: 2, occupants: [] },
            ]
          }
        ]
      },
      {
        floorNo: 2,
        floorGrade: 'Foreman',
        flats: [
          {
            flatNo: 1,
            flatCode: '1-02-01-F',
            roomGrade: 'Foreman',
            rooms: [
              { roomNo: '1-02-01-A', capacity: 3, occupants: ['7101', '7102'] },
              { roomNo: '1-02-01-B', capacity: 3, occupants: ['7103', '7104'] },
              { roomNo: '1-02-01-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '1-02-02-F',
            roomGrade: 'Foreman',
            rooms: [
              { roomNo: '1-02-02-A', capacity: 3, occupants: [] },
              { roomNo: '1-02-02-B', capacity: 3, occupants: [] },
              { roomNo: '1-02-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '1-02-03-F',
            roomGrade: 'Foreman',
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
        floorGrade: 'Labor',
        flats: [
          {
            flatNo: 1,
            flatCode: '1-03-01-L',
            roomGrade: 'Labor',
            rooms: [
              { roomNo: '1-03-01-A', capacity: 3, occupants: ['8201', '8202'] },
              { roomNo: '1-03-01-B', capacity: 3, occupants: [] },
              { roomNo: '1-03-01-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '1-03-02-L',
            roomGrade: 'Labor',
            rooms: [
              { roomNo: '1-03-02-A', capacity: 3, occupants: [] },
              { roomNo: '1-03-02-B', capacity: 3, occupants: [] },
              { roomNo: '1-03-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '1-03-03-L',
            roomGrade: 'Labor',
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
    floors: [
      {
        floorNo: 1,
        floorGrade: 'Engineer',
        flats: [
          {
            flatNo: 1,
            flatCode: '2-01-01-E',
            roomGrade: 'Engineer',
            rooms: [
              { roomNo: '2-01-01-A', capacity: 2, occupants: ['9011'] },
              { roomNo: '2-01-01-B', capacity: 2, occupants: [] },
              { roomNo: '2-01-01-C', capacity: 2, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '2-01-02-E',
            roomGrade: 'Engineer',
            rooms: [
              { roomNo: '2-01-02-A', capacity: 2, occupants: [] },
              { roomNo: '2-01-02-B', capacity: 2, occupants: [] },
              { roomNo: '2-01-02-C', capacity: 2, occupants: [] },
            ]
          }
        ]
      },
      {
        floorNo: 2,
        floorGrade: 'Labor',
        flats: [
          {
            flatNo: 1,
            flatCode: '2-02-01-L',
            roomGrade: 'Labor',
            rooms: [
              { roomNo: '2-02-01-A', capacity: 3, occupants: [] },
              { roomNo: '2-02-01-B', capacity: 3, occupants: [] },
              { roomNo: '2-02-01-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 2,
            flatCode: '2-02-02-L',
            roomGrade: 'Labor',
            rooms: [
              { roomNo: '2-02-02-A', capacity: 3, occupants: [] },
              { roomNo: '2-02-02-B', capacity: 3, occupants: [] },
              { roomNo: '2-02-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '2-02-03-L',
            roomGrade: 'Labor',
            rooms: [
              { roomNo: '2-02-03-A', capacity: 3, occupants: [] },
              { roomNo: '2-02-03-B', capacity: 3, occupants: [] },
              { roomNo: '2-02-03-C', capacity: 3, occupants: [] },
            ]
          }
        ]
      }
    ]
  }
];

// ==========================================
// 4. INITIAL OCCUPANTS (Book1.xlsx)
// ==========================================
const INITIAL_OCCUPANTS = [
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
    roomGrade: 'Engineer',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 1,
    flatCode: '1-01-01-E',
    roomNo: '1-01-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 9876 5432',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-5838',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1IDS051',
    exitDate: '',
    afrExitRef: '',
    remarks: 'Row 3 Master Record from Book1.xlsx'
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
    roomGrade: 'Engineer',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 1,
    flatCode: '1-01-01-E',
    roomNo: '1-01-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 9911 2233',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-6104',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1IDS051',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
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
    roomGrade: 'Engineer',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 1,
    flatCode: '1-01-01-E',
    roomNo: '1-01-01-B',
    employeeStatus: 'On Job',
    mobileNo: '+965 6543 2109',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-6290',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1MEP019',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
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
    title: 'QA/QC Engineer',
    productivityType: 'DE',
    entryDate: '2022-11-20',
    passportNo: 'PK4491823',
    civilId: '290121003412',
    roomGrade: 'Engineer',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 2,
    flatCode: '1-01-02-E',
    roomNo: '1-01-02-A',
    employeeStatus: 'On Leave',
    mobileNo: '+965 5012 3456',
    leaveStartDate: '2026-10-20',
    leaveEndDate: '2026-11-25',
    leaveReturnDate: '',
    afrLogNo: 'LOG-5912',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1CIV011',
    exitDate: '',
    afrExitRef: '',
    remarks: 'Annual Vacation'
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
    roomGrade: 'Foreman',
    campArea: 'Farwaniya 1',
    floorNo: 2,
    flatNo: 1,
    flatCode: '1-02-01-F',
    roomNo: '1-02-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 6677 8899',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-7101',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1MEP019',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
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
    roomGrade: 'Foreman',
    campArea: 'Farwaniya 1',
    floorNo: 2,
    flatNo: 1,
    flatCode: '1-02-01-F',
    roomNo: '1-02-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 6611 0022',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-7102',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1MEP019',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
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
    roomGrade: 'Foreman',
    campArea: 'Farwaniya 1',
    floorNo: 2,
    flatNo: 1,
    flatCode: '1-02-01-F',
    roomNo: '1-02-01-B',
    employeeStatus: 'On Job',
    mobileNo: '+965 9771 3344',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-7103',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1CIV011',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
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
    roomGrade: 'Foreman',
    campArea: 'Farwaniya 1',
    floorNo: 2,
    flatNo: 1,
    flatCode: '1-02-01-F',
    roomNo: '1-02-01-B',
    employeeStatus: 'On Job',
    mobileNo: '+965 6099 8877',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-7104',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1IDS038',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
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
    roomGrade: 'Labor',
    campArea: 'Farwaniya 1',
    floorNo: 3,
    flatNo: 1,
    flatCode: '1-03-01-L',
    roomNo: '1-03-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 5544 3322',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-8201',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1CIV011',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
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
    roomGrade: 'Labor',
    campArea: 'Farwaniya 1',
    floorNo: 3,
    flatNo: 1,
    flatCode: '1-03-01-L',
    roomNo: '1-03-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 5588 7766',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-8202',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1CIV011',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
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
    roomGrade: 'Engineer',
    campArea: 'Mahboula Block B',
    floorNo: 1,
    flatNo: 1,
    flatCode: '2-01-01-E',
    roomNo: '2-01-01-A',
    employeeStatus: 'On Job',
    mobileNo: '+965 6789 0123',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveReturnDate: '',
    afrLogNo: 'LOG-9011',
    residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
    reallocationCostCenter: '1IDS038',
    exitDate: '',
    afrExitRef: '',
    remarks: ''
  }
];

export default function App() {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_users_v5');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_session_v5');
    return saved ? JSON.parse(saved) : null;
  });

  const [camps, setCamps] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_camps_v5');
    return saved ? JSON.parse(saved) : INITIAL_CAMPS;
  });

  const [occupants, setOccupants] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_occupants_v5');
    return saved ? JSON.parse(saved) : INITIAL_OCCUPANTS;
  });

  const [activeTab, setActiveTab] = useState('map');
  const [selectedCampId, setSelectedCampId] = useState(INITIAL_CAMPS[0].id);
  const [selectedFloorNo, setSelectedFloorNo] = useState(1);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Modals
  const [showAddCampModal, setShowAddCampModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [manageOccupantModal, setManageOccupantModal] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserModal, setEditingUserModal] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [targetUserForReset, setTargetUserForReset] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');

  // New Camp Wizard
  const [newCampForm, setNewCampForm] = useState({
    campNo: 'CAMP-03',
    campArea: 'Fahaheel Block A',
    campDigit: '3',
    floorsCount: 3,
    flatsPerFloor: 3,
    roomsPerFlat: 3,
    floor1Grade: 'Engineer',
    floor1Capacity: 2,
    upperFloorCapacity: 3
  });

  // Check-In Form
  const [checkInForm, setCheckInForm] = useState({
    campId: 'camp-1',
    floorNo: 1,
    flatCode: '1-01-01-E',
    roomNo: '1-01-01-B',
    roomGrade: 'Engineer',
    employeeId: '',
    employeeName: '',
    nationality: 'India',
    title: 'Site Engineer',
    division: 'IDS',
    costCenter: '1IDS038-KIPIC',
    passportNo: '',
    civilId: '',
    mobileNo: '+965 ',
    afrEntryRef: `AFR-2026-${Math.floor(100 + Math.random() * 900)}`,
    entryDate: new Date().toISOString().slice(0, 10)
  });

  // New User Form
  const [newUserForm, setNewUserForm] = useState({
    staffId: '',
    name: '',
    email: '',
    password: '',
    title: '',
    role: 'CAMP_EDITOR',
    campScope: 'ALL',
    canManageUsers: false,
    canAddCamps: false,
    canDeleteCamps: false,
    canEditOccupants: true,
    canExportReports: true,
  });

  useEffect(() => {
    localStorage.setItem('dhow_camp_users_v5', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('dhow_camp_camps_v5', JSON.stringify(camps));
  }, [camps]);

  useEffect(() => {
    localStorage.setItem('dhow_camp_occupants_v5', JSON.stringify(occupants));
  }, [occupants]);

  useEffect(() => {
    if (currentUser && rememberMe) {
      localStorage.setItem('dhow_camp_session_v5', JSON.stringify(currentUser));
    } else if (!currentUser) {
      localStorage.removeItem('dhow_camp_session_v5');
    }
  }, [currentUser, rememberMe]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    setTimeout(() => {
      const q = loginEmail.trim().toLowerCase();
      const user = users.find(
        (u) => u.email.toLowerCase() === q || u.staffId.toLowerCase() === q
      );

      if (!user) {
        setLoginError('Invalid email / Staff ID or password.');
        setLoginLoading(false);
        return;
      }

      if (user.status !== 'Active') {
        setLoginError('Account suspended. Contact the Super Administrator.');
        setLoginLoading(false);
        return;
      }

      if (user.passwordHash !== loginPassword) {
        setLoginError('Incorrect password. Please try again.');
        setLoginLoading(false);
        return;
      }

      const updatedUser = {
        ...user,
        lastLogin: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      setLoginLoading(false);
      setLoginPassword('');
    }, 350);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dhow_camp_session_v5');
    setActiveTab('map');
  };

  const globalStats = useMemo(() => {
    let totalFlats = 0;
    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;

    camps.forEach(camp => {
      camp.floors.forEach(fl => {
        totalFlats += fl.flats.length;
        fl.flats.forEach(flat => {
          totalRooms += flat.rooms.length;
          flat.rooms.forEach(rm => {
            totalBeds += rm.capacity;
            occupiedBeds += rm.occupants.length;
          });
        });
      });
    });

    const freeBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const activeOccupants = occupants.filter(o => o.employeeStatus !== 'Exited');
    const onJobCount = activeOccupants.filter(o => o.employeeStatus === 'On Job').length;
    const onLeaveCount = activeOccupants.filter(o => o.employeeStatus === 'On Leave').length;

    return {
      campsCount: camps.length,
      totalFlats,
      totalRooms,
      totalBeds,
      occupiedBeds,
      freeBeds,
      occupancyPct,
      activeCount: activeOccupants.length,
      onJobCount,
      onLeaveCount
    };
  }, [camps, occupants]);

  const activeCamp = useMemo(() => {
    return camps.find(c => c.id === selectedCampId) || camps[0];
  }, [camps, selectedCampId]);

  const activeFloor = useMemo(() => {
    return activeCamp.floors.find(f => f.floorNo === selectedFloorNo) || activeCamp.floors[0];
  }, [activeCamp, selectedFloorNo]);

  const filteredOccupants = useMemo(() => {
    return occupants.filter(occ => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        occ.employeeName.toLowerCase().includes(q) ||
        occ.employeeId.toLowerCase().includes(q) ||
        occ.civilId.toString().includes(q) ||
        occ.passportNo.toLowerCase().includes(q) ||
        occ.flatCode.toLowerCase().includes(q) ||
        occ.roomNo.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || occ.employeeStatus === statusFilter;
      const matchesDivision = divisionFilter === 'ALL' || occ.division === divisionFilter;

      return matchesSearch && matchesStatus && matchesDivision;
    });
  }, [occupants, searchTerm, statusFilter, divisionFilter]);

  const availableDivisions = useMemo(() => {
    return Array.from(new Set(occupants.map(o => o.division))).filter(Boolean);
  }, [occupants]);

  const handleCreateCamp = (e) => {
    e.preventDefault();
    const campDigit = newCampForm.campDigit || String(camps.length + 1);
    const totalFloors = parseInt(newCampForm.floorsCount, 10);
    const flatsPerFl = parseInt(newCampForm.flatsPerFloor, 10);
    const roomsPerFl = parseInt(newCampForm.roomsPerFlat, 10);

    const generatedFloors = [];
    for (let f = 1; f <= totalFloors; f++) {
      const isFloor1 = f === 1;
      const flatGrade = isFloor1 ? newCampForm.floor1Grade : 'Labor';
      const gradeInitial = flatGrade === 'Engineer' ? 'E' : 'L';
      const roomCapacity = isFloor1
        ? parseInt(newCampForm.floor1Capacity, 10)
        : parseInt(newCampForm.upperFloorCapacity, 10);

      const floorFlats = [];
      for (let fl = 1; fl <= flatsPerFl; fl++) {
        const floorStr = String(f).padStart(2, '0');
        const flatStr = String(fl).padStart(2, '0');
        const flatCode = `${campDigit}-${floorStr}-${flatStr}-${gradeInitial}`;

        const flatRooms = [];
        const roomLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        for (let r = 0; r < roomsPerFl; r++) {
          const letter = roomLetters[r] || `R${r + 1}`;
          flatRooms.push({
            roomNo: `${campDigit}-${floorStr}-${flatStr}-${letter}`,
            capacity: roomCapacity,
            occupants: []
          });
        }

        floorFlats.push({
          flatNo: fl,
          flatCode,
          roomGrade: flatGrade,
          rooms: flatRooms
        });
      }

      generatedFloors.push({
        floorNo: f,
        floorGrade: flatGrade,
        flats: floorFlats
      });
    }

    const newCampObj = {
      id: `camp-${Date.now()}`,
      campNo: newCampForm.campNo,
      campArea: newCampForm.campArea,
      costCenter: '1ACD000',
      campDigit,
      floors: generatedFloors
    };

    setCamps(prev => [...prev, newCampObj]);
    setSelectedCampId(newCampObj.id);
    setSelectedFloorNo(1);
    setShowAddCampModal(false);
  };

  const openQuickAssignModal = (camp, floor, flat, room) => {
    if (!currentUser.permissions.canEditOccupants && currentUser.role !== 'SUPER_ADMIN') {
      alert('Read-Only Access: You do not have permission to check in employees.');
      return;
    }
    setCheckInForm({
      ...checkInForm,
      campId: camp.id,
      floorNo: floor.floorNo,
      flatCode: flat.flatCode,
      roomNo: room.roomNo,
      roomGrade: flat.roomGrade,
      afrEntryRef: `AFR-2026-${Math.floor(100 + Math.random() * 900)}`
    });
    setShowCheckInModal(true);
  };

  const handleCheckInSubmit = (e) => {
    e.preventDefault();
    const empId = checkInForm.employeeId.trim();
    if (occupants.some(o => o.employeeId === empId && o.employeeStatus !== 'Exited')) {
      alert(`Employee ID #${empId} is already assigned to a room.`);
      return;
    }

    const targetCamp = camps.find(c => c.id === checkInForm.campId) || activeCamp;

    const newOcc = {
      srNo: occupants.length + 1,
      campNo: targetCamp.campNo,
      status: 'Permanent',
      division: checkInForm.division,
      costCenter: checkInForm.costCenter,
      employeeId: empId,
      afrEntryRef: checkInForm.afrEntryRef,
      employeeName: checkInForm.employeeName,
      nationality: checkInForm.nationality,
      title: checkInForm.title,
      productivityType: 'DE',
      entryDate: checkInForm.entryDate,
      passportNo: checkInForm.passportNo,
      civilId: checkInForm.civilId,
      roomGrade: checkInForm.roomGrade,
      campArea: targetCamp.campArea,
      floorNo: Number(checkInForm.floorNo),
      flatNo: Number(checkInForm.flatCode.split('-')[2] || 1),
      flatCode: checkInForm.flatCode,
      roomNo: checkInForm.roomNo,
      employeeStatus: 'On Job',
      mobileNo: checkInForm.mobileNo,
      leaveStartDate: '',
      leaveEndDate: '',
      leaveReturnDate: '',
      afrLogNo: `LOG-${empId}`,
      residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
      reallocationCostCenter: checkInForm.costCenter.split('-')[0],
      exitDate: '',
      afrExitRef: '',
      remarks: 'Checked in via Dhow Portal'
    };

    setOccupants(prev => [...prev, newOcc]);
    setCamps(prev =>
      prev.map(c => {
        if (c.id !== targetCamp.id) return c;
        return {
          ...c,
          floors: c.floors.map(fl => ({
            ...fl,
            flats: fl.flats.map(flat => ({
              ...flat,
              rooms: flat.rooms.map(rm => {
                if (rm.roomNo === checkInForm.roomNo && rm.occupants.length < rm.capacity) {
                  return { ...rm, occupants: [...rm.occupants, empId] };
                }
                return rm;
              })
            }))
          }))
        };
      })
    );

    setShowCheckInModal(false);
    setCheckInForm({
      ...checkInForm,
      employeeId: '',
      employeeName: '',
      passportNo: '',
      civilId: ''
    });
  };

  const handleUpdateOccupantStatus = (empId, newStatus) => {
    if (newStatus === 'Exited') {
      const today = new Date().toISOString().slice(0, 10);
      setOccupants(prev =>
        prev.map(o =>
          o.employeeId === empId
            ? { ...o, employeeStatus: 'Exited', exitDate: today, afrExitRef: `EXIT-${empId}` }
            : o
        )
      );
      setCamps(prev =>
        prev.map(c => ({
          ...c,
          floors: c.floors.map(fl => ({
            ...fl,
            flats: fl.flats.map(flat => ({
              ...flat,
              rooms: flat.rooms.map(rm => ({
                ...rm,
                occupants: rm.occupants.filter(id => id !== empId)
              }))
            }))
          }))
        }))
      );
      setManageOccupantModal(null);
    } else {
      setOccupants(prev =>
        prev.map(o =>
          o.employeeId === empId
            ? {
                ...o,
                employeeStatus: newStatus,
                leaveStartDate: newStatus === 'On Leave' ? new Date().toISOString().slice(0, 10) : o.leaveStartDate
              }
            : o
        )
      );
      setManageOccupantModal(prev => prev ? { ...prev, employeeStatus: newStatus } : null);
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const newUser = {
      id: `u-${Date.now()}`,
      staffId: newUserForm.staffId,
      name: newUserForm.name,
      email: newUserForm.email,
      passwordHash: newUserForm.password,
      title: newUserForm.title || 'Camp Coordinator',
      role: newUserForm.role,
      campScope: newUserForm.campScope,
      status: 'Active',
      permissions: {
        canManageUsers: newUserForm.role === 'SUPER_ADMIN' || newUserForm.canManageUsers,
        canAddCamps: newUserForm.role === 'SUPER_ADMIN' || newUserForm.canAddCamps,
        canDeleteCamps: newUserForm.role === 'SUPER_ADMIN' || newUserForm.canDeleteCamps,
        canEditOccupants: newUserForm.canEditOccupants,
        canExportReports: newUserForm.canExportReports,
      },
      lastLogin: 'Never'
    };

    setUsers(prev => [...prev, newUser]);
    setShowAddUserModal(false);
    setNewUserForm({
      staffId: '',
      name: '',
      email: '',
      password: '',
      title: '',
      role: 'CAMP_EDITOR',
      campScope: 'ALL',
      canManageUsers: false,
      canAddCamps: false,
      canDeleteCamps: false,
      canEditOccupants: true,
      canExportReports: true,
    });
  };

  const handleInlineRoleChange = (userId, newRole) => {
    if (userId === currentUser.id && newRole !== 'SUPER_ADMIN') {
      alert('You cannot demote your own active Super Admin account.');
      return;
    }
    const updatedPermissions = getRoleDefaultPermissions(newRole);
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, role: newRole, permissions: updatedPermissions };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const handleInlineScopeChange = (userId, newScope) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, campScope: newScope };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const handleToggleUserPermission = (userId, permKey) => {
    if (userId === currentUser.id && permKey === 'canManageUsers') {
      alert('You cannot revoke user management access from your own Super Admin account.');
      return;
    }
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updatedPerms = {
            ...u.permissions,
            [permKey]: !u.permissions[permKey]
          };
          const updated = { ...u, permissions: updatedPerms };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const handleSaveEditedUser = (e) => {
    e.preventDefault();
    if (!editingUserModal) return;

    setUsers(prev =>
      prev.map(u => {
        if (u.id === editingUserModal.id) {
          if (currentUser && currentUser.id === u.id) {
            setCurrentUser(editingUserModal);
          }
          return editingUserModal;
        }
        return u;
      })
    );
    setEditingUserModal(null);
  };

  const handleExecutePasswordReset = (e) => {
    e.preventDefault();
    if (newPasswordValue.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    if (newPasswordValue !== confirmPasswordValue) {
      alert('New password and confirmation do not match.');
      return;
    }

    setUsers(prev =>
      prev.map(u =>
        u.id === targetUserForReset.id
          ? { ...u, passwordHash: newPasswordValue }
          : u
      )
    );

    setResetSuccessMessage(`Password updated for ${targetUserForReset.name}.`);
    setTimeout(() => {
      setShowResetPasswordModal(false);
      setTargetUserForReset(null);
      setNewPasswordValue('');
      setConfirmPasswordValue('');
      setResetSuccessMessage('');
    }, 1400);
  };

  const handleDeleteUser = (userId) => {
    if (userId === currentUser.id) {
      alert('You cannot delete your own active Super Admin account.');
      return;
    }
    if (confirm('Permanently revoke and remove this user account?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleToggleUserStatus = (userId) => {
    if (userId === currentUser.id) {
      alert('You cannot suspend your own active Super Admin account.');
      return;
    }
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' }
          : u
      )
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'Sr.No', 'CAMP #', 'Status', 'Division', 'Cost Center', 'ID', 'AFR Entry Ref.',
      'Employee Name', 'Nationality', 'Title', 'Productivity Type', 'Entry Date',
      'Passport No', 'Civil ID', 'Room Grade', 'Camp Area', 'Floor No#', 'Flat No#',
      'Flat Code', 'Room #', 'Employee Status', 'Mobile No.', 'Leave Start Date',
      'Leave End Date', 'Leave Return Date', 'AFR Log No', 'Residency Company',
      'Reallocation Cost Center', 'Exit Date', 'AFR Exit Ref.', 'Remarks'
    ];

    const rows = filteredOccupants.map(o => [
      o.srNo, `"${o.campNo}"`, `"${o.status}"`, `"${o.division}"`, `"${o.costCenter}"`,
      `"${o.employeeId}"`, `"${o.afrEntryRef}"`, `"${o.employeeName}"`, `"${o.nationality}"`,
      `"${o.title}"`, `"${o.productivityType}"`, `"${o.entryDate}"`, `"${o.passportNo}"`,
      `"${o.civilId}"`, `"${o.roomGrade}"`, `"${o.campArea}"`, o.floorNo, o.flatNo,
      `"${o.flatCode}"`, `"${o.roomNo}"`, `"${o.employeeStatus}"`, `"${o.mobileNo}"`,
      `"${o.leaveStartDate}"`, `"${o.leaveEndDate}"`, `"${o.leaveReturnDate}"`,
      `"${o.afrLogNo}"`, `"${o.residencyCompany}"`, `"${o.reallocationCostCenter}"`,
      `"${o.exitDate}"`, `"${o.afrExitRef}"`, `"${o.remarks}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dhow_Camp_Occupants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================
  // VIEW 1: SIGN-IN SCREEN WITH DHOW LOGO
  // =========================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased">
        <div className="w-full pt-4" />

        <div className="w-full max-w-[440px] mx-auto my-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-lg mb-3">
              <DhowLogo className="h-10 w-auto text-slate-900" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Camp Management System
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Dhow Engineering • Cost Center 1ACD000
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/60 p-7 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 text-center mb-6">
              Sign In
            </h2>

            {loginError && (
              <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your email or Staff ID
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="name@al-dhow.com"
                  className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold"
                >
                  Forgot your password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>SIGN IN</span>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="w-full text-center text-xs text-slate-400 pb-2 space-y-1.5">
          <div className="flex items-center justify-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms and Conditions</span>
          </div>
          <div>© 2026 Dhow Engineering General Trading & Contracting Co.</div>
        </div>

        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Password Recovery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For security reasons, user passwords are encrypted and cannot be viewed. Please contact the Super Administrator to reset your password:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-cyan-700 font-semibold">
                admin@al-dhow.com
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // VIEW 2: AUTHENTICATED ERP PORTAL
  // =========================================================
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.permissions.canManageUsers;
  const canAddCamps = currentUser.role === 'SUPER_ADMIN' || currentUser.permissions.canAddCamps;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* ======================================================= */}
      {/* TOP DARK NAVY ERP HEADER WITH DHOW LOGO                 */}
      {/* ======================================================= */}
      <header className="bg-[#0f172a] text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="bg-white px-3 py-2 rounded-xl shadow-md shrink-0 flex items-center justify-center">
              <DhowLogo className="h-7 w-auto text-slate-900" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                  Dhow Camp Management System
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-950/90 text-indigo-300 border border-indigo-700/60">
                  Cost Center: 1ACD000
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Accommodation Occupants Registry • Configurable Hierarchy, AFR Tracker & RBAC Security
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canAddCamps && (
              <button
                onClick={() => setShowAddCampModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Apartment</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-slate-800/90 text-white border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Interactive Apartment & Room Map</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
              {globalStats.freeBeds} Free Spots
            </span>
          </button>

          <button
            onClick={() => setActiveTab('occupants')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'occupants'
                ? 'bg-slate-800/90 text-white border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <span>31-Column Occupant List (Book1.xlsx)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              {globalStats.activeCount} Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-slate-800/90 text-white border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>Vacancy, Occupancy & Division Reports</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              {globalStats.occupancyPct}% Full
            </span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-slate-800/90 text-white border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin & User Access (RBAC)</span>
            </button>
          )}
        </div>
      </header>

      {/* Sub-Header Status Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Logged in as:</span>
            <span className="font-bold text-slate-900">{currentUser.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
              {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser.role}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Camp Scope: {currentUser.campScope}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className="text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Users & Role Permissions →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Body Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Apartments / Camps</span>
              <Building2 className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{globalStats.campsCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {globalStats.totalFlats} Flats • {globalStats.totalRooms} Rooms
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Total Bed Capacity</span>
              <Bed className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{globalStats.totalBeds}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Flr 1: 2/rm (Eng) • Flr 2+: 9/flat
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Occupied Spots</span>
              <Users className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-black text-cyan-600 mt-1.5">{globalStats.occupiedBeds}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {globalStats.occupancyPct}% Total Occupancy
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span>Free / Vacant Spots</span>
              <Home className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1.5">{globalStats.freeBeds}</div>
            <div className="text-[11px] text-emerald-700/80 mt-1">
              Ready for immediate check-in
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Physically On Job</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{globalStats.onJobCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active on project sites
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Currently On Leave</span>
              <Plane className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1.5">{globalStats.onLeaveCount}</div>
            <div className="text-[11px] text-amber-700/80 mt-1">
              Beds held during vacation
            </div>
          </div>
        </div>

        {/* TAB 1: MAP */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
                  SELECT APARTMENT BUILDING:
                </span>

                {camps.map(camp => {
                  let campBeds = 0;
                  let campOcc = 0;
                  let campFlats = 0;
                  camp.floors.forEach(fl => {
                    campFlats += fl.flats.length;
                    fl.flats.forEach(ft => {
                      ft.rooms.forEach(rm => {
                        campBeds += rm.capacity;
                        campOcc += rm.occupants.length;
                      });
                    });
                  });
                  const campFree = campBeds - campOcc;
                  const isSelected = camp.id === activeCamp.id;

                  return (
                    <button
                      key={camp.id}
                      onClick={() => {
                        setSelectedCampId(camp.id);
                        setSelectedFloorNo(1);
                      }}
                      className={`text-left px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">
                        {camp.campNo} <span className={isSelected ? 'text-cyan-300' : 'text-slate-500'}>• {camp.campArea}</span>
                      </div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {camp.floors.length} Floors • {campFlats} Flats •{' '}
                        <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold'}>
                          {campFree} Free
                        </span>{' '}
                        / {campBeds} Beds
                      </div>
                    </button>
                  );
                })}

                {canAddCamps && (
                  <button
                    onClick={() => setShowAddCampModal(true)}
                    className="px-4 py-3 rounded-xl border-2 border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Apartment Building</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="inline-flex items-center gap-4 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span> On Job
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> On Leave
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Free Bed
                  </span>
                </div>
              </div>
            </div>

            {/* Floor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeCamp.floors.map(floor => {
                let flBeds = 0;
                let flOcc = 0;
                floor.flats.forEach(ft => {
                  ft.rooms.forEach(rm => {
                    flBeds += rm.capacity;
                    flOcc += rm.occupants.length;
                  });
                });
                const flFree = flBeds - flOcc;
                const flPct = flBeds > 0 ? Math.round((flOcc / flBeds) * 100) : 0;
                const isFloorSelected = floor.floorNo === activeFloor.floorNo;
                const sampleCap = floor.flats[0]?.rooms[0]?.capacity || 2;
                const flatTotalCap = sampleCap * (floor.flats[0]?.rooms.length || 3);

                return (
                  <div
                    key={floor.floorNo}
                    onClick={() => setSelectedFloorNo(floor.floorNo)}
                    className={`bg-white rounded-2xl p-4 cursor-pointer transition-all border-2 ${
                      isFloorSelected
                        ? 'border-cyan-600 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          Floor {floor.floorNo}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                          floor.floorNo === 1
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : floor.floorNo === 2
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {floor.floorGrade || (floor.floorNo === 1 ? 'Engineer' : 'Labor')}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{flFree} Free</span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium mb-3">
                      {floor.flats.length} Flats • {sampleCap} persons/room ({flatTotalCap}/flat)
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${flPct}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Occupied: {flOcc} / {flBeds}</span>
                      <span>{flPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flats & Rooms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {activeFloor.flats.map(flat => {
                let flatCap = 0;
                let flatOcc = 0;
                flat.rooms.forEach(r => {
                  flatCap += r.capacity;
                  flatOcc += r.occupants.length;
                });

                return (
                  <div key={flat.flatCode} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
                    <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black tracking-tight">Flat {flat.flatCode}</div>
                        <div className="text-[11px] text-slate-400">
                          Floor {activeFloor.floorNo} • Flat #{flat.flatNo} ({flat.roomGrade})
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                        {flatOcc}/{flatCap} Occupied
                      </span>
                    </div>

                    <div className="p-4 space-y-4 flex-1 bg-slate-50/40">
                      {flat.rooms.map(room => {
                        const occCount = room.occupants.length;
                        return (
                          <div key={room.roomNo} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold text-slate-800">
                                Room {room.roomNo}{' '}
                                <span className="text-slate-400 font-normal">({flat.roomGrade} • Max {room.capacity})</span>
                              </div>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                occCount === room.capacity ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {occCount}/{room.capacity} Occupied
                              </span>
                            </div>

                            <div className="space-y-2">
                              {Array.from({ length: room.capacity }).map((_, idx) => {
                                const empId = room.occupants[idx];
                                const occ = occupants.find(o => o.employeeId === empId);

                                if (occ) {
                                  const isOnLeave = occ.employeeStatus === 'On Leave';
                                  return (
                                    <div key={empId} className={`p-3 rounded-xl border transition-all ${isOnLeave ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50/80 border-slate-200/90'}`}>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="bg-slate-900 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                                            #{occ.employeeId}
                                          </span>
                                          <span className="text-xs font-bold text-slate-900 truncate">{occ.employeeName}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${isOnLeave ? 'bg-amber-200/80 text-amber-900' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                                          {isOnLeave ? '✈ On Leave' : 'On Job'}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between mt-1.5 text-[11px]">
                                        <span className="text-slate-500 truncate">
                                          {occ.title} • <strong className="text-slate-700">{occ.division} ({occ.costCenter})</strong>
                                        </span>
                                        <button
                                          onClick={() => setManageOccupantModal(occ)}
                                          className="text-slate-500 hover:text-cyan-600 font-semibold shrink-0 ml-2 cursor-pointer"
                                        >
                                          Manage →
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={`free-${idx}`}
                                    onClick={() => openQuickAssignModal(activeCamp, activeFloor, flat, room)}
                                    className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-700 flex items-center justify-between text-xs font-semibold transition-all cursor-pointer"
                                  >
                                    <span>+ Free Spot #{idx + 1} ({flat.roomGrade})</span>
                                    <span className="underline decoration-emerald-500/60 font-bold">Assign Employee</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: OCCUPANTS LIST */}
        {activeTab === 'occupants' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by ID, Name, Civil ID, Passport, Flat, Room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="On Job">On Job</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Exited">Exited</option>
                </select>

                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2"
                >
                  <option value="ALL">All Divisions</option>
                  {availableDivisions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Dhow CSV
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Showing {filteredOccupants.length} of {occupants.length} Master Records</span>
                <span className="font-mono text-cyan-600 font-bold">1ACD000 — 31 Columns Active</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Sr.No</th>
                      <th className="py-3 px-3">CAMP #</th>
                      <th className="py-3 px-3">ID</th>
                      <th className="py-3 px-3">Employee Name</th>
                      <th className="py-3 px-3">Division</th>
                      <th className="py-3 px-3">Cost Center</th>
                      <th className="py-3 px-3">Nationality</th>
                      <th className="py-3 px-3">Title</th>
                      <th className="py-3 px-3">Passport No</th>
                      <th className="py-3 px-3">Civil ID</th>
                      <th className="py-3 px-3">Room Grade</th>
                      <th className="py-3 px-3">Flat Code</th>
                      <th className="py-3 px-3">Room #</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Entry Date</th>
                      <th className="py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOccupants.map(occ => (
                      <tr key={occ.employeeId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{occ.srNo}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{occ.campNo}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-600">#{occ.employeeId}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{occ.employeeName}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-mono text-[10px] font-bold">
                            {occ.division}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{occ.costCenter}</td>
                        <td className="py-2.5 px-3 text-slate-700">{occ.nationality}</td>
                        <td className="py-2.5 px-3 text-slate-700">{occ.title}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{occ.passportNo}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{occ.civilId}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {occ.roomGrade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{occ.flatCode}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-600">{occ.roomNo}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            occ.employeeStatus === 'On Job' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : occ.employeeStatus === 'On Leave' ? 'bg-amber-100 text-amber-800' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {occ.employeeStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{occ.entryDate}</td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => setManageOccupantModal(occ)}
                            className="text-cyan-600 hover:underline font-semibold cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPORTS */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-600" />
                Occupancy & Free Spots by Camp Building
              </h3>
              <div className="space-y-3">
                {camps.map(camp => {
                  let beds = 0;
                  let occ = 0;
                  camp.floors.forEach(f => f.flats.forEach(ft => ft.rooms.forEach(r => {
                    beds += r.capacity;
                    occ += r.occupants.length;
                  })));
                  const free = beds - occ;
                  const pct = beds > 0 ? Math.round((occ / beds) * 100) : 0;

                  return (
                    <div key={camp.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{camp.campNo} — {camp.campArea}</span>
                        <span className="text-emerald-700">{free} Free / {beds} Total Beds ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-600" />
                Division & Project Cost Center Allocation
              </h3>
              <div className="space-y-2.5">
                {availableDivisions.map(div => {
                  const count = occupants.filter(o => o.division === div && o.employeeStatus !== 'Exited').length;
                  return (
                    <div key={div} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800">Division: {div}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 font-bold">{count} Active Employees</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADMIN */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  System Users & Role-Based Access Control (RBAC)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super Admins can directly assign or change user roles, camp scopes, and editing permissions, or reset passwords without viewing existing credentials.
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add System User
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Staff ID</th>
                      <th className="py-3.5 px-4">Name & Title</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Assign Role</th>
                      <th className="py-3.5 px-4">Camp Scope</th>
                      <th className="py-3.5 px-4">Editing Permissions (Click to Toggle)</th>
                      <th className="py-3.5 px-4">Password Privacy</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-600">{u.staffId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.title || 'Staff Member'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleInlineRoleChange(u.id, e.target.value)}
                            className={`text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                              u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-200' : u.role === 'CAMP_EDITOR' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="CAMP_EDITOR">CAMP_EDITOR</option>
                            <option value="AUDITOR">AUDITOR (Read-Only)</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={u.campScope}
                            onChange={(e) => handleInlineScopeChange(u.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            <option value="ALL">ALL</option>
                            {camps.map(c => (
                              <option key={c.id} value={c.campNo}>{c.campNo}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleUserPermission(u.id, 'canEditOccupants')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                u.permissions?.canEditOccupants ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              Edit Occupants
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleUserPermission(u.id, 'canAddCamps')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                u.permissions?.canAddCamps ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              Add Camps
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleUserPermission(u.id, 'canExportReports')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                u.permissions?.canExportReports ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              Export
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            •••••••• (Encrypted)
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingUserModal({ ...u, permissions: { ...u.permissions } })}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Settings className="w-3.5 h-3.5 text-slate-600" />
                              Edit Role
                            </button>
                            <button
                              onClick={() => {
                                setTargetUserForReset(u);
                                setShowResetPasswordModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-xs font-semibold border border-cyan-200 flex items-center gap-1 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              Reset Password
                            </button>
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => handleToggleUserStatus(u.id)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 cursor-pointer"
                              >
                                {u.status === 'Active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showAddCampModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Add Configurable Apartment / Camp Building
              </h3>
              <button onClick={() => setShowAddCampModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamp} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Camp Code</label>
                  <input
                    type="text"
                    required
                    value={newCampForm.campNo}
                    onChange={(e) => setNewCampForm({ ...newCampForm, campNo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Building Digit Prefix</label>
                  <input
                    type="text"
                    required
                    value={newCampForm.campDigit}
                    onChange={(e) => setNewCampForm({ ...newCampForm, campDigit: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Camp Area / Building Name</label>
                <input
                  type="text"
                  required
                  value={newCampForm.campArea}
                  onChange={(e) => setNewCampForm({ ...newCampForm, campArea: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">How many floors?</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={newCampForm.floorsCount}
                    onChange={(e) => setNewCampForm({ ...newCampForm, floorsCount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Flats per floor?</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newCampForm.flatsPerFloor}
                    onChange={(e) => setNewCampForm({ ...newCampForm, flatsPerFloor: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rooms per flat?</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={newCampForm.roomsPerFlat}
                    onChange={(e) => setNewCampForm({ ...newCampForm, roomsPerFlat: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-cyan-700">Room Capacity Rules</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Floor 1 (Engineer) Beds/Room</label>
                    <input
                      type="number"
                      value={newCampForm.floor1Capacity}
                      onChange={(e) => setNewCampForm({ ...newCampForm, floor1Capacity: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Upper Floors Beds/Room</label>
                    <input
                      type="number"
                      value={newCampForm.upperFloorCapacity}
                      onChange={(e) => setNewCampForm({ ...newCampForm, upperFloorCapacity: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCampModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
                >
                  Create Building in Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600" />
                Dhow Employee Room Assignment
              </h3>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs flex items-center justify-between">
              <span>Target Room: <strong>{checkInForm.roomNo}</strong> (Flat {checkInForm.flatCode})</span>
              <span className="font-bold text-cyan-700">{checkInForm.roomGrade} Grade</span>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6410"
                    value={checkInForm.employeeId}
                    onChange={(e) => setCheckInForm({ ...checkInForm, employeeId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Employee Full Name"
                    value={checkInForm.employeeName}
                    onChange={(e) => setCheckInForm({ ...checkInForm, employeeName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passport Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Passport #"
                    value={checkInForm.passportNo}
                    onChange={(e) => setCheckInForm({ ...checkInForm, passportNo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kuwait Civil ID (12 Digits)</label>
                  <input
                    type="text"
                    required
                    placeholder="29xxxxxxxxxx"
                    value={checkInForm.civilId}
                    onChange={(e) => setCheckInForm({ ...checkInForm, civilId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    required
                    value={checkInForm.division}
                    onChange={(e) => setCheckInForm({ ...checkInForm, division: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Center</label>
                  <input
                    type="text"
                    required
                    value={checkInForm.costCenter}
                    onChange={(e) => setCheckInForm({ ...checkInForm, costCenter: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={checkInForm.title}
                    onChange={(e) => setCheckInForm({ ...checkInForm, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold"
                >
                  Confirm Room Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageOccupantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Manage Occupant #{manageOccupantModal.employeeId}</h3>
              <button onClick={() => setManageOccupantModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900 text-sm">{manageOccupantModal.employeeName}</div>
              <div className="text-slate-600">{manageOccupantModal.title} • {manageOccupantModal.division} ({manageOccupantModal.costCenter})</div>
              <div className="text-slate-500 font-mono">Room: {manageOccupantModal.roomNo} | Civil ID: {manageOccupantModal.civilId}</div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-700">Update Attendance / Leave Status:</div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleUpdateOccupantStatus(manageOccupantModal.employeeId, 'On Job')}
                  className={`py-2.5 px-3 rounded-xl font-bold border ${manageOccupantModal.employeeStatus === 'On Job' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  Mark On Job
                </button>
                <button
                  onClick={() => handleUpdateOccupantStatus(manageOccupantModal.employeeId, 'On Leave')}
                  className={`py-2.5 px-3 rounded-xl font-bold border ${manageOccupantModal.employeeStatus === 'On Leave' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  Mark On Leave
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => handleUpdateOccupantStatus(manageOccupantModal.employeeId, 'Exited')}
                  className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold"
                >
                  Process Check-Out (Vacate Bed)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600" />
                Add System User Account
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Staff ID</label>
                  <input
                    type="text"
                    required
                    placeholder="EDT-025"
                    value={newUserForm.staffId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, staffId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@al-dhow.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Camp Boss"
                    value={newUserForm.title}
                    onChange={(e) => setNewUserForm({ ...newUserForm, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      setNewUserForm({ ...newUserForm, role: nextRole, ...getRoleDefaultPermissions(nextRole) });
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  >
                    <option value="CAMP_EDITOR">Camp Editor</option>
                    <option value="AUDITOR">Auditor (View Only)</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Camp Scope</label>
                  <select
                    value={newUserForm.campScope}
                    onChange={(e) => setNewUserForm({ ...newUserForm, campScope: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  >
                    <option value="ALL">ALL CAMPS</option>
                    {camps.map(c => (
                      <option key={c.id} value={c.campNo}>{c.campNo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-600" />
                Edit User Role & Permissions ({editingUserModal.staffId})
              </h3>
              <button onClick={() => setEditingUserModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUserModal.name}
                    onChange={(e) => setEditingUserModal({ ...editingUserModal, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editingUserModal.title || ''}
                    onChange={(e) => setEditingUserModal({ ...editingUserModal, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={editingUserModal.role}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      if (editingUserModal.id === currentUser.id && nextRole !== 'SUPER_ADMIN') {
                        alert('You cannot demote your own active Super Admin account.');
                        return;
                      }
                      setEditingUserModal({ ...editingUserModal, role: nextRole, permissions: getRoleDefaultPermissions(nextRole) });
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-cyan-700"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control)</option>
                    <option value="CAMP_EDITOR">CAMP_EDITOR (Can Edit)</option>
                    <option value="AUDITOR">AUDITOR (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Camp Scope</label>
                  <select
                    value={editingUserModal.campScope}
                    onChange={(e) => setEditingUserModal({ ...editingUserModal, campScope: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  >
                    <option value="ALL">ALL CAMPS</option>
                    {camps.map(c => (
                      <option key={c.id} value={c.campNo}>{c.campNo} — {c.campArea}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUserModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-md"
                >
                  Save Role & Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPasswordModal && targetUserForReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-600" />
                Reset User Password
              </h3>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setTargetUserForReset(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="text-slate-500">Resetting password for:</div>
              <div className="font-bold text-slate-900 mt-0.5">{targetUserForReset.name} ({targetUserForReset.email})</div>
            </div>

            {resetSuccessMessage ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {resetSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleExecutePasswordReset} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPasswordValue}
                    onChange={(e) => setConfirmPasswordValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPasswordModal(false);
                      setTargetUserForReset(null);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}