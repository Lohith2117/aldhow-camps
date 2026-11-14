import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Building2, Users, ShieldCheck, Eye, EyeOff, LogOut, Plus, Search,
  Download, CheckCircle2, AlertCircle, UserPlus, KeyRound, Bed,
  Home, RefreshCw, X, FileSpreadsheet, BarChart3, Plane,
  Receipt, Printer, Edit3, ArrowRightLeft, History, MapPin, AlertTriangle,
  Archive, Tag, Phone, Clock, Layers, Globe, FileUp, Wrench, ShieldAlert, FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import dhowLogoImg from './assets/dhow-logo.png';
import { calculateTenure, getRoleDefaultPermissions } from './utils/helpers';
import {
  INITIAL_USERS, INITIAL_COST_CENTERS, INITIAL_CAMPS, INITIAL_OCCUPANTS,
  INITIAL_LEAVE_LOGS, INITIAL_RTD_LOGS, INITIAL_TRANSFER_REQUESTS,
  INITIAL_BILLING_OTHER_COSTS, INITIAL_ACTIVITY_LOGS
} from './data/initialDatabase';

import {
  exportCampOccupancySummary,
  exportDailyOccupancyReport,
  exportMaterialIssuanceForm,
  exportOccupantsRelocationForm,
  exportAccommodationMisconductReport,
  exportMisconductLog,
  exportMaintenanceLog,
  printFormattedElement
} from './utils/reportGenerators';

import InvoicingTab from './components/InvoicingTab';
import ReportsTab from './components/ReportsTab';
import ActivityLogTab from './components/ActivityLogTab';
import ApprovalsAndTablesTab from './components/ApprovalsAndTablesTab';

const DhowLogo = ({ className = "h-8 w-auto" }) => (
  <img src={dhowLogoImg} alt="Dhow Engineering" className={className} />
);

const DEFAULT_MISCONDUCT_LOGS = [
  {
    id: 'disc-1',
    employeeId: '5912',
    employeeName: 'Syed Tanveer Hussain',
    title: 'QA/QC Inspector',
    incidentDate: '2026-10-15',
    incidentTime: '22:30',
    incidentLocation: 'CAMP-01, Flat 1-01-02-M, Room B',
    typeOfViolation: 'Cooking inside bedroom against fire safety policy',
    docRef: 'DISC-5912-01',
    costCenter: '1CIV011-KOC',
    division: 'CIVIL',
    campNo: 'CAMP-01',
    roomNo: '1-01-02-B',
    contactNo: '+965 99882211',
    reportedBy: 'Tariq Al-Mansoor',
    witnessName: 'Amr Mohamed Ali',
    witnessId: '5838',
    witnessRoom: '1-01-01-A',
    witnessPhone: '+965 98765432',
    description: 'Use of high-voltage electric hotplate inside sleeping quarters.',
    remarks: 'First written warning issued by HR.'
  }
];

const DEFAULT_MAINTENANCE_LOGS = [
  {
    id: 'MNT-101',
    date: '2026-11-02',
    month: 'November',
    issueDetails: 'Split A/C cooling compressor failure and water leakage',
    reportedByEmpId: '6410',
    employeeName: 'Kamineni Lohith',
    floorNo: 1,
    flatCode: '1-01-01-NM',
    roomNo: '1-01-01-B',
    areaFacility: 'Bedroom AC',
    inspectedBy: 'Facilities Supervisor',
    actionTakenBy: 'HVAC Maintenance Team',
    status: 'Completed',
    replacedMaterialCost: '18.500',
    chargeToEmpId: 'N/A (Wear & Tear)',
    remarks: 'Replaced fan motor and cleared drain pipe.'
  }
];

export default function App() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // ==========================================
  // STATE PERSISTENCE
  // ==========================================
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('dhow_users_v14')) || INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('dhow_session_v14')) || null);
  const [camps, setCamps] = useState(() => JSON.parse(localStorage.getItem('dhow_camps_v14')) || INITIAL_CAMPS);
  const [occupants, setOccupants] = useState(() => JSON.parse(localStorage.getItem('dhow_occupants_v14')) || INITIAL_OCCUPANTS);
  const [costCenters, setCostCenters] = useState(() => JSON.parse(localStorage.getItem('dhow_cc_v14')) || INITIAL_COST_CENTERS);
  const [divisions, setDivisions] = useState(() => JSON.parse(localStorage.getItem('dhow_div_v14')) || ['IDS', 'MEP', 'CIVIL', 'OIL & GAS', 'MARINE']);
  const [leaveLogs, setLeaveLogs] = useState(() => JSON.parse(localStorage.getItem('dhow_leave_v14')) || INITIAL_LEAVE_LOGS);
  const [rtdLogs, setRtdLogs] = useState(() => JSON.parse(localStorage.getItem('dhow_rtd_v14')) || INITIAL_RTD_LOGS);
  const [transferRequests, setTransferRequests] = useState(() => JSON.parse(localStorage.getItem('dhow_tr_v14')) || INITIAL_TRANSFER_REQUESTS);
  const [otherCosts, setOtherCosts] = useState(() => JSON.parse(localStorage.getItem('dhow_others_v14')) || INITIAL_BILLING_OTHER_COSTS);
  const [activityLogs, setActivityLogs] = useState(() => JSON.parse(localStorage.getItem('dhow_act_v14')) || INITIAL_ACTIVITY_LOGS);
  const [maintenanceLogs, setMaintenanceLogs] = useState(() => JSON.parse(localStorage.getItem('dhow_mnt_v14')) || DEFAULT_MAINTENANCE_LOGS);
  const [misconductLogs, setMisconductLogs] = useState(() => JSON.parse(localStorage.getItem('dhow_disc_v14')) || DEFAULT_MISCONDUCT_LOGS);

  // Navigation
  const [activeTab, setActiveTab] = useState('map');
  const [selectedCampId, setSelectedCampId] = useState(INITIAL_CAMPS[0].id);
  const [selectedFloorNo, setSelectedFloorNo] = useState(1);

  // Invoicing & Rate Card
  const [billingPeriod, setBillingPeriod] = useState('November 2026');
  const [rates, setRates] = useState({ nonManual: 120, manual: 45 });
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState(null);

  // Search & Filters
  const [universalSearchQuery, setUniversalSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [productiveTypeFilter, setProductiveTypeFilter] = useState('ALL');

  // Modals & Drawers
  const [viewingEmployeeDossier, setViewingEmployeeDossier] = useState(null);
  const [editingEmployeeModal, setEditingEmployeeModal] = useState(null);
  const [showPreAddEmployeeModal, setShowPreAddEmployeeModal] = useState(false);
  const [relocatingOccupant, setRelocatingOccupant] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [manageOccupantModal, setManageOccupantModal] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(null);
  const [showReturnJobModal, setShowReturnJobModal] = useState(null);
  const [showRtdModal, setShowRtdModal] = useState(null);
  const [showTransferRequestModal, setShowTransferRequestModal] = useState(null);
  const [showAddCampModal, setShowAddCampModal] = useState(false);
  const [editingCampModal, setEditingCampModal] = useState(null);
  const [showManageCostCentersModal, setShowManageCostCentersModal] = useState(false);
  const [editingCostCenterModal, setEditingCostCenterModal] = useState(null);
  const [decommissionLockoutModal, setDecommissionLockoutModal] = useState(null);

  // Report & Form Preview Modal (Preview before Print or Download)
  const [reportPreviewModal, setReportPreviewModal] = useState(null);

  // Floor Configurator sub-modal inside Edit Camp
  const [showAddFloorConfigModal, setShowAddFloorConfigModal] = useState(false);
  const [newFloorDraft, setNewFloorDraft] = useState({ flatsCount: 3, nonManualFlats: 1 });

  // Dynamic Divisions
  const [newDivisionInput, setNewDivisionInput] = useState('');

  // Excel Roster Import
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [excelParsedRows, setExcelParsedRows] = useState([]);
  const [excelImportFileName, setExcelImportFileName] = useState('');
  const [excelImportStats, setExcelImportStats] = useState({ total: 0, valid: 0, errors: 0 });
  const excelFileInputRef = useRef(null);

  // Misconduct & Maintenance Modals
  const [showMisconductModal, setShowMisconductModal] = useState(false);
  const [misconductForm, setMisconductForm] = useState({
    employeeId: '', employeeName: '', title: '', division: '', costCenter: '',
    campNo: 'CAMP-01', roomNo: '', contactNo: '+965 ', incidentDate: todayStr,
    incidentTime: '14:00', incidentLocation: 'Accommodation Quarters',
    typeOfViolation: 'Camp Quiet Hours & Residential Safety Violation',
    description: '', witnessName: '', witnessId: '', witnessRoom: '', witnessPhone: '+965 ',
    reportedBy: 'Camp Supervisor', remarks: 'Referred to HR Disciplinary Committee'
  });

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    date: todayStr, month: 'November', issueDetails: '', reportedByEmpId: '',
    employeeName: '', floorNo: 1, flatCode: '', roomNo: '', areaFacility: 'Bedroom AC / Electrical',
    inspectedBy: 'Camp Facilities Supervisor', actionTakenBy: 'Maintenance Team',
    status: 'Pending', replacedMaterialCost: '0.000', chargeToEmpId: 'N/A (Wear & Tear)', remarks: ''
  });

  // User Management Modals (RBAC)
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [targetUserForReset, setTargetUserForReset] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Pre-Add Employee Form (Before assigning to a camp bed)
  const [preAddForm, setPreAddForm] = useState({
    employeeId: '', employeeName: '', nationality: 'India', title: 'Site Engineer',
    productiveType: 'Direct Employee (DE)', roomGrade: 'Manual',
    division: 'IDS', costCenter: '1IDS038-KIPIC', passportNo: '', civilId: '',
    mobileNo: '+965 ', emergencyContactName: '', emergencyContactPhone: '+965 ',
    entryDate: todayStr
  });

  // Bed Check-In Form (With Auto-Fill, Manual/Non-Manual, Doc Ref #, & Material Issuance)
  const [checkInForm, setCheckInForm] = useState({
    campId: 'camp-1', floorNo: 1, flatCode: '1-01-01-NM', roomNo: '1-01-01-B',
    roomGrade: 'Non-Manual', productiveType: 'Direct Employee (DE)',
    arrivalType: 'Local Residency Transfer', docRef: '150-04',
    employeeId: '', employeeName: '', nationality: 'India',
    title: 'Site Engineer', division: 'IDS', costCenter: '1IDS038-KIPIC',
    passportNo: '', civilId: '', mobileNo: '+965 ', emergencyContactName: '',
    emergencyContactPhone: '+965 ', homeCountryAddress: '', entryDate: todayStr,
    materials: { mattress: true, pillow: true, bedsheet: true, blanket: true }
  });

  const [relocationForm, setRelocationForm] = useState({
    targetCampId: '', targetFloorNo: '', targetFlatCode: '', targetRoomNo: '',
    transferDate: todayStr, docRef: 'REL-2026-01', reason: 'Project Site Reallocation'
  });

  const [leaveForm, setLeaveForm] = useState({
    startDate: todayStr, expectedEndDate: todayStr, afrLogNo: 'LOG-VAC', remarks: 'Annual Vacation'
  });
  const [returnJobForm, setReturnJobForm] = useState({
    actualReturnDate: todayStr, remarks: 'Returned on schedule'
  });
  const [rtdForm, setRtdForm] = useState({
    rtdType: 'Resigned', rtdDate: todayStr, afrExitRef: 'EXIT-RTD', remarks: 'Resigned from company'
  });
  const [transferRequestForm, setTransferRequestForm] = useState({
    toCostCenter: '1MEP019-KNPC', toDivision: 'MEP', reason: 'Reassigned to new project site'
  });
  const [newCostCenterForm, setNewCostCenterForm] = useState({ code: '', name: '', division: 'IDS' });

  const [newCampForm, setNewCampForm] = useState({
    campNo: 'CAMP-04',
    campArea: 'Ahmadi Sector 4',
    campDigit: '4',
    campStartDate: todayStr,
    floorsCount: 3,
    roomsPerFlat: 3,
    floorConfigs: [
      { floorNo: 1, flatsCount: 2, nonManualFlats: 1 },
      { floorNo: 2, flatsCount: 3, nonManualFlats: 0 },
      { floorNo: 3, flatsCount: 3, nonManualFlats: 0 }
    ]
  });

  const handleFloorsCountChange = (count) => {
    const val = Math.max(1, Math.min(20, parseInt(count, 10) || 1));
    setNewCampForm(prev => {
      const currentConfigs = [...prev.floorConfigs];
      if (val > currentConfigs.length) {
        for (let i = currentConfigs.length + 1; i <= val; i++) {
          currentConfigs.push({ floorNo: i, flatsCount: 3, nonManualFlats: 0 });
        }
      } else if (val < currentConfigs.length) {
        currentConfigs.length = val;
      }
      return { ...prev, floorsCount: val, floorConfigs: currentConfigs };
    });
  };

  const [newUserForm, setNewUserForm] = useState({
    staffId: '', name: '', email: '', password: '', title: '', role: 'CAMP_EDITOR',
    campScope: 'ALL', canManageUsers: false, canAddCamps: false, canDeleteCamps: true,
    canEditOccupants: true, canExportReports: true, canApproveTransfers: false
  });

  // LocalStorage Sync
  useEffect(() => { localStorage.setItem('dhow_users_v14', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('dhow_camps_v14', JSON.stringify(camps)); }, [camps]);
  useEffect(() => { localStorage.setItem('dhow_occupants_v14', JSON.stringify(occupants)); }, [occupants]);
  useEffect(() => { localStorage.setItem('dhow_cc_v14', JSON.stringify(costCenters)); }, [costCenters]);
  useEffect(() => { localStorage.setItem('dhow_div_v14', JSON.stringify(divisions)); }, [divisions]);
  useEffect(() => { localStorage.setItem('dhow_leave_v14', JSON.stringify(leaveLogs)); }, [leaveLogs]);
  useEffect(() => { localStorage.setItem('dhow_rtd_v14', JSON.stringify(rtdLogs)); }, [rtdLogs]);
  useEffect(() => { localStorage.setItem('dhow_tr_v14', JSON.stringify(transferRequests)); }, [transferRequests]);
  useEffect(() => { localStorage.setItem('dhow_others_v14', JSON.stringify(otherCosts)); }, [otherCosts]);
  useEffect(() => { localStorage.setItem('dhow_act_v14', JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem('dhow_mnt_v14', JSON.stringify(maintenanceLogs)); }, [maintenanceLogs]);
  useEffect(() => { localStorage.setItem('dhow_disc_v14', JSON.stringify(misconductLogs)); }, [misconductLogs]);
  useEffect(() => {
    if (currentUser && rememberMe) localStorage.setItem('dhow_session_v14', JSON.stringify(currentUser));
    else if (!currentUser) localStorage.removeItem('dhow_session_v14');
  }, [currentUser, rememberMe]);

  const logActivity = (category, actionTitle, details, campNo = 'ALL') => {
    const newLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorName: currentUser ? currentUser.name : 'System Admin',
      actorRole: currentUser ? currentUser.role : 'SUPER_ADMIN',
      category, actionTitle, details, campNo
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    setTimeout(() => {
      const q = loginEmail.trim().toLowerCase();
      const user = users.find(u => u.email.toLowerCase() === q || u.staffId.toLowerCase() === q);
      if (!user || user.passwordHash !== loginPassword) {
        setLoginError('Invalid email / Staff ID or password.');
        setLoginLoading(false);
        return;
      }
      if (user.status !== 'Active') {
        setLoginError('Account suspended. Contact the Super Administrator.');
        setLoginLoading(false);
        return;
      }
      const updatedUser = {
        ...user,
        lastLogin: new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      setLoginLoading(false);
      logActivity('AUTH', 'User Sign In', `${user.name} logged into Dhow Camp Portal`);
    }, 300);
  };

  const handleLogout = () => {
    logActivity('AUTH', 'User Sign Out', `${currentUser?.name} logged out`);
    setCurrentUser(null);
    localStorage.removeItem('dhow_session_v14');
    setActiveTab('map');
  };

  const activeCamps = useMemo(() => camps.filter(c => c.status !== 'Decommissioned'), [camps]);
  const activeCamp = useMemo(() => activeCamps.find(c => c.id === selectedCampId) || activeCamps[0] || camps[0], [activeCamps, camps, selectedCampId]);
  const activeFloor = useMemo(() => activeCamp?.floors.find(f => f.floorNo === selectedFloorNo) || activeCamp?.floors[0], [activeCamp, selectedFloorNo]);

  // Global Telemetry
  const globalStats = useMemo(() => {
    let totalFlats = 0;
    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;

    activeCamps.forEach(c => {
      c.floors.forEach(fl => {
        totalFlats += fl.flats.length;
        fl.flats.forEach(ft => {
          totalRooms += ft.rooms.length;
          ft.rooms.forEach(rm => {
            totalBeds += rm.capacity;
            occupiedBeds += rm.occupants.length;
          });
        });
      });
    });

    const activeStaff = occupants.filter(o => !o.employeeStatus.startsWith('RTD'));
    const onJobCount = activeStaff.filter(o => o.employeeStatus === 'On Job').length;
    const onLeaveCount = activeStaff.filter(o => o.employeeStatus === 'On Leave').length;
    const unassignedCount = activeStaff.filter(o => o.employeeStatus === 'Unassigned').length;
    const freeBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      campsCount: activeCamps.length,
      totalFlats, totalRooms, totalBeds, occupiedBeds,
      freeBeds, occupancyPct, activeStaffCount: activeStaff.length,
      onJobCount, onLeaveCount, unassignedCount
    };
  }, [activeCamps, occupants]);

  const universalSearchResults = useMemo(() => {
    const q = universalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return occupants.filter(occ =>
      occ.employeeId.toLowerCase().includes(q) ||
      occ.employeeName.toLowerCase().includes(q) ||
      (occ.civilId && occ.civilId.toString().includes(q)) ||
      (occ.passportNo && occ.passportNo.toLowerCase().includes(q)) ||
      (occ.nationality && occ.nationality.toLowerCase().includes(q)) ||
      (occ.mobileNo && occ.mobileNo.includes(q)) ||
      (occ.productiveType && occ.productiveType.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [occupants, universalSearchQuery]);

  const filteredOccupants = useMemo(() => {
    return occupants.filter(occ => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        occ.employeeName.toLowerCase().includes(q) ||
        occ.employeeId.toLowerCase().includes(q) ||
        (occ.nationality && occ.nationality.toLowerCase().includes(q)) ||
        (occ.civilId && occ.civilId.toString().includes(q)) ||
        (occ.passportNo && occ.passportNo.toLowerCase().includes(q)) ||
        (occ.mobileNo && occ.mobileNo.toLowerCase().includes(q)) ||
        (occ.flatCode && occ.flatCode.toLowerCase().includes(q)) ||
        (occ.roomNo && occ.roomNo.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || occ.employeeStatus === statusFilter;
      const matchesDivision = divisionFilter === 'ALL' || occ.division === divisionFilter;
      const matchesProductiveType = productiveTypeFilter === 'ALL' || (occ.productiveType || 'Direct Employee (DE)') === productiveTypeFilter;

      return matchesSearch && matchesStatus && matchesDivision && matchesProductiveType;
    });
  }, [occupants, searchTerm, statusFilter, divisionFilter, productiveTypeFilter]);

  const projectInvoicingData = useMemo(() => {
    const activeOccupants = occupants.filter(o => !o.employeeStatus.startsWith('RTD') && o.employeeStatus !== 'Unassigned');
    const costCenterMap = {};

    activeOccupants.forEach(occ => {
      const cc = occ.costCenter || 'Unassigned';
      if (!costCenterMap[cc]) {
        const found = costCenters.find(c => c.code === cc);
        costCenterMap[cc] = {
          costCenter: cc,
          projectName: found ? found.name : 'Project Site',
          division: occ.division || (found ? found.division : 'General'),
          totalOccupants: 0,
          nonManualBeds: 0,
          manualBeds: 0,
          nonManualAmountKWD: 0,
          manualAmountKWD: 0,
          otherCostKWD: otherCosts[cc]?.amount || 0,
          otherCostDesc: otherCosts[cc]?.description || '',
          totalAmountKWD: 0,
          occupants: []
        };
      }

      costCenterMap[cc].totalOccupants += 1;
      costCenterMap[cc].occupants.push(occ);

      if (occ.roomGrade === 'Non-Manual') {
        costCenterMap[cc].nonManualBeds += 1;
        costCenterMap[cc].nonManualAmountKWD += rates.nonManual;
      } else {
        costCenterMap[cc].manualBeds += 1;
        costCenterMap[cc].manualAmountKWD += rates.manual;
      }
    });

    const items = Object.values(costCenterMap).map(item => {
      const others = otherCosts[item.costCenter]?.amount || 0;
      return {
        ...item,
        otherCostKWD: others,
        otherCostDesc: otherCosts[item.costCenter]?.description || '',
        totalAmountKWD: item.nonManualAmountKWD + item.manualAmountKWD + others
      };
    });

    const grandTotalKWD = items.reduce((acc, curr) => acc + curr.totalAmountKWD, 0);
    const totalNonManualKWD = items.reduce((acc, curr) => acc + curr.nonManualAmountKWD, 0);
    const totalManualKWD = items.reduce((acc, curr) => acc + curr.manualAmountKWD, 0);
    const totalOthersKWD = items.reduce((acc, curr) => acc + curr.otherCostKWD, 0);

    return { items, grandTotalKWD, totalNonManualKWD, totalManualKWD, totalOthersKWD };
  }, [occupants, costCenters, rates, otherCosts]);

  // =========================================================
  // FLOOR MANAGEMENT HANDLERS (EDIT CAMP)
  // =========================================================
  const handleOpenAddFloorConfig = () => {
    setNewFloorDraft({ flatsCount: 3, nonManualFlats: 1 });
    setShowAddFloorConfigModal(true);
  };

  const handleCommitNewFloorToCamp = (e) => {
    e.preventDefault();
    if (!editingCampModal) return;

    const nextFloorNo = editingCampModal.floors.length + 1;
    const campDigit = editingCampModal.campDigit || editingCampModal.campNo.replace(/\D/g, '') || '1';
    const flStr = String(nextFloorNo).padStart(2, '0');
    const totalFlats = parseInt(newFloorDraft.flatsCount, 10) || 3;
    const nmFlats = parseInt(newFloorDraft.nonManualFlats, 10) || 0;

    const newFlats = [];
    for (let fl = 1; fl <= totalFlats; fl++) {
      const flatStr = String(fl).padStart(2, '0');
      const isNM = fl <= nmFlats;
      const flatGrade = isNM ? 'Non-Manual' : 'Manual';
      const gradeInitial = isNM ? 'NM' : 'M';
      const roomCapacity = isNM ? 2 : 3;

      newFlats.push({
        flatNo: fl,
        flatCode: `${campDigit}-${flStr}-${flatStr}-${gradeInitial}`,
        roomGrade: flatGrade,
        rooms: [
          { roomNo: `${campDigit}-${flStr}-${flatStr}-A`, capacity: roomCapacity, occupants: [] },
          { roomNo: `${campDigit}-${flStr}-${flatStr}-B`, capacity: roomCapacity, occupants: [] },
          { roomNo: `${campDigit}-${flStr}-${flatStr}-C`, capacity: roomCapacity, occupants: [] },
        ]
      });
    }

    setEditingCampModal(prev => ({
      ...prev,
      floors: [...prev.floors, { floorNo: nextFloorNo, flats: newFlats }]
    }));
    setShowAddFloorConfigModal(false);
  };

  const handleRemoveTopFloorDraft = () => {
    if (!editingCampModal || editingCampModal.floors.length <= 1) return;
    const lastFloor = editingCampModal.floors[editingCampModal.floors.length - 1];

    let hasOccupants = false;
    lastFloor.flats.forEach(fl => {
      fl.rooms.forEach(rm => {
        if (rm.occupants && rm.occupants.length > 0) hasOccupants = true;
      });
    });

    if (hasOccupants) {
      alert(`Cannot remove Floor ${lastFloor.floorNo} because it contains active occupants. Please relocate them first.`);
      return;
    }

    setEditingCampModal(prev => ({
      ...prev,
      floors: prev.floors.slice(0, -1)
    }));
  };

  const handleAddFlatWithGrade = (floorNo, grade) => {
    if (!editingCampModal) return;
    const targetFloor = editingCampModal.floors.find(f => f.floorNo === floorNo);
    if (!targetFloor) return;

    const nextFlatNo = targetFloor.flats.length + 1;
    const campDigit = editingCampModal.campDigit || '1';
    const flStr = String(floorNo).padStart(2, '0');
    const flatStr = String(nextFlatNo).padStart(2, '0');
    const isNM = grade === 'Non-Manual';
    const gradeInitial = isNM ? 'NM' : 'M';
    const capacity = isNM ? 2 : 3;

    const newFlat = {
      flatNo: nextFlatNo,
      flatCode: `${campDigit}-${flStr}-${flatStr}-${gradeInitial}`,
      roomGrade: grade,
      rooms: [
        { roomNo: `${campDigit}-${flStr}-${flatStr}-A`, capacity, occupants: [] },
        { roomNo: `${campDigit}-${flStr}-${flatStr}-B`, capacity, occupants: [] },
        { roomNo: `${campDigit}-${flStr}-${flatStr}-C`, capacity, occupants: [] },
      ]
    };

    setEditingCampModal(prev => ({
      ...prev,
      floors: prev.floors.map(f => f.floorNo === floorNo ? { ...f, flats: [...f.flats, newFlat] } : f)
    }));
  };

  const handleRemoveFlatFromFloor = (floorNo) => {
    if (!editingCampModal) return;
    const targetFloor = editingCampModal.floors.find(f => f.floorNo === floorNo);
    if (!targetFloor || targetFloor.flats.length <= 1) return;

    const lastFlat = targetFloor.flats[targetFloor.flats.length - 1];
    let hasOccupants = false;
    lastFlat.rooms.forEach(rm => {
      if (rm.occupants && rm.occupants.length > 0) hasOccupants = true;
    });

    if (hasOccupants) {
      alert(`Cannot remove Flat ${lastFlat.flatCode} because it has active occupants.`);
      return;
    }

    setEditingCampModal(prev => ({
      ...prev,
      floors: prev.floors.map(f => f.floorNo === floorNo ? { ...f, flats: f.flats.slice(0, -1) } : f)
    }));
  };

  const handleSaveCampEdits = (e) => {
    e.preventDefault();
    if (!editingCampModal) return;
    setCamps(prev => prev.map(c => c.id === editingCampModal.id ? editingCampModal : c));
    logActivity('CAMP_CONFIG', `Updated Camp ${editingCampModal.campNo}`, `Updated floor geometry for ${editingCampModal.campNo}`, editingCampModal.campNo);
    setEditingCampModal(null);
  };

  const handleFlatGradeChange = (campId, floorNo, flatCode, newGrade) => {
    const newCapacity = newGrade === 'Non-Manual' ? 2 : 3;
    const targetCamp = camps.find(c => c.id === campId);
    const targetFloor = targetCamp?.floors.find(f => f.floorNo === floorNo);
    const targetFlat = targetFloor?.flats.find(f => f.flatCode === flatCode);

    if (!targetFlat) return;

    const overCapacityRoom = targetFlat.rooms.find(r => r.occupants.length > newCapacity);
    if (overCapacityRoom) {
      alert(`Capacity Conflict: Room ${overCapacityRoom.roomNo} currently has ${overCapacityRoom.occupants.length} occupants. You cannot switch to ${newGrade} (${newCapacity} beds/room) until excess occupants are relocated.`);
      return;
    }

    const gradeSuffix = newGrade === 'Non-Manual' ? 'NM' : 'M';
    const flatParts = flatCode.split('-');
    flatParts[flatParts.length - 1] = gradeSuffix;
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
          return { ...occ, flatCode: newFlatCode, roomGrade: newGrade };
        }
        return occ;
      })
    );

    logActivity('CAMP_CONFIG', `Changed Grade of Flat ${flatCode}`, `Switched Flat ${flatCode} to ${newGrade} in ${targetCamp.campNo}`, targetCamp.campNo);
  };

  // =========================================================
  // DYNAMIC DIVISION MANAGEMENT
  // =========================================================
  const handleAddDivision = (e) => {
    e.preventDefault();
    const cleanDiv = newDivisionInput.trim().toUpperCase();
    if (!cleanDiv) return;
    if (divisions.includes(cleanDiv)) {
      alert(`Division "${cleanDiv}" already exists.`);
      return;
    }
    const updated = [...divisions, cleanDiv];
    setDivisions(updated);
    logActivity('DIVISION_MGMT', `Added Division ${cleanDiv}`, `Added new operating division: ${cleanDiv}`);
    setNewDivisionInput('');
  };

  const handleRemoveDivision = (divToRemove) => {
    const inUseCostCenter = costCenters.some(c => c.division === divToRemove);
    const inUseOccupant = occupants.some(o => o.division === divToRemove && !o.employeeStatus.startsWith('RTD'));

    if (inUseCostCenter || inUseOccupant) {
      alert(`Cannot remove Division "${divToRemove}" because it is currently assigned to active cost centers or occupants.`);
      return;
    }

    if (confirm(`Remove division "${divToRemove}"?`)) {
      setDivisions(prev => prev.filter(d => d !== divToRemove));
      logActivity('DIVISION_MGMT', `Removed Division ${divToRemove}`, `Archived division ${divToRemove}`);
    }
  };

  // =========================================================
  // EXCEL ROSTER IMPORT ENGINE
  // =========================================================
  const handleExcelFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          alert('Spreadsheet is empty or could not be read.');
          return;
        }

        const parsedRows = rawJson.map((row, idx) => {
          const keys = Object.keys(row);
          const getVal = (candidates) => {
            for (const c of candidates) {
              const matchedKey = keys.find(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === c.toLowerCase().replace(/[^a-z0-9]/g, ''));
              if (matchedKey && row[matchedKey] !== undefined) return String(row[matchedKey]).trim();
            }
            return '';
          };

          const empId = getVal(['Employee ID', 'Emp ID', 'ID', 'Staff ID', 'EmpID', 'Badge']);
          const empName = getVal(['Employee Name', 'Name', 'Full Name', 'Staff Name']);
          const civilId = getVal(['Kuwait Civil ID', 'Civil ID', 'CivilID', 'QID']);
          const passportNo = getVal(['Passport Number', 'Passport No', 'Passport', 'PP No']);
          const nationality = getVal(['Nationality', 'Country', 'Nation']) || 'India';
          const mobileNo = getVal(['Mobile Number', 'Mobile', 'Phone', 'Tel', 'Contact']) || '+965 ';
          const title = getVal(['Job Title', 'Title', 'Designation', 'Position']) || 'Worker';
          const productiveType = getVal(['Employee Productive Type', 'Productive Type', 'Productivity Type', 'Productivity', 'Type', 'Emp Type']) || 'Direct Employee (DE)';
          const campNo = getVal(['Camp No', 'Camp', 'Building', 'Camp Code']) || 'UNASSIGNED';
          const flatCode = getVal(['Flat Code', 'Flat', 'Flat No']) || '';
          const roomNo = getVal(['Room No', 'Room', 'Room Number']) || 'PENDING';
          const roomGrade = getVal(['Room Grade', 'Grade', 'Category']) || 'Manual';
          const division = getVal(['Division', 'Dept', 'Department']) || 'IDS';
          const costCenter = getVal(['Project Cost Center', 'Cost Center', 'CostCenter', 'CC']) || '1IDS038-KIPIC';
          const entryDate = getVal(['Entry Date', 'Check In Date', 'Start Date']) || todayStr;
          const emContact = getVal(['Emergency Contact', 'Emergency Name', 'Kin']) || 'Family Contact';
          const emPhone = getVal(['Emergency Phone', 'Emergency Mobile', 'Kin Phone']) || '+965 ';

          const errors = [];
          if (!empId) errors.push('Missing Employee ID');
          if (!empName) errors.push('Missing Name');

          const isDuplicate = occupants.some(o => o.employeeId === empId && !o.employeeStatus.startsWith('RTD'));
          if (isDuplicate) errors.push('Employee ID already exists');

          return {
            rowIdx: idx + 2,
            employeeId: empId,
            employeeName: empName,
            civilId,
            passportNo,
            nationality,
            mobileNo,
            title,
            productiveType,
            campNo,
            flatCode,
            roomNo,
            roomGrade,
            division,
            costCenter,
            entryDate,
            emergencyContactName: emContact,
            emergencyContactPhone: emPhone,
            errors,
            status: errors.length === 0 ? 'VALID' : 'ERROR'
          };
        });

        const validCount = parsedRows.filter(r => r.status === 'VALID').length;
        const errorCount = parsedRows.filter(r => r.status === 'ERROR').length;

        setExcelParsedRows(parsedRows);
        setExcelImportStats({ total: parsedRows.length, valid: validCount, errors: errorCount });
        setShowExcelImportModal(true);
      } catch (err) {
        alert(`Failed to parse Excel file: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleCommitExcelImport = () => {
    const validRows = excelParsedRows.filter(r => r.status === 'VALID');
    if (validRows.length === 0) {
      alert('No valid rows available to import.');
      return;
    }

    const newOccupantsList = [...occupants];
    let updatedCamps = [...camps];

    validRows.forEach((row) => {
      const hasValidRoom = row.roomNo && row.roomNo !== 'PENDING' && row.campNo !== 'UNASSIGNED';
      const newOcc = {
        srNo: newOccupantsList.length + 1,
        campNo: hasValidRoom ? row.campNo : 'UNASSIGNED',
        campArea: camps.find(c => c.campNo === row.campNo)?.campArea || 'Pending Assignment',
        status: 'Permanent',
        division: row.division,
        costCenter: row.costCenter,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        nationality: row.nationality,
        title: row.title,
        productiveType: row.productiveType || 'Direct Employee (DE)',
        entryDate: row.entryDate,
        passportNo: row.passportNo,
        civilId: row.civilId,
        mobileNo: row.mobileNo,
        emergencyContactName: row.emergencyContactName,
        emergencyContactPhone: row.emergencyContactPhone,
        homeCountryAddress: 'Permanent Address on File',
        roomGrade: row.roomGrade,
        floorNo: Number(row.flatCode.split('-')[1] || 1),
        flatNo: Number(row.flatCode.split('-')[2] || 1),
        flatCode: row.flatCode || 'PENDING',
        roomNo: hasValidRoom ? row.roomNo : 'PENDING',
        employeeStatus: hasValidRoom ? 'On Job' : 'Unassigned',
        leaveStartDate: '', leaveEndDate: '', leaveReturnDate: '',
        rtdType: '', rtdDate: '',
        afrEntryRef: 'EXCEL-IMPORT',
        afrLogNo: `LOG-${row.employeeId}`,
        residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
        reallocationCostCenter: row.costCenter.split('-')[0],
        exitDate: '', afrExitRef: '', remarks: `Imported via ${excelImportFileName}`,
        stayHistory: []
      };

      newOccupantsList.push(newOcc);

      if (hasValidRoom) {
        updatedCamps = updatedCamps.map(c => {
          if (c.campNo !== row.campNo) return c;
          return {
            ...c,
            floors: c.floors.map(fl => ({
              ...fl,
              flats: fl.flats.map(ft => ({
                ...ft,
                rooms: ft.rooms.map(rm => {
                  if (rm.roomNo === row.roomNo && rm.occupants.length < rm.capacity && !rm.occupants.includes(row.employeeId)) {
                    return { ...rm, occupants: [...rm.occupants, row.employeeId] };
                  }
                  return rm;
                })
              }))
            }))
          };
        });
      }
    });

    setOccupants(newOccupantsList);
    setCamps(updatedCamps);
    logActivity('EXCEL_IMPORT', `Bulk Imported ${validRows.length} Employees`, `Imported from ${excelImportFileName}`);
    setShowExcelImportModal(false);
    alert(`Success: ${validRows.length} employees imported.`);
  };

  // Cost Center Actions
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
    logActivity('COST_CENTER', `Created Cost Center ${cleanCode}`, `Added project cost center: ${newCC.name} (${newCC.division})`);
    setNewCostCenterForm({ code: '', name: '', division: divisions[0] || 'IDS' });
  };

  const handleToggleCostCenterStatus = (id) => {
    setCostCenters(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
        logActivity('COST_CENTER', `Changed Status of ${c.code}`, `Status changed to ${nextStatus}`);
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  // =========================================================
  // PRE-REGISTER EMPLOYEE, AUTO-FILL BY ID, & EDIT EMPLOYEE
  // =========================================================
  const handlePreAddEmployeeSubmit = (e) => {
    e.preventDefault();
    const empId = preAddForm.employeeId.trim();
    if (occupants.some(o => o.employeeId === empId)) {
      alert(`Employee ID #${empId} already exists in the system.`);
      return;
    }

    const newOcc = {
      srNo: occupants.length + 1,
      campNo: 'UNASSIGNED',
      campArea: 'Pending Bed Assignment',
      status: 'Permanent',
      division: preAddForm.division,
      costCenter: preAddForm.costCenter,
      employeeId: empId,
      employeeName: preAddForm.employeeName,
      nationality: preAddForm.nationality,
      title: preAddForm.title,
      productiveType: preAddForm.productiveType,
      roomGrade: preAddForm.roomGrade,
      entryDate: preAddForm.entryDate,
      passportNo: preAddForm.passportNo,
      civilId: preAddForm.civilId,
      mobileNo: preAddForm.mobileNo,
      emergencyContactName: preAddForm.emergencyContactName,
      emergencyContactPhone: preAddForm.emergencyContactPhone,
      homeCountryAddress: '',
      floorNo: 0,
      flatNo: 0,
      flatCode: 'PENDING',
      roomNo: 'PENDING',
      employeeStatus: 'Unassigned',
      leaveStartDate: '', leaveEndDate: '', leaveReturnDate: '',
      rtdType: '', rtdDate: '',
      afrEntryRef: 'PRE-REG',
      afrLogNo: `LOG-${empId}`,
      residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
      reallocationCostCenter: preAddForm.costCenter.split('-')[0],
      exitDate: '', afrExitRef: '', remarks: 'Pre-registered in Occupants Directory',
      stayHistory: []
    };

    setOccupants(prev => [newOcc, ...prev]);
    setShowPreAddEmployeeModal(false);
    logActivity('OCCUPANT_REG', `Pre-Registered Employee #${empId}`, `${newOcc.employeeName} (${newOcc.productiveType} • ${newOcc.roomGrade}) added to directory`);
    setPreAddForm({
      employeeId: '', employeeName: '', nationality: 'India', title: 'Site Engineer',
      productiveType: 'Direct Employee (DE)', roomGrade: 'Manual',
      division: 'IDS', costCenter: '1IDS038-KIPIC', passportNo: '', civilId: '',
      mobileNo: '+965 ', emergencyContactName: '', emergencyContactPhone: '+965 ',
      entryDate: todayStr
    });
  };

  // Auto-Fill when typing Employee ID inside Bed Assignment Modal
  const handleCheckInEmployeeIdChange = (idVal) => {
    const cleanId = idVal.trim();
    const existing = occupants.find(o => o.employeeId.toLowerCase() === cleanId.toLowerCase());
    if (existing) {
      setCheckInForm(prev => ({
        ...prev,
        employeeId: existing.employeeId,
        employeeName: existing.employeeName || prev.employeeName,
        nationality: existing.nationality || prev.nationality,
        title: existing.title || prev.title,
        productiveType: existing.productiveType || prev.productiveType,
        roomGrade: existing.roomGrade || prev.roomGrade,
        division: existing.division || prev.division,
        costCenter: existing.costCenter || prev.costCenter,
        passportNo: existing.passportNo || prev.passportNo,
        civilId: existing.civilId || prev.civilId,
        mobileNo: existing.mobileNo || prev.mobileNo,
        emergencyContactName: existing.emergencyContactName || prev.emergencyContactName,
        emergencyContactPhone: existing.emergencyContactPhone || prev.emergencyContactPhone
      }));
    } else {
      setCheckInForm(prev => ({ ...prev, employeeId: idVal }));
    }
  };

  // Save Edited Employee Details (Point 4)
  const handleSaveEmployeeEdit = (e) => {
    e.preventDefault();
    if (!editingEmployeeModal) return;

    setOccupants(prev => prev.map(o => o.employeeId === editingEmployeeModal.originalId ? {
      ...editingEmployeeModal,
      employeeId: editingEmployeeModal.employeeId.trim()
    } : o));

    if (editingEmployeeModal.originalId !== editingEmployeeModal.employeeId.trim()) {
      const newId = editingEmployeeModal.employeeId.trim();
      setCamps(prev => prev.map(c => ({
        ...c,
        floors: c.floors.map(fl => ({
          ...fl,
          flats: fl.flats.map(ft => ({
            ...ft,
            rooms: ft.rooms.map(rm => ({
              ...rm,
              occupants: rm.occupants.map(id => id === editingEmployeeModal.originalId ? newId : id)
            }))
          }))
        }))
      })));
    }

    if (viewingEmployeeDossier && viewingEmployeeDossier.employeeId === editingEmployeeModal.originalId) {
      setViewingEmployeeDossier({ ...editingEmployeeModal, employeeId: editingEmployeeModal.employeeId.trim() });
    }

    logActivity('OCCUPANT_EDIT', `Edited Details for #${editingEmployeeModal.employeeId}`, `Updated profile for ${editingEmployeeModal.employeeName}`);
    setEditingEmployeeModal(null);
  };

  // Occupant Bed Check-In Submit (Auto-triggers Material Issuance Preview Modal)
  const handleCheckInSubmit = (e) => {
    e.preventDefault();
    const empId = checkInForm.employeeId.trim();
    const existingActiveInRoom = occupants.find(o => o.employeeId === empId && o.employeeStatus !== 'Unassigned' && !o.employeeStatus.startsWith('RTD'));
    if (existingActiveInRoom) {
      alert(`Employee #${empId} is already assigned to ${existingActiveInRoom.campNo} Room ${existingActiveInRoom.roomNo}. Use Relocate instead.`);
      return;
    }

    const targetCamp = camps.find(c => c.id === checkInForm.campId) || activeCamp;
    const existingRecord = occupants.find(o => o.employeeId === empId);

    const assignedOcc = {
      srNo: existingRecord ? existingRecord.srNo : occupants.length + 1,
      campNo: targetCamp.campNo,
      campArea: targetCamp.campArea,
      status: 'Permanent',
      division: checkInForm.division,
      costCenter: checkInForm.costCenter,
      employeeId: empId,
      employeeName: checkInForm.employeeName,
      nationality: checkInForm.nationality,
      title: checkInForm.title,
      productiveType: checkInForm.productiveType || 'Direct Employee (DE)',
      roomGrade: checkInForm.roomGrade,
      entryDate: checkInForm.entryDate,
      passportNo: checkInForm.passportNo,
      civilId: checkInForm.civilId,
      mobileNo: checkInForm.mobileNo,
      emergencyContactName: checkInForm.emergencyContactName,
      emergencyContactPhone: checkInForm.emergencyContactPhone,
      homeCountryAddress: checkInForm.homeCountryAddress,
      floorNo: Number(checkInForm.floorNo),
      flatNo: Number(checkInForm.flatCode.split('-')[2] || 1),
      flatCode: checkInForm.flatCode,
      roomNo: checkInForm.roomNo,
      employeeStatus: 'On Job',
      leaveStartDate: '', leaveEndDate: '', leaveReturnDate: '',
      rtdType: '', rtdDate: '',
      afrEntryRef: checkInForm.docRef || '150-04',
      afrLogNo: checkInForm.docRef || `LOG-${empId}`,
      residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
      reallocationCostCenter: checkInForm.costCenter.split('-')[0],
      exitDate: '', afrExitRef: '',
      remarks: `Assigned Bed (Ref: ${checkInForm.docRef || '150-04'})`,
      materialsIssued: checkInForm.materials,
      arrivalType: checkInForm.arrivalType,
      stayHistory: existingRecord?.stayHistory || []
    };

    if (existingRecord) {
      setOccupants(prev => prev.map(o => o.employeeId === empId ? assignedOcc : o));
    } else {
      setOccupants(prev => [assignedOcc, ...prev]);
    }

    setCamps(prev => prev.map(c => c.id !== targetCamp.id ? c : {
      ...c,
      floors: c.floors.map(fl => ({
        ...fl,
        flats: fl.flats.map(ft => ({
          ...ft,
          rooms: ft.rooms.map(rm => rm.roomNo === checkInForm.roomNo ? { ...rm, occupants: [...rm.occupants, empId] } : rm)
        }))
      }))
    }));

    setShowCheckInModal(false);
    logActivity('CHECK_IN', `Assigned #${empId} to Room ${checkInForm.roomNo}`, `${assignedOcc.employeeName} (${assignedOcc.productiveType} • ${assignedOcc.roomGrade}) assigned to ${targetCamp.campNo} Room ${checkInForm.roomNo} [Ref: ${assignedOcc.afrEntryRef}]`, targetCamp.campNo);

    // Automatically open the Material Issuance Form (Doc. Ref: 150-04) Preview Modal!
    setReportPreviewModal({
      type: 'issuance',
      occupant: assignedOcc,
      arrivalType: checkInForm.arrivalType,
      docRef: checkInForm.docRef || '150-04',
      materials: checkInForm.materials
    });
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    const emp = showLeaveModal;
    setOccupants(prev => prev.map(o => o.employeeId === emp.employeeId ? {
      ...o, employeeStatus: 'On Leave', leaveStartDate: leaveForm.startDate, leaveEndDate: leaveForm.expectedEndDate, leaveReturnDate: ''
    } : o));

    const newLeaveLog = {
      id: `lv-${Date.now()}`,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      campNo: emp.campNo,
      roomNo: emp.roomNo,
      leaveStartDate: leaveForm.startDate,
      expectedEndDate: leaveForm.expectedEndDate,
      actualReturnDate: '',
      afrLogNo: leaveForm.afrLogNo,
      remarks: leaveForm.remarks,
      status: 'Active Leave',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString()
    };
    setLeaveLogs(prev => [newLeaveLog, ...prev]);
    logActivity('LEAVE_START', `Marked #${emp.employeeId} On Leave`, `${emp.employeeName} on vacation from ${leaveForm.startDate} to ${leaveForm.expectedEndDate}`, emp.campNo);
    setShowLeaveModal(null);
    setManageOccupantModal(null);
  };

  const handleReturnJobSubmit = (e) => {
    e.preventDefault();
    const emp = showReturnJobModal;
    setOccupants(prev => prev.map(o => o.employeeId === emp.employeeId ? {
      ...o, employeeStatus: 'On Job', leaveReturnDate: returnJobForm.actualReturnDate
    } : o));

    setLeaveLogs(prev => prev.map(l => (l.employeeId === emp.employeeId && l.status === 'Active Leave') ? {
      ...l, actualReturnDate: returnJobForm.actualReturnDate, status: 'Returned', remarks: `${l.remarks} • Note: ${returnJobForm.remarks}`
    } : l));

    logActivity('LEAVE_RETURN', `Marked #${emp.employeeId} Returned`, `${emp.employeeName} returned on ${returnJobForm.actualReturnDate}`, emp.campNo);
    setShowReturnJobModal(null);
    setManageOccupantModal(null);
  };

  const handleRtdSubmit = (e) => {
    e.preventDefault();
    const emp = showRtdModal;
    const rtdStatus = `RTD - ${rtdForm.rtdType}`;

    setOccupants(prev => prev.map(o => o.employeeId === emp.employeeId ? {
      ...o, employeeStatus: rtdStatus, rtdType: rtdForm.rtdType, rtdDate: rtdForm.rtdDate,
      afrExitRef: rtdForm.afrExitRef, remarks: rtdForm.remarks, exitDate: rtdForm.rtdDate
    } : o));

    setCamps(prev => prev.map(c => ({
      ...c,
      floors: c.floors.map(fl => ({
        ...fl,
        flats: fl.flats.map(ft => ({
          ...ft,
          rooms: ft.rooms.map(rm => ({
            ...rm, occupants: rm.occupants.filter(id => id !== emp.employeeId)
          }))
        }))
      }))
    })));

    const newRtdLog = {
      id: `rtd-${Date.now()}`,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      rtdType: rtdForm.rtdType,
      rtdDate: rtdForm.rtdDate,
      vacatedCampNo: emp.campNo,
      vacatedRoomNo: emp.roomNo,
      costCenter: emp.costCenter,
      afrExitRef: rtdForm.afrExitRef,
      remarks: rtdForm.remarks,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString()
    };
    setRtdLogs(prev => [newRtdLog, ...prev]);
    logActivity('RTD_EXIT', `Processed RTD (${rtdForm.rtdType}) for #${emp.employeeId}`, `${emp.employeeName} vacated room ${emp.roomNo}`, emp.campNo);
    setShowRtdModal(null);
    setManageOccupantModal(null);
  };

  const handleCostCenterTransferRequest = (e) => {
    e.preventDefault();
    const emp = showTransferRequestModal;
    const foundCC = costCenters.find(c => c.code === transferRequestForm.toCostCenter);
    const toDiv = foundCC ? foundCC.division : transferRequestForm.toDivision;

    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'AUDITOR') {
      setOccupants(prev => prev.map(o => o.employeeId === emp.employeeId ? {
        ...o, costCenter: transferRequestForm.toCostCenter, division: toDiv
      } : o));
      logActivity('COST_CENTER_TRANSFER', `Direct Transfer #${emp.employeeId}`, `Moved #${emp.employeeId} to ${transferRequestForm.toCostCenter}`);
      alert(`Cost center for #${emp.employeeId} updated to ${transferRequestForm.toCostCenter}!`);
    } else {
      const newReq = {
        id: `tr-${Date.now()}`,
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        fromCostCenter: emp.costCenter,
        fromDivision: emp.division,
        toCostCenter: transferRequestForm.toCostCenter,
        toDivision: toDiv,
        reason: transferRequestForm.reason,
        requestedBy: currentUser.name,
        requestedByRole: currentUser.role,
        requestDate: new Date().toLocaleString(),
        status: 'PENDING',
        reviewedBy: '', reviewDate: '', reviewRemarks: ''
      };
      setTransferRequests(prev => [newReq, ...prev]);
      logActivity('COST_CENTER_REQUEST', `Requested Transfer #${emp.employeeId}`, `Requested move to ${transferRequestForm.toCostCenter}`);
      alert(`Transfer request submitted for approval.`);
    }
    setShowTransferRequestModal(null);
    setManageOccupantModal(null);
  };

  const handleReviewTransfer = (reqId, decision) => {
    const req = transferRequests.find(r => r.id === reqId);
    if (!req) return;

    if (decision === 'APPROVED') {
      setOccupants(prev => prev.map(o => o.employeeId === req.employeeId ? {
        ...o, costCenter: req.toCostCenter, division: req.toDivision
      } : o));
      logActivity('COST_CENTER_APPROVAL', `Approved Transfer #${req.employeeId}`, `Approved move to ${req.toCostCenter}`);
    } else {
      logActivity('COST_CENTER_REJECTION', `Rejected Transfer #${req.employeeId}`, `Rejected move to ${req.toCostCenter}`);
    }

    setTransferRequests(prev => prev.map(r => r.id === reqId ? {
      ...r, status: decision, reviewedBy: currentUser.name, reviewDate: new Date().toLocaleString()
    } : r));
  };

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
      transferDate: todayStr,
      docRef: `REL-${occ.employeeId}-${todayStr.slice(5)}`,
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
      alert('Selected target room is currently at full capacity.');
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
      docRef: relocationForm.docRef || 'N/A',
      reason: `${relocationForm.reason || 'Inter-Camp Transfer'} (Doc Ref: ${relocationForm.docRef || 'N/A'})`
    };

    const updatedStayHistory = [...(relocatingOccupant.stayHistory || []), previousStayRecord];

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
      afrEntryRef: relocationForm.docRef || relocatingOccupant.afrEntryRef,
      stayHistory: updatedStayHistory
    };

    setOccupants(prevOccs =>
      prevOccs.map(o => o.employeeId === relocatingOccupant.employeeId ? updatedOccupant : o)
    );

    if (viewingEmployeeDossier && viewingEmployeeDossier.employeeId === relocatingOccupant.employeeId) {
      setViewingEmployeeDossier(updatedOccupant);
    }

    logActivity('RELOCATION', `Relocated #${relocatingOccupant.employeeId} to Room ${targetRoom.roomNo}`, `${relocatingOccupant.employeeName} moved to ${targetCamp.campNo} Room ${targetRoom.roomNo} [Doc Ref: ${relocationForm.docRef}]`, targetCamp.campNo);

    const relocRecord = {
      employeeId: relocatingOccupant.employeeId,
      employeeName: relocatingOccupant.employeeName,
      title: relocatingOccupant.title,
      fromRoom: `${relocatingOccupant.campNo} (${relocatingOccupant.roomNo})`,
      toRoom: `${targetCamp.campNo} (${targetRoom.roomNo})`,
      relocationDate: relocationForm.transferDate,
      docRef: relocationForm.docRef,
      reason: relocationForm.reason
    };

    setRelocatingOccupant(null);
    setReportPreviewModal({
      type: 'relocation',
      record: relocRecord
    });
  };

  // Misconduct & Maintenance Actions
  const handleSaveMisconduct = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `disc-${Date.now()}`,
      ...misconductForm,
      docRef: `DISC-${misconductForm.employeeId}-${Date.now().toString().slice(-4)}`
    };

    setMisconductLogs(prev => [newEntry, ...prev]);
    logActivity('DISCIPLINARY', `Filed Misconduct for #${newEntry.employeeId}`, `${newEntry.employeeName}: ${newEntry.typeOfViolation}`);
    exportAccommodationMisconductReport(newEntry);
    setShowMisconductModal(false);
    alert(`Misconduct recorded and Report (.xlsx) generated.`);
  };

  const handleSaveMaintenance = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `MNT-${Math.floor(100 + Math.random() * 900)}`,
      ...maintenanceForm
    };

    setMaintenanceLogs(prev => [newEntry, ...prev]);
    logActivity('MAINTENANCE', `Logged Work Order for Room ${newEntry.roomNo}`, `${newEntry.issueDetails} (Status: ${newEntry.status})`);
    setShowMaintenanceModal(false);
    alert(`Maintenance issue logged in register.`);
  };

  // User Creation with Neon DB Sync
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const payload = {
      staffId: newUserForm.staffId,
      name: newUserForm.name,
      email: newUserForm.email,
      passwordHash: newUserForm.password,
      title: newUserForm.title || 'Camp Coordinator',
      role: newUserForm.role,
      campScope: newUserForm.campScope,
      permissions: {
        canManageUsers: newUserForm.role === 'SUPER_ADMIN' || newUserForm.canManageUsers,
        canAddCamps: newUserForm.role === 'SUPER_ADMIN' || newUserForm.canAddCamps,
        canDeleteCamps: newUserForm.role === 'SUPER_ADMIN' || newUserForm.canDeleteCamps,
        canEditOccupants: newUserForm.canEditOccupants,
        canExportReports: newUserForm.canExportReports,
        canApproveTransfers: newUserForm.role === 'SUPER_ADMIN' || newUserForm.role === 'AUDITOR'
      }
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create user in database');
      const savedUser = await res.json();
      setUsers(prev => [savedUser, ...prev]);
      setShowAddUserModal(false);
      logActivity('USER_MGMT', `Created User Account ${savedUser.staffId}`, `Created ${savedUser.name} (${savedUser.role}) in database`);
    } catch (err) {
      const fallbackUser = {
        id: `u-${Date.now()}`,
        ...payload,
        status: 'Active',
        lastLogin: 'Never'
      };
      setUsers(prev => [fallbackUser, ...prev]);
      setShowAddUserModal(false);
      logActivity('USER_MGMT', `Created User ${fallbackUser.staffId}`, `Created ${fallbackUser.name}`);
    }

    setNewUserForm({
      staffId: '', name: '', email: '', password: '', title: '', role: 'CAMP_EDITOR',
      campScope: 'ALL', canManageUsers: false, canAddCamps: false, canDeleteCamps: true,
      canEditOccupants: true, canExportReports: true, canApproveTransfers: false
    });
  };

  const handleExecutePasswordReset = (e) => {
    e.preventDefault();
    if (newPasswordValue.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    if (newPasswordValue !== confirmPasswordValue) {
      alert('Passwords do not match.');
      return;
    }
    setUsers(prev => prev.map(u => u.id === targetUserForReset.id ? { ...u, passwordHash: newPasswordValue } : u));
    setResetSuccessMessage(`Password updated for ${targetUserForReset.name}.`);
    logActivity('USER_MGMT', `Reset Password for ${targetUserForReset.staffId}`, `Updated password for ${targetUserForReset.name}`);
    setTimeout(() => {
      setShowResetPasswordModal(false);
      setTargetUserForReset(null);
      setNewPasswordValue('');
      setConfirmPasswordValue('');
      setResetSuccessMessage('');
    }, 1400);
  };

  // Auth Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
        <div className="w-full pt-4" />
        <div className="w-full max-w-[440px] mx-auto my-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3.5 bg-white border border-slate-200 rounded-2xl shadow-lg mb-3">
              <DhowLogo className="h-10 w-auto" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Camp Management System
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Dhow Engineering • Cost Center 1ACD000
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-7 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 text-center mb-6">Sign In</h2>
            {loginError && (
              <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your email or Staff ID</label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@al-dhow.com"
                  className="w-full border border-slate-300 rounded-lg py-2.5 px-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full border border-slate-300 rounded-lg py-2.5 px-3.5 pr-10 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
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
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-cyan-600"
                  />
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-md text-xs tracking-wider uppercase flex items-center justify-center gap-2"
              >
                {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>SIGN IN</span>}
              </button>
            </form>
          </div>
        </div>
        <div className="w-full text-center text-xs text-slate-400 pb-2">
          © 2026 Dhow Engineering General Trading & Contracting Co.
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const canAddCamps = currentUser.role === 'SUPER_ADMIN' || currentUser.permissions?.canAddCamps;
  const canApproveTransfers = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'AUDITOR';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <input
        type="file"
        ref={excelFileInputRef}
        onChange={handleExcelFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Top Header */}
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
                Accommodation Registry • Floor-by-Floor Topology • Engineering vs Manual Roster
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ID / Name / Mobile..."
                  value={universalSearchQuery}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  onChange={(e) => {
                    setUniversalSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {universalSearchQuery && (
                  <button onClick={() => { setUniversalSearchQuery(''); setIsSearchDropdownOpen(false); }} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isSearchDropdownOpen && universalSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-950">
                    Matching Employees ({universalSearchResults.length})
                  </div>
                  <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                    {universalSearchResults.map(occ => (
                      <div
                        key={occ.employeeId}
                        onClick={() => {
                          setViewingEmployeeDossier(occ);
                          setIsSearchDropdownOpen(false);
                          setUniversalSearchQuery('');
                        }}
                        className="p-3 hover:bg-slate-800 cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-cyan-400 font-bold text-xs">#{occ.employeeId}</span>
                            <span className="font-semibold text-white text-xs truncate">{occ.employeeName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-medium">{occ.productiveType || 'DE'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {occ.campNo} • Room {occ.roomNo} ({occ.roomGrade}) • {occ.employeeStatus}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                          Open →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPreAddEmployeeModal(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Employee</span>
            </button>

            {canAddCamps && (
              <button
                onClick={() => setShowAddCampModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Building</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 7 SIMPLIFIED NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'map' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Camp Master</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
              {globalStats.freeBeds} Free
            </span>
          </button>

          <button
            onClick={() => setActiveTab('occupants')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'occupants' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span>Occupants</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              {occupants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invoicing')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'invoicing' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Invoicing</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
              {projectInvoicingData.grandTotalKWD.toFixed(0)} KWD
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'reports' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'approvals' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Approvals & Logs</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
              {transferRequests.filter(r => r.status === 'PENDING').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('activity_logs')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'activity_logs' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Activity Log</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'admin' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Users</span>
            </button>
          )}
        </div>
      </header>

      {/* Sub-Header Status Bar with Preview Triggers */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Logged in as:</span>
            <span className="font-bold text-slate-900">{currentUser.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
              {currentUser.role}
            </span>
            {globalStats.unassignedCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                {globalStats.unassignedCount} Unassigned Staff Ready for Bed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportPreviewModal({ type: 'summary' })}
              className="text-slate-700 hover:text-cyan-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer text-xs"
              title="Preview & Export Camp Summary Status"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-600" />
              <span>Preview Summary Status (T1)</span>
            </button>
            <button
              onClick={() => setReportPreviewModal({ type: 'daily', camp: activeCamp })}
              className="text-slate-700 hover:text-emerald-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer text-xs"
              title="Preview & Export Daily Occupancy Report"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preview Daily Report (T2)</span>
            </button>
            <button
              onClick={() => setShowManageCostCentersModal(true)}
              className="text-cyan-700 hover:text-cyan-900 font-bold flex items-center gap-1 cursor-pointer ml-1 text-xs"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Cost Centers & Divs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* 6 Global Telemetry Metric Cards */}
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
              Non-Manual & Manual
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Occupied Spots</span>
              <Users className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-black text-cyan-600 mt-1.5">{globalStats.occupiedBeds}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {globalStats.occupancyPct}% Network Occupancy
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span>Free / Vacant Spots</span>
              <Home className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1.5">{globalStats.freeBeds}</div>
            <div className="text-[11px] text-emerald-700/80 mt-1">
              Ready for check-in
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

        {/* TAB 1: CAMP MASTER */}
        {activeTab === 'map' && activeCamp && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
                    SELECT CAMP BUILDING:
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
                        onClick={() => { setSelectedCampId(camp.id); setSelectedFloorNo(1); }}
                        className={`text-left px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          {camp.campNo} <span className={isSelected ? 'text-cyan-300' : 'text-slate-500'}>• {camp.campArea}</span>
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {camp.floors.length} Floors • {campFlats} Flats •{' '}
                          <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold'}>
                            {campFree} Free
                          </span> / {campBeds} Beds
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  {canAddCamps && (
                    <button
                      onClick={() => setEditingCampModal({ ...activeCamp })}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-slate-600" />
                      <span>Edit {activeCamp.campNo}</span>
                    </button>
                  )}
                  {canAddCamps && (
                    <button
                      onClick={() => setShowAddCampModal(true)}
                      className="px-3.5 py-2.5 rounded-xl border-2 border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Building</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Floor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeCamp.floors.map(floor => {
                let flBeds = 0;
                let flOcc = 0;
                let nmCount = 0;
                let mCount = 0;

                floor.flats.forEach(ft => {
                  if (ft.roomGrade === 'Non-Manual') nmCount += 1;
                  else mCount += 1;
                  ft.rooms.forEach(rm => {
                    flBeds += rm.capacity;
                    flOcc += rm.occupants.length;
                  });
                });

                const flFree = flBeds - flOcc;
                const flPct = flBeds > 0 ? Math.round((flOcc / flBeds) * 100) : 0;
                const isSelected = floor.floorNo === activeFloor?.floorNo;

                return (
                  <div
                    key={floor.floorNo}
                    onClick={() => setSelectedFloorNo(floor.floorNo)}
                    className={`bg-white rounded-2xl p-4 cursor-pointer transition-all border-2 ${
                      isSelected ? 'border-cyan-600 shadow-md' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          Floor {floor.floorNo}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {floor.flats.length} Flats ({nmCount} NM • {mCount} M)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{flFree} Free</span>
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

                        <div className="flex items-center gap-2">
                          <select
                            value={flat.roomGrade}
                            onChange={(e) => handleFlatGradeChange(activeCamp.id, activeFloor.floorNo, flat.flatCode, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                              flat.roomGrade === 'Non-Manual'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                                : 'bg-amber-950 text-amber-300 border-amber-700'
                            }`}
                          >
                            <option value="Non-Manual">Non-Manual (2/rm)</option>
                            <option value="Manual">Manual (3/rm)</option>
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
                                  Room {room.roomNo} <span className="text-slate-400 font-normal">({flat.roomGrade} • Max {room.capacity})</span>
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
                                            <span className="text-xs font-bold text-slate-900 truncate">{occ.employeeName}</span>
                                          </div>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                            isOnLeave ? 'bg-amber-200 text-amber-900' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                          }`}>
                                            {isOnLeave ? '✈ On Leave' : 'On Job'}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-1.5 text-[11px]">
                                          <span className="text-slate-500 truncate">
                                            {occ.roomGrade} • <strong className="text-slate-700">{occ.nationality}</strong> • {occ.division}
                                          </span>
                                          <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <button
                                              onClick={() => setEditingEmployeeModal({ ...occ, originalId: occ.employeeId })}
                                              className="text-emerald-700 hover:underline font-bold cursor-pointer"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => setViewingEmployeeDossier(occ)}
                                              className="text-cyan-600 hover:text-cyan-800 font-semibold cursor-pointer"
                                            >
                                              Dossier
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
                                      onClick={() => {
                                        setCheckInForm(prev => ({
                                          ...prev,
                                          campId: activeCamp.id,
                                          floorNo: activeFloor.floorNo,
                                          flatCode: flat.flatCode,
                                          roomNo: room.roomNo,
                                          roomGrade: flat.roomGrade,
                                          employeeId: '',
                                          employeeName: '',
                                          docRef: '150-04'
                                        }));
                                        setShowCheckInModal(true);
                                      }}
                                      className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-700 flex items-center justify-between text-xs font-semibold cursor-pointer"
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

        {/* TAB 2: OCCUPANTS DIRECTORY (With Pre-Add Employee, Edit, & Direct Material Issuance) */}
        {activeTab === 'occupants' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search ID, Name, Nationality, Room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={productiveTypeFilter}
                  onChange={(e) => setProductiveTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2"
                >
                  <option value="ALL">All Productive Types</option>
                  <option value="Direct Employee (DE)">Direct Employee (DE)</option>
                  <option value="Manpower Supply (MPS)">Manpower Supply (MPS)</option>
                  <option value="Shutdown">Shutdown</option>
                  <option value="Others">Others</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Unassigned">Unassigned (Pending Bed)</option>
                  <option value="On Job">On Job</option>
                  <option value="On Leave">On Leave</option>
                  <option value="RTD - Resigned">RTD - Resigned</option>
                  <option value="RTD - Terminated">RTD - Terminated</option>
                </select>

                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2"
                >
                  <option value="ALL">All Divisions</option>
                  {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <button
                  onClick={() => setShowPreAddEmployeeModal(true)}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Employee</span>
                </button>

                <button
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Import Excel</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Showing {filteredOccupants.length} of {occupants.length} Employees</span>
                <span className="text-cyan-700 font-mono">Master Occupants Directory</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Productive Type</th>
                      <th className="p-3">Manual / Non-Manual</th>
                      <th className="p-3">Nationality</th>
                      <th className="p-3">Mobile No</th>
                      <th className="p-3">Division / CC</th>
                      <th className="p-3">Camp & Room</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOccupants.map(occ => (
                      <tr key={occ.employeeId} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-cyan-600">
                          <button onClick={() => setViewingEmployeeDossier(occ)} className="hover:underline">
                            #{occ.employeeId}
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          <button onClick={() => setViewingEmployeeDossier(occ)} className="hover:text-cyan-700">
                            {occ.employeeName}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            {occ.productiveType || 'Direct Employee (DE)'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[10px]">
                          <span className={`px-2 py-0.5 rounded ${occ.roomGrade === 'Non-Manual' ? 'bg-cyan-50 text-cyan-700' : 'bg-amber-50 text-amber-800'}`}>
                            {occ.roomGrade}
                          </span>
                        </td>
                        <td className="p-3">{occ.nationality}</td>
                        <td className="p-3 font-mono text-cyan-700 font-semibold">{occ.mobileNo || 'N/A'}</td>
                        <td className="p-3 font-mono text-slate-600">{occ.division} ({occ.costCenter})</td>
                        <td className="p-3 font-mono font-bold">
                          {occ.employeeStatus === 'Unassigned' ? (
                            <span className="text-blue-600">Unassigned</span>
                          ) : (
                            `${occ.campNo} (${occ.roomNo})`
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            occ.employeeStatus === 'On Job' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            occ.employeeStatus === 'Unassigned' ? 'bg-blue-100 text-blue-800' :
                            occ.employeeStatus === 'On Leave' ? 'bg-amber-100 text-amber-800' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {occ.employeeStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingEmployeeModal({ ...occ, originalId: occ.employeeId })}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setReportPreviewModal({
                                type: 'issuance',
                                occupant: occ,
                                arrivalType: occ.arrivalType || 'Local Residency Transfer',
                                docRef: occ.afrEntryRef || '150-04',
                                materials: occ.materialsIssued || { mattress: true, pillow: true, bedsheet: true, blanket: true }
                              })}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] cursor-pointer"
                              title="Material Issuance Form (Doc. Ref: 150-04)"
                            >
                              Issuance (150-04)
                            </button>
                            <button
                              onClick={() => setViewingEmployeeDossier(occ)}
                              className="px-2 py-1 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-[11px] cursor-pointer"
                            >
                              Dossier
                            </button>
                            <button
                              onClick={() => setManageOccupantModal(occ)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
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

        {/* TAB 3: INVOICING */}
        {activeTab === 'invoicing' && (
          <InvoicingTab
            billingPeriod={billingPeriod}
            setBillingPeriod={setBillingPeriod}
            rates={rates}
            setRates={setRates}
            otherCosts={otherCosts}
            onUpdateOtherCost={(cc, amt, desc) => setOtherCosts(prev => ({ ...prev, [cc]: { amount: amt, description: desc } }))}
            projectInvoicingData={projectInvoicingData}
            setShowManageCostCentersModal={setShowManageCostCentersModal}
            setSelectedInvoiceModal={setSelectedInvoiceModal}
            handleExportInvoicingCSV={() => alert('Billing CSV Exported')}
          />
        )}

        {/* TAB 4: REPORTS */}
        {activeTab === 'reports' && (
          <ReportsTab
            camps={camps}
            occupants={occupants}
            leaveLogs={leaveLogs}
            rtdLogs={rtdLogs}
            maintenanceLogs={maintenanceLogs}
            misconductLogs={misconductLogs}
            projectInvoicingData={projectInvoicingData}
            activeCamp={activeCamp}
          />
        )}

        {/* TAB 5: ACTIVITY LOG */}
        {activeTab === 'activity_logs' && (
          <ActivityLogTab
            activityLogs={activityLogs}
            onClearLogs={() => setActivityLogs([])}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {/* TAB 6: APPROVALS & LOGS */}
        {activeTab === 'approvals' && (
          <ApprovalsAndTablesTab
            transferRequests={transferRequests}
            onReviewTransferRequest={handleReviewTransfer}
            canApproveTransfers={canApproveTransfers}
            leaveLogs={leaveLogs}
            rtdLogs={rtdLogs}
            costCenters={costCenters}
            occupants={occupants}
            maintenanceLogs={maintenanceLogs}
            misconductLogs={misconductLogs}
            onExportMisconductLog={() => exportMisconductLog(misconductLogs)}
            onExportMaintenanceLog={() => exportMaintenanceLog(maintenanceLogs)}
            onDownloadSQLSchema={() => alert('PostgreSQL schema downloaded')}
          />
        )}

        {/* TAB 7: USERS (RBAC) */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  System Users & Access Control
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage user accounts, roles, camp scopes, or reset passwords.
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b">
                    <tr>
                      <th className="py-3.5 px-4">Staff ID</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Camp Scope</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-600">{u.staffId}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">{u.campScope}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => { setTargetUserForReset(u); setShowResetPasswordModal(true); }}
                            className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Reset Password
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
      </main>

      {/* =================================================================== */}
      {/* MODAL: PRE-REGISTER EMPLOYEE (BEFORE BED ASSIGNMENT)                */}
      {/* =================================================================== */}
      {showPreAddEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600" /> Add Employee to Master Directory
              </h3>
              <button onClick={() => setShowPreAddEmployeeModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-500">
              Pre-register an employee in the system. When you assign them a bed in Camp Master later, entering their Employee ID will auto-fill all these details.
            </p>

            <form onSubmit={handlePreAddEmployeeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee ID *</label>
                  <input type="text" required placeholder="e.g. 6425" value={preAddForm.employeeId} onChange={e => setPreAddForm({ ...preAddForm, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input type="text" required placeholder="Full Name" value={preAddForm.employeeName} onChange={e => setPreAddForm({ ...preAddForm, employeeName: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee Productive Type</label>
                  <select value={preAddForm.productiveType} onChange={e => setPreAddForm({ ...preAddForm, productiveType: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold bg-white">
                    <option value="Direct Employee (DE)">Direct Employee (DE)</option>
                    <option value="Manpower Supply (MPS)">Manpower Supply (MPS)</option>
                    <option value="Shutdown">Shutdown</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Manual / Non-Manual Category</label>
                  <select value={preAddForm.roomGrade} onChange={e => setPreAddForm({ ...preAddForm, roomGrade: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold text-cyan-700 bg-white">
                    <option value="Manual">Manual</option>
                    <option value="Non-Manual">Non-Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nationality</label>
                  <input type="text" required value={preAddForm.nationality} onChange={e => setPreAddForm({ ...preAddForm, nationality: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mobile Number</label>
                  <input type="text" required value={preAddForm.mobileNo} onChange={e => setPreAddForm({ ...preAddForm, mobileNo: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Passport Number</label>
                  <input type="text" value={preAddForm.passportNo} onChange={e => setPreAddForm({ ...preAddForm, passportNo: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kuwait Civil ID</label>
                  <input type="text" value={preAddForm.civilId} onChange={e => setPreAddForm({ ...preAddForm, civilId: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Designation</label>
                  <input type="text" value={preAddForm.title} onChange={e => setPreAddForm({ ...preAddForm, title: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cost Center</label>
                  <select
                    value={preAddForm.costCenter}
                    onChange={e => {
                      const c = costCenters.find(cc => cc.code === e.target.value);
                      setPreAddForm({ ...preAddForm, costCenter: e.target.value, division: c ? c.division : preAddForm.division });
                    }}
                    className="w-full border rounded-xl px-2 py-2 font-mono font-bold"
                  >
                    {costCenters.filter(c => c.status === 'Active').map(cc => (
                      <option key={cc.id} value={cc.code}>{cc.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Division</label>
                  <select value={preAddForm.division} onChange={e => setPreAddForm({ ...preAddForm, division: e.target.value })} className="w-full border rounded-xl px-2 py-2 font-bold">
                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowPreAddEmployeeModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold cursor-pointer">Save Employee to Directory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: EDIT EMPLOYEE DETAILS (POINT 4)                              */}
      {/* =================================================================== */}
      {editingEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-600" /> Edit Employee Details (#{editingEmployeeModal.originalId})
              </h3>
              <button onClick={() => setEditingEmployeeModal(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEmployeeEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee ID</label>
                  <input type="text" required value={editingEmployeeModal.employeeId} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input type="text" required value={editingEmployeeModal.employeeName} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, employeeName: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Productive Type</label>
                  <select value={editingEmployeeModal.productiveType || 'Direct Employee (DE)'} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, productiveType: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold">
                    <option value="Direct Employee (DE)">Direct Employee (DE)</option>
                    <option value="Manpower Supply (MPS)">Manpower Supply (MPS)</option>
                    <option value="Shutdown">Shutdown</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Manual / Non-Manual Grade</label>
                  <select value={editingEmployeeModal.roomGrade || 'Manual'} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, roomGrade: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold text-cyan-700">
                    <option value="Manual">Manual</option>
                    <option value="Non-Manual">Non-Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nationality</label>
                  <input type="text" value={editingEmployeeModal.nationality} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, nationality: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mobile Number</label>
                  <input type="text" value={editingEmployeeModal.mobileNo} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, mobileNo: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Passport Number</label>
                  <input type="text" value={editingEmployeeModal.passportNo} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, passportNo: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kuwait Civil ID</label>
                  <input type="text" value={editingEmployeeModal.civilId} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, civilId: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Job Title</label>
                  <input type="text" value={editingEmployeeModal.title} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, title: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cost Center</label>
                  <select value={editingEmployeeModal.costCenter} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, costCenter: e.target.value })} className="w-full border rounded-xl px-2 py-2 font-mono font-bold">
                    {costCenters.map(cc => <option key={cc.id} value={cc.code}>{cc.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Division</label>
                  <select value={editingEmployeeModal.division} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, division: e.target.value })} className="w-full border rounded-xl px-2 py-2 font-bold">
                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Emergency Contact Name</label>
                  <input type="text" value={editingEmployeeModal.emergencyContactName || ''} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, emergencyContactName: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Emergency Contact Phone</label>
                  <input type="text" value={editingEmployeeModal.emergencyContactPhone || ''} onChange={e => setEditingEmployeeModal({ ...editingEmployeeModal, emergencyContactPhone: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setEditingEmployeeModal(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CHECK-IN MODAL (WITH ID AUTO-FILL, MANUAL/NON-MANUAL, & ISSUANCE)   */}
      {/* =================================================================== */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600" /> Assign Employee to Bed & Issue Materials
              </h3>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between">
              <span>Target Bed: <strong>Room {checkInForm.roomNo}</strong> (Flat {checkInForm.flatCode})</span>
              <span className="font-bold text-cyan-800">{checkInForm.roomGrade} Room</span>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3">
              {/* Auto-Fill Lookup by Employee ID */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <label className="block font-bold text-blue-900">
                  Enter Employee ID (Auto-fills details if pre-registered in Occupants):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      list="registered-employees-list"
                      required
                      placeholder="Type ID (e.g. 6410)..."
                      value={checkInForm.employeeId}
                      onChange={e => handleCheckInEmployeeIdChange(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900"
                    />
                    <datalist id="registered-employees-list">
                      {occupants.map(o => (
                        <option key={o.employeeId} value={o.employeeId}>
                          {o.employeeName} ({o.employeeStatus})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Employee Full Name"
                      value={checkInForm.employeeName}
                      onChange={e => setCheckInForm({ ...checkInForm, employeeName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Explicit Productive Type + Manual / Non-Manual Grade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee Productive Type</label>
                  <select
                    value={checkInForm.productiveType}
                    onChange={e => setCheckInForm({ ...checkInForm, productiveType: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-bold text-slate-800 bg-white"
                  >
                    <option value="Direct Employee (DE)">Direct Employee (DE)</option>
                    <option value="Manpower Supply (MPS)">Manpower Supply (MPS)</option>
                    <option value="Shutdown">Shutdown</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Manual / Non-Manual Grade</label>
                  <select
                    value={checkInForm.roomGrade}
                    onChange={e => setCheckInForm({ ...checkInForm, roomGrade: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-bold text-cyan-700 bg-white"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Non-Manual">Non-Manual</option>
                  </select>
                </div>
              </div>

              {/* Arrival / Camp Shift Type + Manual Document Reference Number (Point 6) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Arrival / Transfer Type</label>
                  <select
                    value={checkInForm.arrivalType}
                    onChange={e => setCheckInForm({ ...checkInForm, arrivalType: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-semibold bg-white"
                  >
                    <option value="Local Residency Transfer">Shifted from Another Camp / Local</option>
                    <option value="Overseas">New Overseas Arrival</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Document Ref # (Shift / AFR Ref)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 150-04 or TRF-2026-09"
                    value={checkInForm.docRef}
                    onChange={e => setCheckInForm({ ...checkInForm, docRef: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-mono font-bold text-cyan-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nationality</label>
                  <input type="text" required value={checkInForm.nationality} onChange={e => setCheckInForm({ ...checkInForm, nationality: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mobile Number</label>
                  <input type="tel" required value={checkInForm.mobileNo} onChange={e => setCheckInForm({ ...checkInForm, mobileNo: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Passport Number</label>
                  <input type="text" required value={checkInForm.passportNo} onChange={e => setCheckInForm({ ...checkInForm, passportNo: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kuwait Civil ID</label>
                  <input type="text" required value={checkInForm.civilId} onChange={e => setCheckInForm({ ...checkInForm, civilId: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Job Title</label>
                  <input type="text" required value={checkInForm.title} onChange={e => setCheckInForm({ ...checkInForm, title: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cost Center</label>
                  <select
                    value={checkInForm.costCenter}
                    onChange={e => {
                      const c = costCenters.find(cc => cc.code === e.target.value);
                      setCheckInForm({ ...checkInForm, costCenter: e.target.value, division: c ? c.division : checkInForm.division });
                    }}
                    className="w-full border rounded-xl px-2 py-2 font-mono font-bold"
                  >
                    {costCenters.filter(c => c.status === 'Active').map(cc => (
                      <option key={cc.id} value={cc.code}>{cc.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Division</label>
                  <select value={checkInForm.division} onChange={e => setCheckInForm({ ...checkInForm, division: e.target.value })} className="w-full border font-bold rounded-xl px-2 py-2">
                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Built-In Material Issuance Checklist (Doc. Ref: 150-04 - Point 7) */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Material Issuance Checklist (Doc. Ref: 150-04)</span>
                  <span className="text-[10px] text-emerald-700">Generates form upon check-in</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {['mattress', 'pillow', 'bedsheet', 'blanket'].map(item => (
                    <label key={item} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 cursor-pointer font-semibold capitalize">
                      <input
                        type="checkbox"
                        checked={checkInForm.materials[item]}
                        onChange={e => setCheckInForm({
                          ...checkInForm,
                          materials: { ...checkInForm.materials, [item]: e.target.checked }
                        })}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCheckInModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">
                  Confirm Bed & Preview Material Issuance Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* UNIVERSAL DOCUMENT PREVIEW MODAL (PREVIEW BEFORE PRINT / DOWNLOAD)  */}
      {/* =================================================================== */}
      {reportPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Document Preview & Export
                  </h3>
                  <p className="text-slate-500">
                    Review the official formatted sheet below, then choose Print / Save PDF or Download Excel (.xlsx).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printFormattedElement('modal-preview-print-area', 'Al-Dhow Official Document')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (reportPreviewModal.type === 'summary') {
                      exportCampOccupancySummary(camps, occupants, leaveLogs, rtdLogs);
                    } else if (reportPreviewModal.type === 'daily') {
                      exportDailyOccupancyReport(reportPreviewModal.camp || activeCamp, occupants);
                    } else if (reportPreviewModal.type === 'issuance') {
                      exportMaterialIssuanceForm(reportPreviewModal.occupant, reportPreviewModal.arrivalType, {
                        docRef: reportPreviewModal.docRef,
                        materials: reportPreviewModal.materials
                      });
                    } else if (reportPreviewModal.type === 'relocation') {
                      exportOccupantsRelocationForm(reportPreviewModal.record);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Excel (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={() => setReportPreviewModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Printable Preview Container */}
            <div id="modal-preview-print-area" className="border border-slate-300 p-6 bg-white text-black font-sans overflow-x-auto">
              {/* PREVIEW 1: MATERIAL ISSUANCE FORM (DOC REF 150-04) */}
              {reportPreviewModal.type === 'issuance' && reportPreviewModal.occupant && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <img src={dhowLogoImg} alt="Dhow" className="h-10 w-auto" />
                    <h2 className="text-base font-bold uppercase text-center">
                      EMPLOYEE NEW ARRIVAL - MATERIAL ISSUANCE FORM
                    </h2>
                    <div className="text-right font-mono text-xs">
                      <div><strong>Doc. Ref.:</strong> {reportPreviewModal.docRef || '150-04'}</div>
                      <div><strong>Date:</strong> {todayStr}</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-bold py-1">
                    <span>Arrival Type: {reportPreviewModal.arrivalType}</span>
                    <span>Arrival Date: {reportPreviewModal.occupant.entryDate || todayStr}</span>
                  </div>

                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5">Project / Dept. No.</th>
                        <th className="border border-black p-1.5">Emp. Code</th>
                        <th className="border border-black p-1.5">Name</th>
                        <th className="border border-black p-1.5">Nationality</th>
                        <th className="border border-black p-1.5">Passport / Civil ID</th>
                        <th className="border border-black p-1.5">Designation & Grade</th>
                        <th className="border border-black p-1.5">Assigned Camp</th>
                        <th className="border border-black p-1.5">Assigned Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center font-semibold">
                        <td className="border border-black p-1.5">{reportPreviewModal.occupant.costCenter}</td>
                        <td className="border border-black p-1.5 font-mono">#{reportPreviewModal.occupant.employeeId}</td>
                        <td className="border border-black p-1.5">{reportPreviewModal.occupant.employeeName}</td>
                        <td className="border border-black p-1.5">{reportPreviewModal.occupant.nationality}</td>
                        <td className="border border-black p-1.5">{reportPreviewModal.occupant.passportNo} / {reportPreviewModal.occupant.civilId}</td>
                        <td className="border border-black p-1.5">{reportPreviewModal.occupant.title} ({reportPreviewModal.occupant.roomGrade})</td>
                        <td className="border border-black p-1.5">{reportPreviewModal.occupant.campNo}</td>
                        <td className="border border-black p-1.5 font-mono">{reportPreviewModal.occupant.roomNo}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5 w-14">Sl. No.</th>
                        <th className="border border-black p-1.5">List of Materials</th>
                        <th className="border border-black p-1.5 w-28">Issued (YES)</th>
                        <th className="border border-black p-1.5 w-28">Issued (NO)</th>
                        <th className="border border-black p-1.5">Accommodation Request Ref. & Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Mattress', key: 'mattress' },
                        { label: 'Pillow', key: 'pillow' },
                        { label: 'Bedsheet', key: 'bedsheet' },
                        { label: 'Blanket', key: 'blanket' }
                      ].map((m, idx) => {
                        const isIssued = reportPreviewModal.materials?.[m.key] !== false;
                        return (
                          <tr key={m.key}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5 font-semibold">{m.label}</td>
                            <td className="border border-black p-1.5 text-center font-bold">{isIssued ? 'YES (1)' : '-'}</td>
                            <td className="border border-black p-1.5 text-center">{isIssued ? '-' : 'NO'}</td>
                            <td className="border border-black p-1.5 text-center">{idx === 0 ? `${reportPreviewModal.docRef || '150-04'} (${todayStr})` : ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="text-[11px] italic font-semibold">
                    Note: Employee has to return the received items in case of vacating the accommodation.
                  </div>

                  <table className="w-full border-collapse text-xs mt-3">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5">Sign-Off</th>
                        <th className="border border-black p-1.5">Requested by (Employee)</th>
                        <th className="border border-black p-1.5">Issued by (Camp Boss)</th>
                        <th className="border border-black p-1.5">Approved by (Dept Head)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1.5 font-bold">Name:</td>
                        <td className="border border-black p-1.5">{reportPreviewModal.occupant.employeeName}</td>
                        <td className="border border-black p-1.5">Camp Supervisor</td>
                        <td className="border border-black p-1.5">Mohamed Bayoumi</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-bold">Signature & Date:</td>
                        <td className="border border-black p-1.5">{todayStr}</td>
                        <td className="border border-black p-1.5">{todayStr}</td>
                        <td className="border border-black p-1.5">{todayStr}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* PREVIEW 2: CAMP OCCUPANCY SUMMARY STATUS (T1) */}
              {reportPreviewModal.type === 'summary' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <img src={dhowLogoImg} alt="Dhow" className="h-10 w-auto" />
                    <h2 className="text-base font-bold uppercase">CAMP OCCUPANCY SUMMARY STATUS</h2>
                    <span className="font-mono text-xs font-bold border border-black px-3 py-1">Date: {todayStr}</span>
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5">Sr. No.</th>
                        <th className="border border-black p-1.5">Accommodation No.</th>
                        <th className="border border-black p-1.5">Total Capacity</th>
                        <th className="border border-black p-1.5">Occupied</th>
                        <th className="border border-black p-1.5">Vacation</th>
                        <th className="border border-black p-1.5">RTD</th>
                        <th className="border border-black p-1.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {camps.map((camp, idx) => {
                        let cap = 0;
                        camp.floors.forEach(fl => fl.flats.forEach(ft => ft.rooms.forEach(rm => { cap += rm.capacity; })));
                        const inCamp = occupants.filter(o => o.campNo === camp.campNo);
                        const onJob = inCamp.filter(o => o.employeeStatus === 'On Job').length;
                        const onLeave = inCamp.filter(o => o.employeeStatus === 'On Leave').length;
                        const rtdCount = rtdLogs.filter(r => r.vacatedCampNo === camp.campNo).length;
                        return (
                          <tr key={camp.id} className="text-center">
                            <td className="border border-black p-1.5">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-left font-bold">{camp.campNo} ({camp.campArea})</td>
                            <td className="border border-black p-1.5">{cap}</td>
                            <td className="border border-black p-1.5 font-bold">{onJob + onLeave}</td>
                            <td className="border border-black p-1.5">{onLeave}</td>
                            <td className="border border-black p-1.5">{rtdCount}</td>
                            <td className="border border-black p-1.5 text-left">{cap - (onJob + onLeave)} Beds Vacant</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PREVIEW 3: DAILY OCCUPANCY REPORT (T2) */}
              {reportPreviewModal.type === 'daily' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <img src={dhowLogoImg} alt="Dhow" className="h-10 w-auto" />
                    <h2 className="text-base font-bold uppercase">
                      DAILY OCCUPANCY REPORT — {(reportPreviewModal.camp || activeCamp)?.campNo}
                    </h2>
                    <span className="font-mono text-xs font-bold">Date: {todayStr}</span>
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5">Sr. No.</th>
                        <th className="border border-black p-1.5">Code*</th>
                        <th className="border border-black p-1.5">Name</th>
                        <th className="border border-black p-1.5">Designation</th>
                        <th className="border border-black p-1.5">Project/Dept</th>
                        <th className="border border-black p-1.5">Room No.</th>
                        <th className="border border-black p-1.5">Status</th>
                        <th className="border border-black p-1.5">Arrival</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupants.filter(o => o.campNo === (reportPreviewModal.camp || activeCamp)?.campNo).map((occ, idx) => (
                        <tr key={occ.employeeId} className="text-center">
                          <td className="border border-black p-1.5">{idx + 1}</td>
                          <td className="border border-black p-1.5 font-mono">#{occ.employeeId}</td>
                          <td className="border border-black p-1.5 text-left font-semibold">{occ.employeeName}</td>
                          <td className="border border-black p-1.5 text-left">{occ.title}</td>
                          <td className="border border-black p-1.5">{occ.costCenter}</td>
                          <td className="border border-black p-1.5 font-mono">{occ.roomNo}</td>
                          <td className="border border-black p-1.5">{occ.employeeStatus}</td>
                          <td className="border border-black p-1.5">{occ.entryDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PREVIEW 4: OCCUPANTS RELOCATION FORM (T4) */}
              {reportPreviewModal.type === 'relocation' && reportPreviewModal.record && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <img src={dhowLogoImg} alt="Dhow" className="h-10 w-auto" />
                    <h2 className="text-base font-bold uppercase">OCCUPANTS RELOCATION FORM</h2>
                    <div className="text-right font-mono text-xs">
                      <div><strong>Doc. Ref.:</strong> {reportPreviewModal.record.docRef}</div>
                      <div><strong>Date:</strong> {reportPreviewModal.record.relocationDate}</div>
                    </div>
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5">Employee ID</th>
                        <th className="border border-black p-1.5">Employee Name</th>
                        <th className="border border-black p-1.5">Designation</th>
                        <th className="border border-black p-1.5">From</th>
                        <th className="border border-black p-1.5">To</th>
                        <th className="border border-black p-1.5">Relocation Date</th>
                        <th className="border border-black p-1.5">Remarks & Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-black p-1.5 font-mono font-bold">#{reportPreviewModal.record.employeeId}</td>
                        <td className="border border-black p-1.5 font-bold">{reportPreviewModal.record.employeeName}</td>
                        <td className="border border-black p-1.5">{reportPreviewModal.record.title}</td>
                        <td className="border border-black p-1.5 font-mono">{reportPreviewModal.record.fromRoom}</td>
                        <td className="border border-black p-1.5 font-mono font-bold">{reportPreviewModal.record.toRoom}</td>
                        <td className="border border-black p-1.5">{reportPreviewModal.record.relocationDate}</td>
                        <td className="border border-black p-1.5">[Ref: {reportPreviewModal.record.docRef}] {reportPreviewModal.record.reason}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: BED RELOCATION (WITH MANUAL DOC REF # INPUT - POINT 6)       */}
      {/* =================================================================== */}
      {relocatingOccupant && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-cyan-600" /> Relocate Occupant #{relocatingOccupant.employeeId}
              </h3>
              <button onClick={() => setRelocatingOccupant(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleExecuteRelocation} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Target Camp</label>
                  <select
                    value={relocationForm.targetCampId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const c = camps.find(cmp => cmp.id === cId);
                      const fl = c?.floors[0];
                      const ft = fl?.flats[0];
                      const rm = ft?.rooms.find(r => r.occupants.length < r.capacity) || ft?.rooms[0];
                      setRelocationForm({
                        ...relocationForm,
                        targetCampId: cId,
                        targetFloorNo: fl?.floorNo || 1,
                        targetFlatCode: ft?.flatCode || '',
                        targetRoomNo: rm?.roomNo || ''
                      });
                    }}
                    className="w-full border rounded-xl px-3 py-2 font-bold"
                  >
                    {activeCamps.map(c => <option key={c.id} value={c.id}>{c.campNo} ({c.campArea})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Floor</label>
                  <select
                    value={relocationForm.targetFloorNo}
                    onChange={(e) => {
                      const flNo = Number(e.target.value);
                      const c = camps.find(cmp => cmp.id === relocationForm.targetCampId);
                      const fl = c?.floors.find(f => f.floorNo === flNo);
                      const ft = fl?.flats[0];
                      const rm = ft?.rooms.find(r => r.occupants.length < r.capacity) || ft?.rooms[0];
                      setRelocationForm({
                        ...relocationForm,
                        targetFloorNo: flNo,
                        targetFlatCode: ft?.flatCode || '',
                        targetRoomNo: rm?.roomNo || ''
                      });
                    }}
                    className="w-full border rounded-xl px-3 py-2 font-bold"
                  >
                    {camps.find(c => c.id === relocationForm.targetCampId)?.floors.map(f => (
                      <option key={f.floorNo} value={f.floorNo}>Floor {f.floorNo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Target Flat</label>
                  <select
                    value={relocationForm.targetFlatCode}
                    onChange={(e) => {
                      const ftCode = e.target.value;
                      const c = camps.find(cmp => cmp.id === relocationForm.targetCampId);
                      const fl = c?.floors.find(f => f.floorNo === Number(relocationForm.targetFloorNo));
                      const ft = fl?.flats.find(f => f.flatCode === ftCode);
                      const rm = ft?.rooms.find(r => r.occupants.length < r.capacity) || ft?.rooms[0];
                      setRelocationForm({ ...relocationForm, targetFlatCode: ftCode, targetRoomNo: rm?.roomNo || '' });
                    }}
                    className="w-full border rounded-xl px-3 py-2 font-mono font-bold"
                  >
                    {camps
                      .find(c => c.id === relocationForm.targetCampId)
                      ?.floors.find(f => f.floorNo === Number(relocationForm.targetFloorNo))
                      ?.flats.map(ft => <option key={ft.flatCode} value={ft.flatCode}>Flat {ft.flatCode} ({ft.roomGrade})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Room</label>
                  <select
                    value={relocationForm.targetRoomNo}
                    onChange={(e) => setRelocationForm({ ...relocationForm, targetRoomNo: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-mono font-bold text-cyan-700"
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
                  <label className="block font-semibold mb-1">Document Reference # (Doc. Ref) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REL-2026-104"
                    value={relocationForm.docRef}
                    onChange={e => setRelocationForm({ ...relocationForm, docRef: e.target.value })}
                    className="w-full border border-cyan-400 bg-cyan-50/30 rounded-xl px-3 py-2 font-mono font-bold text-cyan-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Transfer Date</label>
                  <input type="date" required value={relocationForm.transferDate} onChange={e => setRelocationForm({ ...relocationForm, transferDate: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Transfer / Shift Reason</label>
                <input type="text" required value={relocationForm.reason} onChange={e => setRelocationForm({ ...relocationForm, reason: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setRelocatingOccupant(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer">
                  Confirm Shift & Preview Relocation Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* EMPLOYEE DOSSIER MODAL                                              */}
      {/* =================================================================== */}
      {viewingEmployeeDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-mono font-bold text-base shadow-sm">
                  #{viewingEmployeeDossier.employeeId}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{viewingEmployeeDossier.employeeName}</h3>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                      {viewingEmployeeDossier.productiveType || 'Direct Employee (DE)'}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium">
                    {viewingEmployeeDossier.title} • {viewingEmployeeDossier.division} ({viewingEmployeeDossier.costCenter})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingEmployeeModal({ ...viewingEmployeeDossier, originalId: viewingEmployeeDossier.employeeId })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Details
                </button>
                <button onClick={() => setViewingEmployeeDossier(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium">Civil ID</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.civilId || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium">Passport #</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.passportNo || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium">Mobile</div>
                <div className="font-mono font-bold text-cyan-700 mt-0.5">{viewingEmployeeDossier.mobileNo || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium">Nationality</div>
                <div className="font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.nationality}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium">Status</div>
                <div className="mt-0.5 font-bold text-emerald-700">{viewingEmployeeDossier.employeeStatus}</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-600" /> Current Room Allocation
                </span>
                <span className="font-bold px-2.5 py-1 rounded-lg bg-white text-cyan-700 border border-cyan-200">
                  {viewingEmployeeDossier.roomGrade} Grade
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500">Camp:</span>
                  <div className="font-bold text-slate-900">{viewingEmployeeDossier.campNo}</div>
                </div>
                <div>
                  <span className="text-slate-500">Room:</span>
                  <div className="font-bold text-cyan-700 font-mono">Room {viewingEmployeeDossier.roomNo}</div>
                </div>
                <div>
                  <span className="text-slate-500">Entry Date & Ref:</span>
                  <div className="font-bold text-slate-900 font-mono">{viewingEmployeeDossier.entryDate} ({viewingEmployeeDossier.afrEntryRef || '150-04'})</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-cyan-200/60">
                <button
                  type="button"
                  onClick={() => setReportPreviewModal({
                    type: 'issuance',
                    occupant: viewingEmployeeDossier,
                    arrivalType: viewingEmployeeDossier.arrivalType || 'Local Residency Transfer',
                    docRef: viewingEmployeeDossier.afrEntryRef || '150-04',
                    materials: viewingEmployeeDossier.materialsIssued || { mattress: true, pillow: true, bedsheet: true, blanket: true }
                  })}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Material Issuance (T3)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const occ = viewingEmployeeDossier;
                    setMisconductForm(prev => ({
                      ...prev,
                      employeeId: occ.employeeId,
                      employeeName: occ.employeeName,
                      title: occ.title,
                      division: occ.division,
                      costCenter: occ.costCenter,
                      campNo: occ.campNo,
                      roomNo: occ.roomNo,
                      contactNo: occ.mobileNo || '+965 '
                    }));
                    setShowMisconductModal(true);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> File Misconduct (T5)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const occ = viewingEmployeeDossier;
                    setMaintenanceForm(prev => ({
                      ...prev,
                      reportedByEmpId: occ.employeeId,
                      employeeName: occ.employeeName,
                      floorNo: occ.floorNo || 1,
                      flatCode: occ.flatCode,
                      roomNo: occ.roomNo
                    }));
                    setShowMaintenanceModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" /> Log Maintenance (T7)
                </button>

                <button
                  onClick={() => {
                    const occ = viewingEmployeeDossier;
                    setViewingEmployeeDossier(null);
                    handleOpenRelocateModal(occ);
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Relocate Bed
                </button>
              </div>
            </div>

            {/* Relocation History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase">Accommodation & Shift History Ledger</h4>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                {viewingEmployeeDossier.stayHistory && viewingEmployeeDossier.stayHistory.length > 0 ? (
                  viewingEmployeeDossier.stayHistory.map((hist, idx) => (
                    <div key={idx} className="border-l-2 border-cyan-600 pl-3">
                      <div className="font-bold text-slate-800">{hist.campNo} — Room {hist.roomNo} ({hist.startDate} to {hist.endDate})</div>
                      <div className="text-[11px] text-slate-600">{hist.reason}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic">No previous camp shifts recorded.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* REMAINING MODALS (EDIT CAMP, ADD BUILDING, COST CENTERS, ETC.)      */}
      {/* =================================================================== */}
      {editingCampModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Camp ({editingCampModal.campNo})</h3>
              <button onClick={() => setEditingCampModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveCampEdits} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Camp Code</label>
                  <input type="text" required value={editingCampModal.campNo} onChange={e => setEditingCampModal({ ...editingCampModal, campNo: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Camp Area</label>
                  <input type="text" required value={editingCampModal.campArea} onChange={e => setEditingCampModal({ ...editingCampModal, campArea: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-100 border rounded-xl flex items-center justify-between">
                <div className="font-bold">Total Floors: {editingCampModal.floors.length}</div>
                <div className="flex gap-2">
                  {editingCampModal.floors.length > 1 && (
                    <button type="button" onClick={handleRemoveTopFloorDraft} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold cursor-pointer">
                      - Remove Top Floor
                    </button>
                  )}
                  <button type="button" onClick={handleOpenAddFloorConfig} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold cursor-pointer">
                    + Add New Floor
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {editingCampModal.floors.map(fl => (
                  <div key={fl.floorNo} className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                    <span className="font-bold">Floor {fl.floorNo} ({fl.flats.length} Flats)</span>
                    <div className="flex gap-1.5">
                      {fl.flats.length > 1 && (
                        <button type="button" onClick={() => handleRemoveFlatFromFloor(fl.floorNo)} className="px-2 py-1 bg-rose-50 text-rose-700 border rounded font-semibold">- Flat</button>
                      )}
                      <button type="button" onClick={() => handleAddFlatWithGrade(fl.floorNo, 'Non-Manual')} className="px-2 py-1 bg-cyan-50 text-cyan-800 border rounded font-bold">+ NM Flat</button>
                      <button type="button" onClick={() => handleAddFlatWithGrade(fl.floorNo, 'Manual')} className="px-2 py-1 bg-amber-50 text-amber-800 border rounded font-bold">+ M Flat</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setEditingCampModal(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold">Save Camp</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddFloorConfigModal && editingCampModal && (
        <div className="fixed inset-0 bg-slate-900/70 z-60 flex items-center justify-center p-4">
          <form onSubmit={handleCommitNewFloorToCamp} className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-base font-bold">Configure Floor {editingCampModal.floors.length + 1}</h3>
            <div>
              <label className="block font-semibold mb-1">Total Flats</label>
              <input type="number" min="1" max="10" required value={newFloorDraft.flatsCount} onChange={e => setNewFloorDraft({ ...newFloorDraft, flatsCount: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Non-Manual Flats (2 beds/rm)</label>
              <input type="number" min="0" max={newFloorDraft.flatsCount} required value={newFloorDraft.nonManualFlats} onChange={e => setNewFloorDraft({ ...newFloorDraft, nonManualFlats: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold text-cyan-700" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddFloorConfigModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold">Add Floor</button>
            </div>
          </form>
        </div>
      )}

      {showManageCostCentersModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold">Project Cost Centers & Divisions</h3>
              <button onClick={() => setShowManageCostCentersModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="font-bold text-blue-900">Operating Divisions ({divisions.length})</div>
              <div className="flex flex-wrap gap-2">
                {divisions.map(div => (
                  <span key={div} className="px-3 py-1 bg-white border rounded-lg font-bold flex items-center gap-1.5">
                    {div}
                    <button type="button" onClick={() => handleRemoveDivision(div)} className="text-rose-600 font-bold">×</button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddDivision} className="flex gap-2 pt-1">
                <input type="text" placeholder="New Division..." value={newDivisionInput} onChange={e => setNewDivisionInput(e.target.value)} className="bg-white border rounded-lg px-3 py-1.5 flex-1" />
                <button type="submit" className="px-3.5 py-1.5 bg-blue-700 text-white font-bold rounded-lg">+ Add Division</button>
              </form>
            </div>

            <form onSubmit={handleCreateCostCenter} className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border rounded-xl">
              <input type="text" required placeholder="Code (1IDS040)" value={newCostCenterForm.code} onChange={e => setNewCostCenterForm({ ...newCostCenterForm, code: e.target.value })} className="border bg-white rounded-lg px-2.5 py-1.5 font-mono uppercase font-bold" />
              <input type="text" required placeholder="Project Name" value={newCostCenterForm.name} onChange={e => setNewCostCenterForm({ ...newCostCenterForm, name: e.target.value })} className="border bg-white rounded-lg px-2.5 py-1.5" />
              <div className="flex gap-2">
                <select value={newCostCenterForm.division} onChange={e => setNewCostCenterForm({ ...newCostCenterForm, division: e.target.value })} className="border bg-white rounded-lg px-2 py-1.5 flex-1 font-bold">
                  {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="submit" className="px-4 py-1.5 bg-cyan-600 text-white font-bold rounded-lg">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExcelImportModal && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold">Import Preview: {excelImportFileName} ({excelImportStats.valid} Valid)</h3>
              <button onClick={() => setShowExcelImportModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowExcelImportModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleCommitExcelImport} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold">
                Confirm Import ({excelImportStats.valid})
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCampModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold">Add Building</h3>
              <button onClick={() => setShowAddCampModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const campDigit = newCampForm.campDigit || String(camps.length + 1);
              const roomsPerFl = parseInt(newCampForm.roomsPerFlat, 10) || 3;
              const generatedFloors = newCampForm.floorConfigs.map(fc => {
                const floorStr = String(fc.floorNo).padStart(2, '0');
                const floorFlats = [];
                for (let fl = 1; fl <= fc.flatsCount; fl++) {
                  const flatStr = String(fl).padStart(2, '0');
                  const isNM = fl <= fc.nonManualFlats;
                  const flatGrade = isNM ? 'Non-Manual' : 'Manual';
                  const gradeInitial = isNM ? 'NM' : 'M';
                  const roomCapacity = isNM ? 2 : 3;
                  const flatRooms = [];
                  const roomLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
                  for (let r = 0; r < roomsPerFl; r++) {
                    flatRooms.push({
                      roomNo: `${campDigit}-${floorStr}-${flatStr}-${roomLetters[r] || `R${r + 1}`}`,
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
                return { floorNo: fc.floorNo, flats: floorFlats };
              });

              const newCampObj = {
                id: `camp-${Date.now()}`,
                campNo: newCampForm.campNo,
                campArea: newCampForm.campArea,
                costCenter: '1ACD000',
                campDigit,
                campStartDate: newCampForm.campStartDate,
                status: 'Active',
                floors: generatedFloors
              };
              setCamps(prev => [...prev, newCampObj]);
              setSelectedCampId(newCampObj.id);
              setSelectedFloorNo(1);
              setShowAddCampModal(false);
            }} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Camp Code</label>
                  <input type="text" required value={newCampForm.campNo} onChange={e => setNewCampForm({ ...newCampForm, campNo: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Area</label>
                  <input type="text" required value={newCampForm.campArea} onChange={e => setNewCampForm({ ...newCampForm, campArea: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Total Floors</label>
                  <input type="number" min="1" max="20" value={newCampForm.floorsCount} onChange={e => handleFloorsCountChange(e.target.value)} className="w-full border rounded-xl px-3 py-2 font-bold" />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto border rounded-xl p-2 space-y-2">
                {newCampForm.floorConfigs.map(fc => (
                  <div key={fc.floorNo} className="grid grid-cols-3 gap-2 items-center bg-slate-50 p-2 rounded">
                    <span className="font-bold">Floor {fc.floorNo}</span>
                    <input type="number" min="1" max="15" value={fc.flatsCount} onChange={e => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setNewCampForm(prev => ({
                        ...prev,
                        floorConfigs: prev.floorConfigs.map(f => f.floorNo === fc.floorNo ? { ...f, flatsCount: val } : f)
                      }));
                    }} className="border bg-white rounded px-2 py-1" placeholder="Flats" />
                    <input type="number" min="0" max={fc.flatsCount} value={fc.nonManualFlats} onChange={e => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setNewCampForm(prev => ({
                        ...prev,
                        floorConfigs: prev.floorConfigs.map(f => f.floorNo === fc.floorNo ? { ...f, nonManualFlats: val } : f)
                      }));
                    }} className="border bg-white rounded px-2 py-1" placeholder="NM Flats" />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddCampModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold">Create Building</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div id="invoice-print-area" className="bg-white border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="font-mono font-bold">INV-{selectedInvoiceModal.costCenter}-{billingPeriod}</span>
              <button onClick={() => setSelectedInvoiceModal(null)} className="no-print"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex justify-end gap-2 no-print">
              <button onClick={() => printFormattedElement('invoice-print-area', `INV-${selectedInvoiceModal.costCenter}`)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {manageOccupantModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold">Manage #{manageOccupantModal.employeeId} ({manageOccupantModal.employeeName})</h3>
              <button onClick={() => setManageOccupantModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setEditingEmployeeModal({ ...manageOccupantModal, originalId: manageOccupantModal.employeeId }); setManageOccupantModal(null); }} className="p-2.5 bg-slate-800 text-white rounded-xl font-bold cursor-pointer">
                Edit Employee Details
              </button>
              <button onClick={() => { handleOpenRelocateModal(manageOccupantModal); setManageOccupantModal(null); }} className="p-2.5 bg-cyan-600 text-white rounded-xl font-bold cursor-pointer">
                Relocate / Shift Bed
              </button>
              {manageOccupantModal.employeeStatus !== 'On Leave' && (
                <button onClick={() => setShowLeaveModal(manageOccupantModal)} className="p-2.5 bg-amber-500 text-white rounded-xl font-bold cursor-pointer">
                  Mark On Leave
                </button>
              )}
              {manageOccupantModal.employeeStatus === 'On Leave' && (
                <button onClick={() => setShowReturnJobModal(manageOccupantModal)} className="p-2.5 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer">
                  Return from Leave
                </button>
              )}
              <button onClick={() => setShowTransferRequestModal(manageOccupantModal)} className="p-2.5 bg-blue-600 text-white rounded-xl font-bold cursor-pointer">
                Change Cost Center
              </button>
              <button onClick={() => setShowRtdModal(manageOccupantModal)} className="p-2.5 bg-rose-600 text-white rounded-xl font-bold cursor-pointer">
                Process RTD Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLeaveSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold">Mark On Leave (#{showLeaveModal.employeeId})</h3>
            <input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="w-full border rounded-lg p-2" />
            <input type="date" required value={leaveForm.expectedEndDate} onChange={e => setLeaveForm({ ...leaveForm, expectedEndDate: e.target.value })} className="w-full border rounded-lg p-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowLeaveModal(null)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold">Confirm Leave</button>
            </div>
          </form>
        </div>
      )}

      {showReturnJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReturnJobSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold">Return to Job (#{showReturnJobModal.employeeId})</h3>
            <input type="date" required value={returnJobForm.actualReturnDate} onChange={e => setReturnJobForm({ ...returnJobForm, actualReturnDate: e.target.value })} className="w-full border rounded-lg p-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowReturnJobModal(null)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Confirm Return</button>
            </div>
          </form>
        </div>
      )}

      {showRtdModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRtdSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold">Process RTD Exit (#{showRtdModal.employeeId})</h3>
            <select value={rtdForm.rtdType} onChange={e => setRtdForm({ ...rtdForm, rtdType: e.target.value })} className="w-full border rounded-lg p-2 font-bold">
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
              <option value="Dismissed">Dismissed</option>
            </select>
            <input type="date" required value={rtdForm.rtdDate} onChange={e => setRtdForm({ ...rtdForm, rtdDate: e.target.value })} className="w-full border rounded-lg p-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowRtdModal(null)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold">Confirm RTD</button>
            </div>
          </form>
        </div>
      )}

      {showTransferRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCostCenterTransferRequest} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold">Transfer Cost Center (#{showTransferRequestModal.employeeId})</h3>
            <select value={transferRequestForm.toCostCenter} onChange={e => setTransferRequestForm({ ...transferRequestForm, toCostCenter: e.target.value })} className="w-full border rounded-lg p-2 font-bold font-mono">
              {costCenters.map(cc => <option key={cc.id} value={cc.code}>{cc.code} — {cc.name}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowTransferRequestModal(null)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-bold">Submit</button>
            </div>
          </form>
        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-3.5 shadow-2xl text-xs">
            <h3 className="text-base font-bold">Add System User</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" required placeholder="Staff ID (EDT-025)" value={newUserForm.staffId} onChange={e => setNewUserForm({ ...newUserForm, staffId: e.target.value })} className="border rounded-xl px-3 py-2" />
              <input type="text" required placeholder="Full Name" value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} className="border rounded-xl px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="email" required placeholder="Email" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className="border rounded-xl px-3 py-2" />
              <select value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })} className="border rounded-xl px-3 py-2 font-bold">
                <option value="CAMP_EDITOR">Camp Editor</option>
                <option value="AUDITOR">Auditor</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <input type="password" required placeholder="Initial Password" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold">Create User</button>
            </div>
          </form>
        </div>
      )}

      {showResetPasswordModal && targetUserForReset && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecutePasswordReset} className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-base font-bold">Reset Password for {targetUserForReset.name}</h3>
            <input type="password" required placeholder="New Password" value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
            <input type="password" required placeholder="Confirm Password" value={confirmPasswordValue} onChange={e => setConfirmPasswordValue(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowResetPasswordModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold">Update Password</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}