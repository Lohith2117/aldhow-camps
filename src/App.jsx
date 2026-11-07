import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2, Users, ShieldCheck, Eye, EyeOff, Lock, Mail, LogOut,
  Plus, Search, Filter, Download, CheckCircle2, AlertCircle, Trash2,
  UserPlus, KeyRound, Bed, Home, RefreshCw, X, ChevronRight, UserCheck,
  Calendar, Layers, FileSpreadsheet, BarChart3, Plane, Settings,
  Receipt, Printer, Edit3, SlidersHorizontal, ArrowRightLeft, History,
  Clock, MapPin, AlertTriangle, Archive, Tag, Briefcase
} from 'lucide-react';
import dhowLogoImg from './assets/dhow-logo.png';

// ==========================================
// 1. OFFICIAL DHOW LOGO COMPONENT
// ==========================================
const DhowLogo = ({ className = "h-8 w-auto" }) => (
  <img
    src={dhowLogoImg}
    alt="Dhow Engineering"
    className={className}
  />
);

// ==========================================
// 2. HELPER: LIVE TENURE DURATION CALCULATOR
// ==========================================
function calculateTenure(startDateStr, endDateStr = null) {
  if (!startDateStr) return 'N/A';
  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  if (isNaN(start.getTime())) return 'N/A';

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const parts = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
  parts.push(`${days} day${days !== 1 ? 's' : ''}`);

  return `${parts.join(', ')} (${diffDays.toLocaleString()} total days)`;
}

// ==========================================
// 3. MASTER COST CENTERS REGISTRY
// ==========================================
const INITIAL_COST_CENTERS = [
  { id: 'cc-1', code: '1IDS038-KIPIC', name: 'KIPIC Al-Zour Refinery Site', division: 'IDS', status: 'Active' },
  { id: 'cc-2', code: '1IDS051-KNPC', name: 'KNPC Clean Fuels Project', division: 'IDS', status: 'Active' },
  { id: 'cc-3', code: '1MEP019-KNPC', name: 'KNPC Electrical & Mechanical Maintenance', division: 'MEP', status: 'Active' },
  { id: 'cc-4', code: '1CIV011-KOC', name: 'KOC Heavy Civil & Pipeline Works', division: 'CIVIL', status: 'Active' },
  { id: 'cc-5', code: '1CIV014-MEW', name: 'MEW Substation Infrastructure', division: 'CIVIL', status: 'Active' }
];

// ==========================================
// 4. INITIAL SYSTEM USERS (RBAC & AUTH)
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
    lastLogin: '2026-11-06 10:20 AM'
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
    },
    lastLogin: '2026-11-05 04:15 PM'
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
    lastLogin: '2026-11-04 09:30 AM'
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
      canDeleteCamps: true,
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
// 5. INITIAL CAMPS (PER-FLAT GRADE MODEL)
// ==========================================
const INITIAL_CAMPS = [
  {
    id: 'camp-1',
    campNo: 'CAMP-01',
    campArea: 'Farwaniya 1',
    costCenter: '1ACD000',
    campDigit: '1',
    status: 'Active',
    floors: [
      {
        floorNo: 1,
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
            flatCode: '1-01-02-L',
            roomGrade: 'Labor',
            rooms: [
              { roomNo: '1-01-02-A', capacity: 3, occupants: ['5912'] },
              { roomNo: '1-01-02-B', capacity: 3, occupants: [] },
              { roomNo: '1-01-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '1-01-03-L',
            roomGrade: 'Labor',
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
            flatCode: '1-02-02-L',
            roomGrade: 'Labor',
            rooms: [
              { roomNo: '1-02-02-A', capacity: 3, occupants: [] },
              { roomNo: '1-02-02-B', capacity: 3, occupants: [] },
              { roomNo: '1-02-02-C', capacity: 3, occupants: [] },
            ]
          },
          {
            flatNo: 3,
            flatCode: '1-02-03-L',
            roomGrade: 'Labor',
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
    status: 'Active',
    floors: [
      {
        floorNo: 1,
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
            flatCode: '2-01-02-L',
            roomGrade: 'Labor',
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
// 6. INITIAL OCCUPANTS
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
    remarks: 'Master Record Row 3',
    stayHistory: [
      {
        campNo: 'CAMP-01',
        campArea: 'Farwaniya 1',
        flatCode: '1-02-01-F',
        roomNo: '1-02-01-A',
        roomGrade: 'Foreman',
        costCenter: '1IDS038-KIPIC',
        startDate: '2022-04-10',
        endDate: '2023-09-15',
        reason: 'Initial AFR Bed Allocation on Joining'
      },
      {
        campNo: 'CAMP-02',
        campArea: 'Mahboula Block B',
        flatCode: '2-01-01-E',
        roomNo: '2-01-01-B',
        roomGrade: 'Engineer',
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
    remarks: '',
    stayHistory: [
      {
        campNo: 'CAMP-01',
        campArea: 'Farwaniya 1',
        flatCode: '1-01-02-E',
        roomNo: '1-01-02-B',
        roomGrade: 'Engineer',
        costCenter: '1IDS038-KIPIC',
        startDate: '2023-02-14',
        endDate: '2024-01-10',
        reason: 'Initial check-in'
      }
    ]
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
    title: 'QA/QC Engineer',
    productivityType: 'DE',
    entryDate: '2022-11-20',
    passportNo: 'PK4491823',
    civilId: '290121003412',
    roomGrade: 'Labor',
    campArea: 'Farwaniya 1',
    floorNo: 1,
    flatNo: 2,
    flatCode: '1-01-02-L',
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
    remarks: '',
    stayHistory: []
  }
];

export default function App() {
  // ==========================================
  // STATE PERSISTENCE & MANAGEMENT
  // ==========================================
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_users_v9');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_session_v9');
    return saved ? JSON.parse(saved) : null;
  });

  const [camps, setCamps] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_camps_v9');
    return saved ? JSON.parse(saved) : INITIAL_CAMPS;
  });

  const [occupants, setOccupants] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_occupants_v9');
    return saved ? JSON.parse(saved) : INITIAL_OCCUPANTS;
  });

  const [costCenters, setCostCenters] = useState(() => {
    const saved = localStorage.getItem('dhow_camp_cost_centers_v1');
    return saved ? JSON.parse(saved) : INITIAL_COST_CENTERS;
  });

  // Navigation Tabs: 'map' | 'occupants' | 'invoicing' | 'reports' | 'admin'
  const [activeTab, setActiveTab] = useState('map');
  const [selectedCampId, setSelectedCampId] = useState(INITIAL_CAMPS[0].id);
  const [selectedFloorNo, setSelectedFloorNo] = useState(1);

  // Invoicing Rate Card (KWD / month)
  const [rates, setRates] = useState({
    engineer: 120,
    foreman: 65,
    labor: 45
  });
  const [billingPeriod, setBillingPeriod] = useState('November 2026');
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState(null);

  // Universal Header Search & Dossier States
  const [universalSearchQuery, setUniversalSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [viewingEmployeeDossier, setViewingEmployeeDossier] = useState(null);

  // Cost Center Management States
  const [showManageCostCentersModal, setShowManageCostCentersModal] = useState(false);
  const [editingCostCenterModal, setEditingCostCenterModal] = useState(null);
  const [newCostCenterForm, setNewCostCenterForm] = useState({
    code: '',
    name: '',
    division: 'IDS'
  });

  // Relocation Transfer Modal State
  const [relocatingOccupant, setRelocatingOccupant] = useState(null);
  const [relocationForm, setRelocationForm] = useState({
    targetCampId: '',
    targetFloorNo: '',
    targetFlatCode: '',
    targetRoomNo: '',
    transferDate: '2026-11-06',
    reason: 'Project Site Reallocation'
  });

  // Decommission Lockout Warning Modal State
  const [decommissionLockoutModal, setDecommissionLockoutModal] = useState(null);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Building & User Modals
  const [showAddCampModal, setShowAddCampModal] = useState(false);
  const [editingCampModal, setEditingCampModal] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [manageOccupantModal, setManageOccupantModal] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserModal, setEditingUserModal] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [targetUserForReset, setTargetUserForReset] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');

  // New Camp Wizard State
  const [newCampForm, setNewCampForm] = useState({
    campNo: 'CAMP-03',
    campArea: 'Fahaheel Block A',
    campDigit: '3',
    floorsCount: 3,
    flatsPerFloor: 3,
    roomsPerFlat: 3,
    floor1EngineerFlats: 1
  });

  // Check-In Form State
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
    entryDate: '2026-11-06'
  });

  // New User Form State
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
    canDeleteCamps: true,
    canEditOccupants: true,
    canExportReports: true,
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('dhow_camp_users_v9', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('dhow_camp_camps_v9', JSON.stringify(camps));
  }, [camps]);

  useEffect(() => {
    localStorage.setItem('dhow_camp_occupants_v9', JSON.stringify(occupants));
  }, [occupants]);

  useEffect(() => {
    localStorage.setItem('dhow_camp_cost_centers_v1', JSON.stringify(costCenters));
  }, [costCenters]);

  useEffect(() => {
    if (currentUser && rememberMe) {
      localStorage.setItem('dhow_camp_session_v9', JSON.stringify(currentUser));
    } else if (!currentUser) {
      localStorage.removeItem('dhow_camp_session_v9');
    }
  }, [currentUser, rememberMe]);

  // Auth Handlers
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
    localStorage.removeItem('dhow_camp_session_v9');
    setActiveTab('map');
  };

  // Only active camps appear on interactive map
  const activeCamps = useMemo(() => {
    return camps.filter(c => c.status !== 'Decommissioned');
  }, [camps]);

  // Global Bed & Occupant Computations
  const globalStats = useMemo(() => {
    let totalFlats = 0;
    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;

    activeCamps.forEach(camp => {
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
      campsCount: activeCamps.length,
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
  }, [activeCamps, occupants]);

  const activeCamp = useMemo(() => {
    return activeCamps.find(c => c.id === selectedCampId) || activeCamps[0] || camps[0];
  }, [activeCamps, camps, selectedCampId]);

  const activeFloor = useMemo(() => {
    if (!activeCamp) return null;
    return activeCamp.floors.find(f => f.floorNo === selectedFloorNo) || activeCamp.floors[0];
  }, [activeCamp, selectedFloorNo]);

  // Universal Header Search Filtering
  const universalSearchResults = useMemo(() => {
    const q = universalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return occupants.filter(occ =>
      occ.employeeId.toLowerCase().includes(q) ||
      occ.employeeName.toLowerCase().includes(q) ||
      occ.civilId.toString().includes(q) ||
      occ.passportNo.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [occupants, universalSearchQuery]);

  // Filtered Occupants Table
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
    return Array.from(new Set(costCenters.map(c => c.division))).filter(Boolean);
  }, [costCenters]);

  // Monthly Invoicing Rollup
  const projectInvoicingData = useMemo(() => {
    const activeOccupants = occupants.filter(o => o.employeeStatus !== 'Exited');
    const costCenterMap = {};

    activeOccupants.forEach(occ => {
      const cc = occ.costCenter || 'Unassigned';
      if (!costCenterMap[cc]) {
        const found = costCenters.find(c => c.code === cc);
        costCenterMap[cc] = {
          costCenter: cc,
          projectName: found ? found.name : 'Direct Project Site',
          division: occ.division || (found ? found.division : 'General'),
          totalOccupants: 0,
          engineerBeds: 0,
          foremanBeds: 0,
          laborBeds: 0,
          totalAmountKWD: 0,
          occupants: []
        };
      }

      costCenterMap[cc].totalOccupants += 1;
      costCenterMap[cc].occupants.push(occ);

      let bedCost = rates.labor;
      if (occ.roomGrade === 'Engineer') {
        costCenterMap[cc].engineerBeds += 1;
        bedCost = rates.engineer;
      } else if (occ.roomGrade === 'Foreman') {
        costCenterMap[cc].foremanBeds += 1;
        bedCost = rates.foreman;
      } else {
        costCenterMap[cc].laborBeds += 1;
        bedCost = rates.labor;
      }

      costCenterMap[cc].totalAmountKWD += bedCost;
    });

    const items = Object.values(costCenterMap);
    const grandTotalKWD = items.reduce((acc, curr) => acc + curr.totalAmountKWD, 0);

    return {
      items,
      grandTotalKWD,
      totalBilledEmployees: activeOccupants.length
    };
  }, [occupants, costCenters, rates]);

  // =========================================================
  // COST CENTER ADDITION & EDITING LOGIC
  // =========================================================
  const handleCreateCostCenter = (e) => {
    e.preventDefault();
    const cleanCode = newCostCenterForm.code.trim().toUpperCase();
    if (!cleanCode) return;

    if (costCenters.some(c => c.code === cleanCode)) {
      alert(`Cost Center code "${cleanCode}" already exists.`);
      return;
    }

    const newCC = {
      id: `cc-${Date.now()}`,
      code: cleanCode,
      name: newCostCenterForm.name.trim() || 'Project Site',
      division: newCostCenterForm.division,
      status: 'Active'
    };

    setCostCenters(prev => [...prev, newCC]);
    setNewCostCenterForm({ code: '', name: '', division: 'IDS' });
  };

  const handleSaveEditCostCenter = (e) => {
    e.preventDefault();
    if (!editingCostCenterModal) return;

    const oldCC = costCenters.find(c => c.id === editingCostCenterModal.id);
    const oldCode = oldCC?.code;
    const newCode = editingCostCenterModal.code.trim().toUpperCase();
    const newDivision = editingCostCenterModal.division;

    // Cascade update to occupants if cost center code changed
    if (oldCode && oldCode !== newCode) {
      setOccupants(prev =>
        prev.map(occ => {
          if (occ.costCenter === oldCode) {
            return { ...occ, costCenter: newCode, division: newDivision };
          }
          return occ;
        })
      );
    }

    setCostCenters(prev =>
      prev.map(c => (c.id === editingCostCenterModal.id ? {
        ...editingCostCenterModal,
        code: newCode,
        name: editingCostCenterModal.name.trim()
      } : c))
    );

    setEditingCostCenterModal(null);
  };

  const handleToggleCostCenterStatus = (id) => {
    setCostCenters(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  // Granular Flat Grade Switcher
  const handleFlatGradeChange = (campId, floorNo, flatCode, newGrade) => {
    const newCapacity = newGrade === 'Engineer' ? 2 : 3;
    const targetCamp = camps.find(c => c.id === campId);
    const targetFloor = targetCamp?.floors.find(f => f.floorNo === floorNo);
    const targetFlat = targetFloor?.flats.find(f => f.flatCode === flatCode);

    if (!targetFlat) return;

    const overCapacityRoom = targetFlat.rooms.find(r => r.occupants.length > newCapacity);
    if (overCapacityRoom) {
      alert(`Capacity Conflict: Room ${overCapacityRoom.roomNo} currently has ${overCapacityRoom.occupants.length} occupants. You cannot switch this flat to ${newGrade} (${newCapacity} beds/room) until excess occupants are relocated or checked out.`);
      return;
    }

    const gradeSuffix = newGrade === 'Engineer' ? 'E' : newGrade === 'Foreman' ? 'F' : 'L';
    const flatParts = flatCode.split('-');
    flatParts[3] = gradeSuffix;
    const newFlatCode = flatParts.join('-');

    setCamps(prevCamps =>
      prevCamps.map(camp => {
        if (camp.id !== campId) return camp;
        return {
          ...camp,
          floors: camp.floors.map(floor => {
            if (floor.floorNo !== floorNo) return floor;
            return {
              ...floor,
              flats: floor.flats.map(flat => {
                if (flat.flatCode !== flatCode) return flat;
                return {
                  ...flat,
                  flatCode: newFlatCode,
                  roomGrade: newGrade,
                  rooms: flat.rooms.map(room => ({
                    ...room,
                    capacity: newCapacity
                  }))
                };
              })
            };
          })
        };
      })
    );

    setOccupants(prevOccs =>
      prevOccs.map(occ => {
        if (occ.campNo === targetCamp.campNo && occ.floorNo === floorNo && occ.flatCode === flatCode) {
          return {
            ...occ,
            flatCode: newFlatCode,
            roomGrade: newGrade
          };
        }
        return occ;
      })
    );
  };

  // Staged Floor Editing (Draft Safe)
  const handleSaveCampEdits = (e) => {
    e.preventDefault();
    if (!editingCampModal) return;

    setCamps(prev =>
      prev.map(c => (c.id === editingCampModal.id ? editingCampModal : c))
    );
    setEditingCampModal(null);
  };

  const handleAddFloorDraft = () => {
    if (!editingCampModal) return;
    const nextFloorNo = editingCampModal.floors.length + 1;
    const campDigit = editingCampModal.campDigit || '1';
    const flStr = String(nextFloorNo).padStart(2, '0');

    const newFlats = [1, 2, 3].map(flNum => ({
      flatNo: flNum,
      flatCode: `${campDigit}-${flStr}-${String(flNum).padStart(2, '0')}-L`,
      roomGrade: 'Labor',
      rooms: [
        { roomNo: `${campDigit}-${flStr}-${String(flNum).padStart(2, '0')}-A`, capacity: 3, occupants: [] },
        { roomNo: `${campDigit}-${flStr}-${String(flNum).padStart(2, '0')}-B`, capacity: 3, occupants: [] },
        { roomNo: `${campDigit}-${flStr}-${String(flNum).padStart(2, '0')}-C`, capacity: 3, occupants: [] },
      ]
    }));

    setEditingCampModal(prev => ({
      ...prev,
      floors: [...prev.floors, { floorNo: nextFloorNo, flats: newFlats }]
    }));
  };

  const handleRemoveFloorDraft = () => {
    if (!editingCampModal || editingCampModal.floors.length <= 1) return;
    const lastFloor = editingCampModal.floors[editingCampModal.floors.length - 1];

    let hasOccupants = false;
    lastFloor.flats.forEach(fl =>
      fl.rooms.forEach(rm => {
        if (rm.occupants.length > 0) hasOccupants = true;
      })
    );

    if (hasOccupants) {
      alert(`Cannot remove Floor ${lastFloor.floorNo} because it contains active occupants.`);
      return;
    }

    setEditingCampModal(prev => ({
      ...prev,
      floors: prev.floors.slice(0, -1)
    }));
  };

  // Safe Camp Decommissioning
  const handleAttemptDecommissionCamp = (camp) => {
    const remainingOccupants = occupants.filter(
      o => o.campNo === camp.campNo && o.employeeStatus !== 'Exited'
    );

    if (remainingOccupants.length > 0) {
      setDecommissionLockoutModal({
        camp,
        occupants: remainingOccupants
      });
      return;
    }

    if (confirm(`Confirm Decommissioning of ${camp.campNo} (${camp.campArea})?\n\nThis will safely archive the facility. It will be hidden from the active check-in map but preserved in all historical audits and past invoices.`)) {
      setCamps(prev =>
        prev.map(c => c.id === camp.id ? { ...c, status: 'Decommissioned' } : c)
      );
      setEditingCampModal(null);
      const remainingActive = activeCamps.filter(c => c.id !== camp.id);
      if (remainingActive.length > 0) {
        setSelectedCampId(remainingActive[0].id);
        setSelectedFloorNo(1);
      }
    }
  };

  // 1-Click Bed Relocation Engine
  const handleOpenRelocateModal = (occ) => {
    const defaultCamp = activeCamps[0] || camps[0];
    const defaultFloor = defaultCamp.floors[0];
    const defaultFlat = defaultFloor.flats[0];
    const defaultRoom = defaultFlat.rooms.find(r => r.occupants.length < r.capacity) || defaultFlat.rooms[0];

    setRelocatingOccupant(occ);
    setRelocationForm({
      targetCampId: defaultCamp.id,
      targetFloorNo: defaultFloor.floorNo,
      targetFlatCode: defaultFlat.flatCode,
      targetRoomNo: defaultRoom.roomNo,
      transferDate: '2026-11-06',
      reason: 'Project Site Reallocation'
    });
  };

  const handleExecuteRelocation = (e) => {
    e.preventDefault();
    if (!relocatingOccupant) return;

    const targetCamp = camps.find(c => c.id === relocationForm.targetCampId);
    const targetFloor = targetCamp?.floors.find(f => f.floorNo === Number(relocationForm.targetFloorNo));
    const targetFlat = targetFloor?.flats.find(f => f.flatCode === relocationForm.targetFlatCode);
    const targetRoom = targetFlat?.rooms.find(r => r.roomNo === relocationForm.targetRoomNo);

    if (!targetRoom || targetRoom.occupants.length >= targetRoom.capacity) {
      alert('Selected target room is currently at full capacity. Please select an open spot.');
      return;
    }

    const previousStayRecord = {
      campNo: relocatingOccupant.campNo,
      campArea: relocatingOccupant.campArea,
      flatCode: relocatingOccupant.flatCode,
      roomNo: relocatingOccupant.roomNo,
      roomGrade: relocatingOccupant.roomGrade,
      costCenter: relocatingOccupant.costCenter,
      startDate: relocatingOccupant.entryDate,
      endDate: relocationForm.transferDate,
      reason: relocationForm.reason || 'Inter-Camp Bed Transfer'
    };

    const updatedStayHistory = [
      ...(relocatingOccupant.stayHistory || []),
      previousStayRecord
    ];

    setCamps(prevCamps =>
      prevCamps.map(c => ({
        ...c,
        floors: c.floors.map(fl => ({
          ...fl,
          flats: fl.flats.map(flat => ({
            ...flat,
            rooms: flat.rooms.map(rm => {
              if (rm.roomNo === relocatingOccupant.roomNo) {
                return { ...rm, occupants: rm.occupants.filter(id => id !== relocatingOccupant.employeeId) };
              }
              if (rm.roomNo === targetRoom.roomNo) {
                return { ...rm, occupants: [...rm.occupants, relocatingOccupant.employeeId] };
              }
              return rm;
            })
          }))
        }))
      }))
    );

    const updatedOccupant = {
      ...relocatingOccupant,
      campNo: targetCamp.campNo,
      campArea: targetCamp.campArea,
      floorNo: targetFloor.floorNo,
      flatNo: targetFlat.flatNo,
      flatCode: targetFlat.flatCode,
      roomNo: targetRoom.roomNo,
      roomGrade: targetFlat.roomGrade,
      entryDate: relocationForm.transferDate,
      stayHistory: updatedStayHistory
    };

    setOccupants(prevOccs =>
      prevOccs.map(o => o.employeeId === relocatingOccupant.employeeId ? updatedOccupant : o)
    );

    if (viewingEmployeeDossier && viewingEmployeeDossier.employeeId === relocatingOccupant.employeeId) {
      setViewingEmployeeDossier(updatedOccupant);
    }

    setRelocatingOccupant(null);
    alert(`Successfully relocated #${relocatingOccupant.employeeId} (${relocatingOccupant.employeeName}) to ${targetCamp.campNo} Room ${targetRoom.roomNo}!`);
  };

  // Create New Camp
  const handleCreateCamp = (e) => {
    e.preventDefault();
    const campDigit = newCampForm.campDigit || String(camps.length + 1);
    const totalFloors = parseInt(newCampForm.floorsCount, 10);
    const flatsPerFl = parseInt(newCampForm.flatsPerFloor, 10);
    const roomsPerFl = parseInt(newCampForm.roomsPerFlat, 10);
    const engFlatsOnFloor1 = parseInt(newCampForm.floor1EngineerFlats, 10);

    const generatedFloors = [];
    for (let f = 1; f <= totalFloors; f++) {
      const floorFlats = [];
      for (let fl = 1; fl <= flatsPerFl; fl++) {
        const floorStr = String(f).padStart(2, '0');
        const flatStr = String(fl).padStart(2, '0');

        const isEngineerFlat = f === 1 && fl <= engFlatsOnFloor1;
        const flatGrade = isEngineerFlat ? 'Engineer' : 'Labor';
        const gradeInitial = isEngineerFlat ? 'E' : 'L';
        const roomCapacity = isEngineerFlat ? 2 : 3;

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
          flatCode: `${campDigit}-${floorStr}-${flatStr}-${gradeInitial}`,
          roomGrade: flatGrade,
          rooms: flatRooms
        });
      }

      generatedFloors.push({
        floorNo: f,
        flats: floorFlats
      });
    }

    const newCampObj = {
      id: `camp-${Date.now()}`,
      campNo: newCampForm.campNo,
      campArea: newCampForm.campArea,
      costCenter: '1ACD000',
      campDigit,
      status: 'Active',
      floors: generatedFloors
    };

    setCamps(prev => [...prev, newCampObj]);
    setSelectedCampId(newCampObj.id);
    setSelectedFloorNo(1);
    setShowAddCampModal(false);
  };

  // Operational Handlers (Check-In & Status)
  const openQuickAssignModal = (camp, floor, flat, room) => {
    if (!currentUser.permissions.canEditOccupants && currentUser.role !== 'SUPER_ADMIN') {
      alert('Read-Only Access: You do not have permission to check in employees.');
      return;
    }
    const activeCCs = costCenters.filter(c => c.status === 'Active');
    const defaultCC = activeCCs[0] || { code: '1IDS038-KIPIC', division: 'IDS' };

    setCheckInForm({
      ...checkInForm,
      campId: camp.id,
      floorNo: floor.floorNo,
      flatCode: flat.flatCode,
      roomNo: room.roomNo,
      roomGrade: flat.roomGrade,
      costCenter: defaultCC.code,
      division: defaultCC.division,
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
      remarks: 'Checked in via Dhow Portal',
      stayHistory: []
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
      if (viewingEmployeeDossier && viewingEmployeeDossier.employeeId === empId) {
        setViewingEmployeeDossier(prev => ({ ...prev, employeeStatus: 'Exited', exitDate: today }));
      }
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
      if (viewingEmployeeDossier && viewingEmployeeDossier.employeeId === empId) {
        setViewingEmployeeDossier(prev => ({ ...prev, employeeStatus: newStatus }));
      }
    }
  };

  // RBAC User Actions
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
      canDeleteCamps: true,
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
          const updatedPerms = { ...u.permissions, [permKey]: !u.permissions[permKey] };
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
      prev.map(u => (u.id === targetUserForReset.id ? { ...u, passwordHash: newPasswordValue } : u))
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
      prev.map(u => (u.id === userId ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u))
    );
  };

  // CSV Exporters
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

  const handleExportInvoicingCSV = () => {
    const headers = [
      'Project Cost Center', 'Project Name', 'Division', 'Billing Period', 'Credited Cost Center',
      'Engineer Beds', 'Foreman Beds', 'Labor Beds', 'Total Active Employees', 'Total Recharge Amount (KWD)'
    ];

    const rows = projectInvoicingData.items.map(item => [
      `"${item.costCenter}"`, `"${item.projectName}"`, `"${item.division}"`, `"${billingPeriod}"`, `"1ACD000"`,
      item.engineerBeds, item.foremanBeds, item.laborBeds, item.totalOccupants, `${item.totalAmountKWD.toFixed(3)} KWD`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dhow_InterDept_Recharge_${billingPeriod.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================
  // VIEW 1: SIGN-IN SCREEN
  // =========================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased">
        <div className="w-full pt-4" />

        <div className="w-full max-w-[440px] mx-auto my-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-lg mb-3">
              <DhowLogo className="h-10 w-auto" />
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
                For security reasons, passwords are encrypted and cannot be viewed. Please contact the Super Administrator:
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
      {/* TOP NAVY HEADER WITH UNIVERSAL EMPLOYEE SEARCH          */}
      {/* ======================================================= */}
      <header className="bg-[#0f172a] text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="bg-white px-3 py-2 rounded-xl shadow-md shrink-0 flex items-center justify-center">
              <DhowLogo className="h-7 w-auto" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Camp Management System
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

          {/* UNIVERSAL SEARCH BAR & QUICK ACTIONS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Emp ID (e.g. 5838) / Name..."
                  value={universalSearchQuery}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  onChange={(e) => {
                    setUniversalSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && universalSearchResults.length > 0) {
                      setViewingEmployeeDossier(universalSearchResults[0]);
                      setIsSearchDropdownOpen(false);
                    }
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                />
                {universalSearchQuery && (
                  <button
                    onClick={() => {
                      setUniversalSearchQuery('');
                      setIsSearchDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isSearchDropdownOpen && universalSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-950">
                    Matching Occupants ({universalSearchResults.length})
                  </div>
                  <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                    {universalSearchResults.map(occ => (
                      <div
                        key={occ.employeeId}
                        onClick={() => {
                          setViewingEmployeeDossier(occ);
                          setIsSearchDropdownOpen(false);
                          setUniversalSearchQuery('');
                        }}
                        className="p-3 hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-cyan-400 font-bold text-xs">#{occ.employeeId}</span>
                            <span className="font-semibold text-white text-xs truncate">{occ.employeeName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {occ.campNo} • Room {occ.roomNo} ({occ.roomGrade}) • {occ.division}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                          View Dossier →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {canAddCamps && (
              <button
                onClick={() => setShowAddCampModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Apartment</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 5 NAVIGATION TABS */}
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
            onClick={() => setActiveTab('invoicing')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'invoicing'
                ? 'bg-slate-800/90 text-white border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Monthly Invoicing & Cost Center Recharge</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
              {projectInvoicingData.grandTotalKWD.toFixed(0)} KWD
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
            <span>Vacancy & Division Reports</span>
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowManageCostCentersModal(true)}
              className="text-cyan-700 hover:text-cyan-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Manage Project Cost Centers ({costCenters.length})</span>
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                <span>User Roles & RBAC →</span>
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
              <span>Active Camps</span>
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
              Dynamic Per Flat Grade
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

        {/* ======================================================= */}
        {/* TAB 1: INTERACTIVE APARTMENT MAP (WITH EDITABLE FLATS) */}
        {/* ======================================================= */}
        {activeTab === 'map' && activeCamp && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
                    SELECT APARTMENT BUILDING:
                  </span>

                  {activeCamps.map(camp => {
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
                </div>

                <div className="flex items-center gap-2">
                  {canAddCamps && activeCamp && (
                    <button
                      onClick={() => setEditingCampModal({ ...activeCamp })}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                    >
                      <Edit3 className="w-4 h-4 text-slate-600" />
                      <span>Edit {activeCamp.campNo}</span>
                    </button>
                  )}

                  {canAddCamps && (
                    <button
                      onClick={() => setShowAddCampModal(true)}
                      className="px-3.5 py-2.5 rounded-xl border-2 border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Building</span>
                    </button>
                  )}
                </div>
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

            {/* Floor Cards (Mixed Flat Grade Summary) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeCamp.floors.map(floor => {
                let flBeds = 0;
                let flOcc = 0;
                let engFlatsCount = 0;
                let otherFlatsCount = 0;

                floor.flats.forEach(ft => {
                  if (ft.roomGrade === 'Engineer') engFlatsCount += 1;
                  else otherFlatsCount += 1;

                  ft.rooms.forEach(rm => {
                    flBeds += rm.capacity;
                    flOcc += rm.occupants.length;
                  });
                });

                const flFree = flBeds - flOcc;
                const flPct = flBeds > 0 ? Math.round((flOcc / flBeds) * 100) : 0;
                const isFloorSelected = floor.floorNo === activeFloor?.floorNo;

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
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {engFlatsCount > 0 ? `${engFlatsCount} Eng Flat${engFlatsCount > 1 ? 's' : ''}` : 'Labor / Foreman'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{flFree} Free</span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium mb-3">
                      {floor.flats.length} Flats ({engFlatsCount} Engineer • {otherFlatsCount} Labor/Foreman)
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

            {/* Flats & Rooms Grid (With 1-Click Flat Grade Selector) */}
            {activeFloor && (
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
                      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-black tracking-tight">Flat {flat.flatCode}</div>
                          <div className="text-[11px] text-slate-400">
                            Floor {activeFloor.floorNo} • Flat #{flat.flatNo}
                          </div>
                        </div>

                        {/* INLINE FLAT GRADE SWITCHER */}
                        <div className="flex items-center gap-2">
                          <select
                            value={flat.roomGrade}
                            disabled={!canAddCamps}
                            onChange={(e) =>
                              handleFlatGradeChange(
                                activeCamp.id,
                                activeFloor.floorNo,
                                flat.flatCode,
                                e.target.value
                              )
                            }
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                              flat.roomGrade === 'Engineer'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                                : flat.roomGrade === 'Foreman'
                                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                                : 'bg-amber-950 text-amber-300 border-amber-700'
                            }`}
                            title="Change Flat Designation (Engineer: 2 beds/rm, Labor/Foreman: 3 beds/rm)"
                          >
                            <option value="Engineer">Engineer (2/rm)</option>
                            <option value="Foreman">Foreman (3/rm)</option>
                            <option value="Labor">Labor (3/rm)</option>
                          </select>

                          <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                            {flatOcc}/{flatCap}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-4 flex-1 bg-slate-50/40">
                        {flat.rooms.map(room => {
                          const occCount = room.occupants.length;
                          return (
                            <div key={room.roomNo} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-800">
                                  Room {room.roomNo}{' '}
                                  <span className="text-slate-400 font-normal">
                                    ({flat.roomGrade} • Max {room.capacity})
                                  </span>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  occCount === room.capacity
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                                      <div
                                        key={empId}
                                        className={`p-3 rounded-xl border transition-all ${
                                          isOnLeave ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50/80 border-slate-200/90'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="bg-slate-900 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                                              #{occ.employeeId}
                                            </span>
                                            <span className="text-xs font-bold text-slate-900 truncate">
                                              {occ.employeeName}
                                            </span>
                                          </div>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                            isOnLeave ? 'bg-amber-200/80 text-amber-900' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                          }`}>
                                            {isOnLeave ? '✈ On Leave' : 'On Job'}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-1.5 text-[11px]">
                                          <span className="text-slate-500 truncate">
                                            {occ.title} • <strong className="text-slate-700">{occ.division} ({occ.costCenter})</strong>
                                          </span>
                                          <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <button
                                              onClick={() => setViewingEmployeeDossier(occ)}
                                              className="text-cyan-600 hover:text-cyan-800 font-semibold cursor-pointer"
                                            >
                                              History →
                                            </button>
                                            <button
                                              onClick={() => setManageOccupantModal(occ)}
                                              className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                                            >
                                              Manage
                                            </button>
                                          </div>
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
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: 31-COLUMN OCCUPANTS LIST                         */}
        {/* ======================================================= */}
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
                      <th className="py-3 px-3">Room Grade</th>
                      <th className="py-3 px-3">Flat Code</th>
                      <th className="py-3 px-3">Room #</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Room Entry</th>
                      <th className="py-3 px-3">Stay Tenure</th>
                      <th className="py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOccupants.map(occ => (
                      <tr key={occ.employeeId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{occ.srNo}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{occ.campNo}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-600">
                          <button
                            onClick={() => setViewingEmployeeDossier(occ)}
                            className="hover:underline cursor-pointer"
                          >
                            #{occ.employeeId}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <button
                            onClick={() => setViewingEmployeeDossier(occ)}
                            className="hover:text-cyan-700 text-left cursor-pointer"
                          >
                            {occ.employeeName}
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-mono text-[10px] font-bold">
                            {occ.division}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{occ.costCenter}</td>
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
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {calculateTenure(occ.entryDate, occ.employeeStatus === 'Exited' ? occ.exitDate : null)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingEmployeeDossier(occ)}
                              className="text-cyan-600 hover:underline font-semibold cursor-pointer"
                            >
                              History
                            </button>
                            <button
                              onClick={() => setManageOccupantModal(occ)}
                              className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                            >
                              Manage
                            </button>
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

        {/* ======================================================= */}
        {/* TAB 3: MONTHLY INVOICING & PROJECT RECHARGE MODULE      */}
        {/* ======================================================= */}
        {activeTab === 'invoicing' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    Inter-Department Camp Recharge & Project Invoicing
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly recharge debited to project cost centers and credited to Camp Cost Center <strong>1ACD000</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    className="bg-slate-50 border border-slate-300 font-bold text-xs rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="November 2026">Billing Period: November 2026</option>
                    <option value="October 2026">Billing Period: October 2026</option>
                    <option value="December 2026">Billing Period: December 2026</option>
                  </select>

                  <button
                    onClick={() => setShowManageCostCentersModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    Manage Cost Centers
                  </button>

                  <button
                    onClick={handleExportInvoicingCSV}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Billing CSV
                  </button>
                </div>
              </div>

              {/* Bed Rate Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                  Monthly Bed Recharge Rate Card:
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-medium">Engineer:</span>
                    <input
                      type="number"
                      value={rates.engineer}
                      onChange={(e) => setRates({ ...rates, engineer: Number(e.target.value) })}
                      className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right font-bold text-cyan-700"
                    />
                    <span className="text-slate-500 font-mono">KWD</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-medium">Foreman:</span>
                    <input
                      type="number"
                      value={rates.foreman}
                      onChange={(e) => setRates({ ...rates, foreman: Number(e.target.value) })}
                      className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right font-bold text-indigo-700"
                    />
                    <span className="text-slate-500 font-mono">KWD</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-medium">Labor:</span>
                    <input
                      type="number"
                      value={rates.labor}
                      onChange={(e) => setRates({ ...rates, labor: Number(e.target.value) })}
                      className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right font-bold text-amber-700"
                    />
                    <span className="text-slate-500 font-mono">KWD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoicing Roll-up Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="font-bold text-slate-800">
                  {projectInvoicingData.items.length} Active Project Cost Centers Billed
                </div>
                <div className="text-emerald-700 font-black text-sm">
                  Total Billed: {projectInvoicingData.grandTotalKWD.toFixed(3)} KWD
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Debit Project Cost Center</th>
                      <th className="py-3.5 px-4">Project Name / Site</th>
                      <th className="py-3.5 px-4">Division</th>
                      <th className="py-3.5 px-4">Billed Occupants</th>
                      <th className="py-3.5 px-4">Engineer Beds ({rates.engineer} KWD)</th>
                      <th className="py-3.5 px-4">Foreman Beds ({rates.foreman} KWD)</th>
                      <th className="py-3.5 px-4">Labor Beds ({rates.labor} KWD)</th>
                      <th className="py-3.5 px-4 text-right">Recharge Total</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {projectInvoicingData.items.map(item => (
                      <tr key={item.costCenter} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-600">{item.costCenter}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{item.projectName}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold text-[10px]">
                            {item.division}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{item.totalOccupants} Employees</td>
                        <td className="py-3.5 px-4 font-mono text-cyan-700 font-bold">{item.engineerBeds}</td>
                        <td className="py-3.5 px-4 font-mono text-indigo-700 font-bold">{item.foremanBeds}</td>
                        <td className="py-3.5 px-4 font-mono text-amber-700 font-bold">{item.laborBeds}</td>
                        <td className="py-3.5 px-4 text-right font-black text-sm text-slate-900">
                          {item.totalAmountKWD.toFixed(3)} KWD
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedInvoiceModal(item)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                            <span>View Invoice</span>
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

        {/* ======================================================= */}
        {/* TAB 4: REPORTS                                          */}
        {/* ======================================================= */}
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
                  const isDecom = camp.status === 'Decommissioned';

                  return (
                    <div
                      key={camp.id}
                      className={`p-4 rounded-xl border space-y-2 ${
                        isDecom ? 'bg-slate-100/70 border-slate-300 opacity-75' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-2">
                          <span>{camp.campNo} — {camp.campArea}</span>
                          {isDecom && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                              Decommissioned
                            </span>
                          )}
                        </span>
                        <span className={isDecom ? 'text-slate-500' : 'text-emerald-700'}>
                          {isDecom ? 'Archived' : `${free} Free / ${beds} Total Beds (${pct}%)`}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isDecom ? 'bg-slate-400' : 'bg-cyan-600'}`} style={{ width: `${pct}%` }} />
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

        {/* ======================================================= */}
        {/* TAB 5: ADMIN & RBAC                                     */}
        {/* ======================================================= */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  System Users & Role-Based Access Control (RBAC)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super Admins can directly assign user roles, camp scopes, editing permissions, or reset passwords.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowManageCostCentersModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-cyan-600" />
                  <span>Cost Center Registry</span>
                </button>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
                </button>
              </div>
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
                      <th className="py-3.5 px-4">Editing Permissions</th>
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
                              onClick={() => handleToggleUserPermission(u.id, 'canDeleteCamps')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                u.permissions?.canDeleteCamps ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              Decommission
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
                              Edit
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

      {/* ======================================================= */}
      {/* MODAL: MANAGE MASTER COST CENTERS (ADD / EDIT)          */}
      {/* ======================================================= */}
      {showManageCostCentersModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Project Cost Center Registry</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure master project billing codes used across room check-in, bed transfers, and monthly recharges.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowManageCostCentersModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateCostCenter} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-600" /> Add New Project Cost Center
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Cost Center Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1IDS040-KOC"
                    value={newCostCenterForm.code}
                    onChange={(e) => setNewCostCenterForm({ ...newCostCenterForm, code: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Project Name / Site Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Substation Expansion Phase 2"
                    value={newCostCenterForm.name}
                    onChange={(e) => setNewCostCenterForm({ ...newCostCenterForm, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Division</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={newCostCenterForm.division}
                      onChange={(e) => setNewCostCenterForm({ ...newCostCenterForm, division: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800"
                    >
                      <option value="IDS">IDS</option>
                      <option value="MEP">MEP</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="OIL & GAS">OIL & GAS</option>
                      <option value="MARINE">MARINE</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shrink-0 shadow-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Existing Cost Centers Table (Horizontal Scroll Enabled) */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">Code</th>
                    <th className="py-2.5 px-3.5">Project / Client Name</th>
                    <th className="py-2.5 px-3.5">Division</th>
                    <th className="py-2.5 px-3.5">Active Occupants</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {costCenters.map(cc => {
                    const activeCount = occupants.filter(o => o.costCenter === cc.code && o.employeeStatus !== 'Exited').length;
                    return (
                      <tr key={cc.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-cyan-700">{cc.code}</td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900">{cc.name}</td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold text-[10px]">
                            {cc.division}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-700">
                          {activeCount} Bed{activeCount !== 1 ? 's' : ''} Assigned
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {cc.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingCostCenterModal({ ...cc })}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleCostCenterStatus(cc.id)}
                              className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                                cc.status === 'Active' ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              }`}
                            >
                              {cc.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowManageCostCentersModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================= */}
      {/* MODAL: EDIT SPECIFIC COST CENTER                        */}
      {/* ======================================================= */}
      {editingCostCenterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-cyan-600" />
                Edit Cost Center
              </h3>
              <button onClick={() => setEditingCostCenterModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCostCenter} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cost Center Code</label>
                <input
                  type="text"
                  required
                  value={editingCostCenterModal.code}
                  onChange={(e) => setEditingCostCenterModal({ ...editingCostCenterModal, code: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Renaming will automatically update all existing occupant records tied to this code.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name / Site</label>
                <input
                  type="text"
                  required
                  value={editingCostCenterModal.name}
                  onChange={(e) => setEditingCostCenterModal({ ...editingCostCenterModal, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Division</label>
                <select
                  value={editingCostCenterModal.division}
                  onChange={(e) => setEditingCostCenterModal({ ...editingCostCenterModal, division: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="IDS">IDS</option>
                  <option value="MEP">MEP</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="OIL & GAS">OIL & GAS</option>
                  <option value="MARINE">MARINE</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCostCenterModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: EMPLOYEE DOSSIER, LIVE TENURE & RELOCATION LEDGER*/}
      {/* ======================================================= */}
      {viewingEmployeeDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-mono font-bold text-base shadow-sm">
                  #{viewingEmployeeDossier.employeeId}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingEmployeeDossier.employeeName}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewingEmployeeDossier.title} • {viewingEmployeeDossier.division} ({viewingEmployeeDossier.costCenter})
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingEmployeeDossier(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 font-medium">Civil ID</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.civilId}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 font-medium">Passport #</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.passportNo}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 font-medium">Nationality</div>
                <div className="font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.nationality}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 font-medium">Status</div>
                <div className="mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewingEmployeeDossier.employeeStatus === 'On Job' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewingEmployeeDossier.employeeStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Bed Allocation & Live Duration Clock */}
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-600" /> Current Room Allocation
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-cyan-700 border border-cyan-200 shadow-2xs">
                  {viewingEmployeeDossier.roomGrade} Grade
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Camp Building:</span>
                  <div className="font-bold text-slate-900">{viewingEmployeeDossier.campNo} ({viewingEmployeeDossier.campArea})</div>
                </div>
                <div>
                  <span className="text-slate-500">Flat & Room:</span>
                  <div className="font-bold text-cyan-700 font-mono">
                    Flat {viewingEmployeeDossier.flatCode} • Room {viewingEmployeeDossier.roomNo}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Staying Here Since:</span>
                  <div className="font-bold text-slate-900 font-mono">{viewingEmployeeDossier.entryDate}</div>
                </div>
              </div>

              {/* Dynamic Live Tenure Display */}
              <div className="p-3 bg-white/90 border border-cyan-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span className="text-slate-600 font-medium">Current Room Duration:</span>
                </div>
                <div className="font-black text-slate-900 font-mono text-sm">
                  {calculateTenure(viewingEmployeeDossier.entryDate, viewingEmployeeDossier.employeeStatus === 'Exited' ? viewingEmployeeDossier.exitDate : null)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleOpenRelocateModal(viewingEmployeeDossier)}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Relocate / Transfer Bed
                </button>
              </div>
            </div>

            {/* Chronological Relocation History Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-600" />
                Accommodation & Relocation History Ledger
              </h4>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
                <div className="relative pl-6 pb-2 border-l-2 border-cyan-500">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-500 border-2 border-white" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-800 uppercase tracking-wide">
                      ● Active Stay: {viewingEmployeeDossier.campNo} (Room {viewingEmployeeDossier.roomNo})
                    </span>
                    <span className="font-mono text-slate-500 text-[11px] font-semibold">
                      {viewingEmployeeDossier.entryDate} – Present
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Flat {viewingEmployeeDossier.flatCode} ({viewingEmployeeDossier.roomGrade} Grade) • Cost Center: {viewingEmployeeDossier.costCenter}
                  </div>
                </div>

                {viewingEmployeeDossier.stayHistory && viewingEmployeeDossier.stayHistory.length > 0 ? (
                  viewingEmployeeDossier.stayHistory.map((hist, idx) => (
                    <div key={idx} className="relative pl-6 pb-2 border-l-2 border-slate-300">
                      <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-slate-400 border border-white" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          {hist.campNo} ({hist.campArea}) — Room {hist.roomNo}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {hist.startDate} – {hist.endDate}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Grade: {hist.roomGrade} • Stayed: {calculateTenure(hist.startDate, hist.endDate)}
                      </div>
                      <div className="text-[11px] text-slate-700 italic mt-0.5 bg-white p-1.5 rounded border border-slate-200/80">
                        Reason: {hist.reason}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400 italic">
                    No previous relocation records. This employee has remained in their initial allocated bed.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setViewingEmployeeDossier(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: 1-CLICK BED RELOCATION TRANSFER                  */}
      {/* ======================================================= */}
      {relocatingOccupant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-cyan-600" />
                Relocate Occupant #{relocatingOccupant.employeeId}
              </h3>
              <button onClick={() => setRelocatingOccupant(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900">{relocatingOccupant.employeeName} ({relocatingOccupant.title})</div>
              <div className="text-slate-500">
                Current Location: <strong>{relocatingOccupant.campNo}</strong> Room <strong>{relocatingOccupant.roomNo}</strong> ({relocatingOccupant.roomGrade})
              </div>
            </div>

            <form onSubmit={handleExecuteRelocation} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Camp Building</label>
                  <select
                    value={relocationForm.targetCampId}
                    onChange={(e) => {
                      const nextCampId = e.target.value;
                      const nextCamp = camps.find(c => c.id === nextCampId);
                      const nextFl = nextCamp?.floors[0];
                      const nextFt = nextFl?.flats[0];
                      const nextRm = nextFt?.rooms.find(r => r.occupants.length < r.capacity) || nextFt?.rooms[0];
                      setRelocationForm({
                        ...relocationForm,
                        targetCampId: nextCampId,
                        targetFloorNo: nextFl?.floorNo || 1,
                        targetFlatCode: nextFt?.flatCode || '',
                        targetRoomNo: nextRm?.roomNo || ''
                      });
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  >
                    {activeCamps.map(c => (
                      <option key={c.id} value={c.id}>{c.campNo} ({c.campArea})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Floor</label>
                  <select
                    value={relocationForm.targetFloorNo}
                    onChange={(e) => {
                      const flNo = Number(e.target.value);
                      const currentCamp = camps.find(c => c.id === relocationForm.targetCampId);
                      const fl = currentCamp?.floors.find(f => f.floorNo === flNo);
                      const ft = fl?.flats[0];
                      const rm = ft?.rooms.find(r => r.occupants.length < r.capacity) || ft?.rooms[0];
                      setRelocationForm({
                        ...relocationForm,
                        targetFloorNo: flNo,
                        targetFlatCode: ft?.flatCode || '',
                        targetRoomNo: rm?.roomNo || ''
                      });
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  >
                    {camps.find(c => c.id === relocationForm.targetCampId)?.floors.map(f => (
                      <option key={f.floorNo} value={f.floorNo}>Floor {f.floorNo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Flat</label>
                  <select
                    value={relocationForm.targetFlatCode}
                    onChange={(e) => {
                      const ftCode = e.target.value;
                      const currentCamp = camps.find(c => c.id === relocationForm.targetCampId);
                      const currentFl = currentCamp?.floors.find(f => f.floorNo === Number(relocationForm.targetFloorNo));
                      const ft = currentFl?.flats.find(f => f.flatCode === ftCode);
                      const rm = ft?.rooms.find(r => r.occupants.length < r.capacity) || ft?.rooms[0];
                      setRelocationForm({
                        ...relocationForm,
                        targetFlatCode: ftCode,
                        targetRoomNo: rm?.roomNo || ''
                      });
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900"
                  >
                    {camps
                      .find(c => c.id === relocationForm.targetCampId)
                      ?.floors.find(f => f.floorNo === Number(relocationForm.targetFloorNo))
                      ?.flats.map(ft => (
                        <option key={ft.flatCode} value={ft.flatCode}>Flat {ft.flatCode} ({ft.roomGrade})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Room (Free Spots)</label>
                  <select
                    value={relocationForm.targetRoomNo}
                    onChange={(e) => setRelocationForm({ ...relocationForm, targetRoomNo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-cyan-700"
                  >
                    {camps
                      .find(c => c.id === relocationForm.targetCampId)
                      ?.floors.find(f => f.floorNo === Number(relocationForm.targetFloorNo))
                      ?.flats.find(ft => ft.flatCode === relocationForm.targetFlatCode)
                      ?.rooms.map(rm => (
                        <option key={rm.roomNo} value={rm.roomNo}>
                          Room {rm.roomNo} ({rm.capacity - rm.occupants.length} beds free)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Effective Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={relocationForm.transferDate}
                    onChange={(e) => setRelocationForm({ ...relocationForm, transferDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Transfer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Project Site Reallocation"
                    value={relocationForm.reason}
                    onChange={(e) => setRelocationForm({ ...relocationForm, reason: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRelocatingOccupant(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-md"
                >
                  Confirm & Transfer Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: DECOMMISSIONING LOCKOUT WARNING                  */}
      {/* ======================================================= */}
      {decommissionLockoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decommissioning Blocked</h3>
                <p className="text-xs text-rose-600 font-medium">
                  Facility {decommissionLockoutModal.camp.campNo} still contains active occupants.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with Gulf accommodation compliance and audit standards, you cannot close or delete a camp building while workers reside there. Please relocate or check out the following{' '}
              <strong>{decommissionLockoutModal.occupants.length} occupants</strong> first:
            </p>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50 text-xs">
              {decommissionLockoutModal.occupants.map(occ => (
                <div key={occ.employeeId} className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-800">#{occ.employeeId}</span>{' '}
                    <span className="text-slate-700 font-medium">{occ.employeeName}</span>
                  </div>
                  <span className="font-mono text-cyan-700 font-bold text-[11px]">
                    Room {occ.roomNo}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDecommissionLockoutModal(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Understood, Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 1: EDIT CAMP BUILDING DETAILS                     */}
      {/* ======================================================= */}
      {editingCampModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-600" />
                Edit Camp Details ({editingCampModal.campNo})
              </h3>
              <button onClick={() => setEditingCampModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampEdits} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Camp Code / ID</label>
                  <input
                    type="text"
                    required
                    value={editingCampModal.campNo}
                    onChange={(e) => setEditingCampModal({ ...editingCampModal, campNo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Camp Area Location</label>
                  <input
                    type="text"
                    required
                    value={editingCampModal.campArea}
                    onChange={(e) => setEditingCampModal({ ...editingCampModal, campArea: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Master Cost Center</label>
                <input
                  type="text"
                  required
                  value={editingCampModal.costCenter || '1ACD000'}
                  onChange={(e) => setEditingCampModal({ ...editingCampModal, costCenter: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900"
                />
              </div>

              {/* DRAFT SAFE FLOOR MANAGEMENT */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Current Floors: {editingCampModal.floors.length} Floors</span>
                  <div className="flex items-center gap-2">
                    {editingCampModal.floors.length > 1 && (
                      <button
                        type="button"
                        onClick={handleRemoveFloorDraft}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all"
                      >
                        - Remove Last Floor
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddFloorDraft}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      + Add New Floor
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Floor additions/removals are staged as drafts. Click "Save Camp Details" below to apply them.
                </p>
              </div>

              {/* DECOMMISSION FACILITY */}
              {currentUser.permissions.canDeleteCamps && (
                <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-rose-900">Decommission Camp Facility</div>
                    <div className="text-[11px] text-rose-700">Safely archives this building once zero occupants remain.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAttemptDecommissionCamp(editingCampModal)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Decommission
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCampModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-md"
                >
                  Save Camp Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 2: ADD APARTMENT BUILDING                         */}
      {/* ======================================================= */}
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
                  <label className="block font-semibold text-slate-700 mb-1">Total Floors</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Flats per Floor</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Rooms per Flat</label>
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

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-cyan-700">Engineer Flat Configuration:</div>
                <div className="flex items-center justify-between gap-4">
                  <label className="text-slate-600">How many flats on Floor 1 are for Engineers?</label>
                  <input
                    type="number"
                    min="0"
                    max={newCampForm.flatsPerFloor}
                    value={newCampForm.floor1EngineerFlats}
                    onChange={(e) => setNewCampForm({ ...newCampForm, floor1EngineerFlats: e.target.value })}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-center"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Engineer flats are allocated 2 beds/room. Remaining flats default to 3 beds/room and can be changed anytime.
                </p>
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

      {/* ======================================================= */}
      {/* MODAL 3: ITEMISED PROJECT INVOICE (DRILL-DOWN & PRINT)  */}
      {/* ======================================================= */}
      {selectedInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <DhowLogo className="h-6 w-auto" />
                <span className="text-xs font-mono font-bold text-slate-500">
                  INV-{selectedInvoiceModal.costCenter}-{billingPeriod.replace(' ', '-')}
                </span>
              </div>
              <button onClick={() => setSelectedInvoiceModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500">Debited Project Cost Center:</div>
                <div className="text-sm font-black text-cyan-700">{selectedInvoiceModal.costCenter}</div>
                <div className="font-semibold text-slate-700">Site: {selectedInvoiceModal.projectName}</div>
                <div className="text-slate-500">Division: {selectedInvoiceModal.division}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-right">
                <div className="text-slate-500">Credited Camp Management:</div>
                <div className="text-sm font-black text-slate-900">Cost Center 1ACD000</div>
                <div className="font-semibold text-slate-700">Billing Period: {billingPeriod}</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Staff ID</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Civil ID</th>
                    <th className="py-2.5 px-3">Room / Flat</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3 text-right">Charge (KWD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedInvoiceModal.occupants.map(occ => {
                    const bedCost =
                      occ.roomGrade === 'Engineer'
                        ? rates.engineer
                        : occ.roomGrade === 'Foreman'
                        ? rates.foreman
                        : rates.labor;

                    return (
                      <tr key={occ.employeeId}>
                        <td className="py-2 px-3 font-mono font-bold text-cyan-600">#{occ.employeeId}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{occ.employeeName}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{occ.civilId}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{occ.roomNo}</td>
                        <td className="py-2 px-3 font-bold text-[10px]">
                          <span className={`px-2 py-0.5 rounded ${
                            occ.roomGrade === 'Engineer'
                              ? 'bg-cyan-50 text-cyan-700'
                              : occ.roomGrade === 'Foreman'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {occ.roomGrade}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {bedCost.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-3 text-right uppercase">
                      Total Invoice Amount:
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-sm text-emerald-700">
                      {selectedInvoiceModal.totalAmountKWD.toFixed(3)} KWD
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-400">
                Generated from Dhow Camp Management Registry • Verified by Camp Director
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 4: AFR ROOM CHECK-IN (WITH COST CENTER SELECTOR)  */}
      {/* ======================================================= */}
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
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Project Cost Center</label>
                  <select
                    required
                    value={checkInForm.costCenter}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      const found = costCenters.find(c => c.code === selectedCode);
                      setCheckInForm({
                        ...checkInForm,
                        costCenter: selectedCode,
                        division: found ? found.division : checkInForm.division
                      });
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900"
                  >
                    {costCenters.filter(c => c.status === 'Active').map(cc => (
                      <option key={cc.id} value={cc.code}>
                        {cc.code} — {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    readOnly
                    value={checkInForm.division}
                    className="w-full border border-slate-200 bg-slate-100 text-slate-600 font-bold rounded-xl px-3 py-2 cursor-not-allowed"
                  />
                </div>
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

      {/* ======================================================= */}
      {/* MODAL 5: MANAGE OCCUPANT                                */}
      {/* ======================================================= */}
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

              <div className="pt-2">
                <button
                  onClick={() => {
                    const occ = manageOccupantModal;
                    setManageOccupantModal(null);
                    handleOpenRelocateModal(occ);
                  }}
                  className="w-full py-2.5 px-4 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4 text-cyan-600" />
                  Relocate to Another Room / Camp
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200">
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

      {/* ======================================================= */}
      {/* MODAL 6: ADD SYSTEM USER (SUPER ADMIN)                  */}
      {/* ======================================================= */}
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

      {/* ======================================================= */}
      {/* MODAL 7: EDIT USER ROLE & PERMISSIONS                   */}
      {/* ======================================================= */}
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

      {/* ======================================================= */}
      {/* MODAL 8: RESET USER PASSWORD                            */}
      {/* ======================================================= */}
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