import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Building2, Users, ShieldCheck, Eye, EyeOff, Lock, LogOut, Plus, Search,
  Download, CheckCircle2, AlertCircle, Trash2, UserPlus, KeyRound, Bed,
  Home, RefreshCw, X, FileSpreadsheet, BarChart3, Plane, Settings,
  Receipt, Printer, Edit3, ArrowRightLeft, History, MapPin, AlertTriangle,
  Archive, Tag, Phone, Clock, SlidersHorizontal, Layers, CheckSquare, Globe,
  Upload, FileUp, Filter, Wrench, ShieldAlert
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
  exportMaintenanceLog
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
  // STATE PERSISTENCE (14 TABLES / ENTITIES)
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

  // Misconduct Report Modal
  const [showMisconductModal, setShowMisconductModal] = useState(false);
  const [misconductForm, setMisconductForm] = useState({
    employeeId: '', employeeName: '', title: '', division: '', costCenter: '',
    campNo: 'CAMP-01', roomNo: '', contactNo: '+965 ', incidentDate: todayStr,
    incidentTime: '14:00', incidentLocation: 'Accommodation Quarters',
    typeOfViolation: 'Camp Quiet Hours & Residential Safety Violation',
    description: '', witnessName: '', witnessId: '', witnessRoom: '', witnessPhone: '+965 ',
    reportedBy: 'Camp Supervisor', remarks: 'Referred to HR Disciplinary Committee'
  });

  // Maintenance Log Modal
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

  // Forms
  const [checkInForm, setCheckInForm] = useState({
    campId: 'camp-1', floorNo: 1, flatCode: '1-01-01-NM', roomNo: '1-01-01-B',
    roomGrade: 'Non-Manual', productiveType: 'Direct Employee (DE)',
    arrivalType: 'Local Residency Transfer',
    employeeId: '', employeeName: '', nationality: 'India',
    title: 'Site Engineer', division: 'IDS', costCenter: '1IDS038-KIPIC',
    passportNo: '', civilId: '', mobileNo: '+965 ', emergencyContactName: '',
    emergencyContactPhone: '+965 ', homeCountryAddress: '', entryDate: todayStr
  });

  const [relocationForm, setRelocationForm] = useState({
    targetCampId: '', targetFloorNo: '', targetFlatCode: '', targetRoomNo: '',
    transferDate: todayStr, reason: 'Project Site Reallocation'
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

  // Add Camp Wizard: Dynamic Configurable Floors & Rooms
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
    const freeBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      campsCount: activeCamps.length,
      totalFlats, totalRooms, totalBeds, occupiedBeds,
      freeBeds, occupancyPct, activeStaffCount: activeStaff.length,
      onJobCount, onLeaveCount
    };
  }, [activeCamps, occupants]);

  const universalSearchResults = useMemo(() => {
    const q = universalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return occupants.filter(occ =>
      occ.employeeId.toLowerCase().includes(q) ||
      occ.employeeName.toLowerCase().includes(q) ||
      occ.civilId.toString().includes(q) ||
      occ.passportNo.toLowerCase().includes(q) ||
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
        occ.civilId.toString().includes(q) ||
        occ.passportNo.toLowerCase().includes(q) ||
        (occ.mobileNo && occ.mobileNo.toLowerCase().includes(q)) ||
        occ.flatCode.toLowerCase().includes(q) ||
        occ.roomNo.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || occ.employeeStatus === statusFilter;
      const matchesDivision = divisionFilter === 'ALL' || occ.division === divisionFilter;
      const matchesProductiveType = productiveTypeFilter === 'ALL' || (occ.productiveType || 'Direct Employee (DE)') === productiveTypeFilter;

      return matchesSearch && matchesStatus && matchesDivision && matchesProductiveType;
    });
  }, [occupants, searchTerm, statusFilter, divisionFilter, productiveTypeFilter]);

  const projectInvoicingData = useMemo(() => {
    const activeOccupants = occupants.filter(o => !o.employeeStatus.startsWith('RTD'));
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

  // Inline Grade Switcher in Map
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
  // EXCEL ROSTER IMPORT ENGINE (`Book1.xlsx`)
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
          const campNo = getVal(['Camp No', 'Camp', 'Building', 'Camp Code']) || (activeCamp?.campNo || 'CAMP-01');
          const flatCode = getVal(['Flat Code', 'Flat', 'Flat No']) || '';
          const roomNo = getVal(['Room No', 'Room', 'Room Number']) || '';
          const roomGrade = getVal(['Room Grade', 'Grade', 'Category']) || 'Manual';
          const division = getVal(['Division', 'Dept', 'Department']) || 'IDS';
          const costCenter = getVal(['Project Cost Center', 'Cost Center', 'CostCenter', 'CC']) || '1IDS038-KIPIC';
          const entryDate = getVal(['Entry Date', 'Check In Date', 'Start Date']) || todayStr;
          const emContact = getVal(['Emergency Contact', 'Emergency Name', 'Kin']) || 'Family Contact';
          const emPhone = getVal(['Emergency Phone', 'Emergency Mobile', 'Kin Phone']) || '+965 ';

          const errors = [];
          if (!empId) errors.push('Missing Employee ID');
          if (!empName) errors.push('Missing Name');
          if (!roomNo) errors.push('Missing Room Number');

          const isDuplicate = occupants.some(o => o.employeeId === empId && !o.employeeStatus.startsWith('RTD'));
          if (isDuplicate) errors.push('Employee ID already active in camp');

          const targetCamp = camps.find(c => c.campNo === campNo);
          let targetRoom = null;
          if (targetCamp) {
            targetCamp.floors.forEach(fl => {
              fl.flats.forEach(ft => {
                ft.rooms.forEach(rm => {
                  if (rm.roomNo === roomNo) targetRoom = rm;
                });
              });
            });
          }

          if (roomNo && !targetRoom) {
            errors.push(`Room ${roomNo} not found in ${campNo}`);
          } else if (targetRoom && targetRoom.occupants.length >= targetRoom.capacity) {
            errors.push(`Room ${roomNo} is full (${targetRoom.occupants.length}/${targetRoom.capacity})`);
          }

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
      const newOcc = {
        srNo: newOccupantsList.length + 1,
        campNo: row.campNo,
        campArea: camps.find(c => c.campNo === row.campNo)?.campArea || 'Camp Facility',
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
        flatCode: row.flatCode,
        roomNo: row.roomNo,
        employeeStatus: 'On Job',
        leaveStartDate: '', leaveEndDate: '', leaveReturnDate: '',
        rtdType: '', rtdDate: '',
        afrEntryRef: 'EXCEL-IMPORT-BOOK1',
        afrLogNo: `LOG-${row.employeeId}`,
        residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
        reallocationCostCenter: row.costCenter.split('-')[0],
        exitDate: '', afrExitRef: '', remarks: `Imported via ${excelImportFileName}`,
        stayHistory: []
      };

      newOccupantsList.push(newOcc);

      updatedCamps = updatedCamps.map(c => {
        if (c.campNo !== row.campNo) return c;
        return {
          ...c,
          floors: c.floors.map(fl => ({
            ...fl,
            flats: fl.flats.map(ft => ({
              ...ft,
              rooms: ft.rooms.map(rm => {
                if (rm.roomNo === row.roomNo && !rm.occupants.includes(row.employeeId)) {
                  return { ...rm, occupants: [...rm.occupants, row.employeeId] };
                }
                return rm;
              })
            }))
          }))
        };
      });
    });

    setOccupants(newOccupantsList);
    setCamps(updatedCamps);
    logActivity('EXCEL_IMPORT', `Bulk Imported ${validRows.length} Occupants`, `Successfully imported roster from ${excelImportFileName}`);
    setShowExcelImportModal(false);
    alert(`Success: ${validRows.length} occupants imported and assigned to camp rooms.`);
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

  const handleSaveEditCostCenter = (e) => {
    e.preventDefault();
    if (!editingCostCenterModal) return;

    const oldCC = costCenters.find(c => c.id === editingCostCenterModal.id);
    const oldCode = oldCC?.code;
    const newCode = editingCostCenterModal.code.trim().toUpperCase();
    const newDivision = editingCostCenterModal.division;

    if (oldCode && oldCode !== newCode) {
      setOccupants(prev => prev.map(occ => occ.costCenter === oldCode ? { ...occ, costCenter: newCode, division: newDivision } : occ));
    }

    setCostCenters(prev => prev.map(c => c.id === editingCostCenterModal.id ? {
      ...editingCostCenterModal, code: newCode, name: editingCostCenterModal.name.trim()
    } : c));

    logActivity('COST_CENTER', `Edited Cost Center ${newCode}`, `Updated project: ${editingCostCenterModal.name} (${newDivision})`);
    setEditingCostCenterModal(null);
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

  // Occupant Actions
  const handleCheckInSubmit = (e) => {
    e.preventDefault();
    const empId = checkInForm.employeeId.trim();
    if (occupants.some(o => o.employeeId === empId && !o.employeeStatus.startsWith('RTD'))) {
      alert(`Employee #${empId} is already assigned to a room.`);
      return;
    }
    const targetCamp = camps.find(c => c.id === checkInForm.campId) || activeCamp;
    const newOcc = {
      srNo: occupants.length + 1,
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
      entryDate: checkInForm.entryDate,
      passportNo: checkInForm.passportNo,
      civilId: checkInForm.civilId,
      mobileNo: checkInForm.mobileNo,
      emergencyContactName: checkInForm.emergencyContactName,
      emergencyContactPhone: checkInForm.emergencyContactPhone,
      homeCountryAddress: checkInForm.homeCountryAddress,
      roomGrade: checkInForm.roomGrade,
      floorNo: Number(checkInForm.floorNo),
      flatNo: Number(checkInForm.flatCode.split('-')[2] || 1),
      flatCode: checkInForm.flatCode,
      roomNo: checkInForm.roomNo,
      employeeStatus: 'On Job',
      leaveStartDate: '', leaveEndDate: '', leaveReturnDate: '',
      rtdType: '', rtdDate: '',
      afrEntryRef: 'AFR-MANUAL',
      afrLogNo: `LOG-${empId}`,
      residencyCompany: 'Dhow Engineering General Trading & Contracting Company',
      reallocationCostCenter: checkInForm.costCenter.split('-')[0],
      exitDate: '', afrExitRef: '', remarks: 'Checked in via Dhow Portal',
      stayHistory: []
    };

    setOccupants(prev => [...prev, newOcc]);
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
    logActivity('CHECK_IN', `Assigned #${empId} to Room ${checkInForm.roomNo}`, `${newOcc.employeeName} (${newOcc.nationality} • ${newOcc.productiveType}) assigned to ${targetCamp.campNo} Room ${checkInForm.roomNo}`, targetCamp.campNo);

    if (confirm(`Check-In complete for #${empId}! Would you like to export the Employee New Arrival - Material Issuance Voucher (Doc. Ref: 150-04) now?`)) {
      exportMaterialIssuanceForm(newOcc, checkInForm.arrivalType);
    }
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
      reason: relocationForm.reason || 'Inter-Camp Bed Transfer'
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
      stayHistory: updatedStayHistory
    };

    setOccupants(prevOccs =>
      prevOccs.map(o => o.employeeId === relocatingOccupant.employeeId ? updatedOccupant : o)
    );

    if (viewingEmployeeDossier && viewingEmployeeDossier.employeeId === relocatingOccupant.employeeId) {
      setViewingEmployeeDossier(updatedOccupant);
    }

    logActivity('RELOCATION', `Relocated #${relocatingOccupant.employeeId} to Room ${targetRoom.roomNo}`, `${relocatingOccupant.employeeName} moved to ${targetCamp.campNo} Room ${targetRoom.roomNo}`, targetCamp.campNo);

    exportOccupantsRelocationForm({
      employeeId: relocatingOccupant.employeeId,
      employeeName: relocatingOccupant.employeeName,
      title: relocatingOccupant.title,
      fromRoom: `${relocatingOccupant.campNo} - ${relocatingOccupant.roomNo}`,
      toRoom: `${targetCamp.campNo} - ${targetRoom.roomNo}`,
      relocationDate: relocationForm.transferDate,
      reason: relocationForm.reason
    });

    setRelocatingOccupant(null);
    alert(`Successfully relocated #${relocatingOccupant.employeeId} to ${targetCamp.campNo} Room ${targetRoom.roomNo}! Official Relocation Form (.xlsx) has been downloaded.`);
  };

  // Misconduct Report Action
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
    alert(`Misconduct Log recorded and Accommodation Misconduct Report (.xlsx) generated.`);
  };

  // Maintenance Log Action
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
        canApproveTransfers: newUserForm.role === 'SUPER_ADMIN' || newUserForm.role === 'AUDITOR'
      },
      lastLogin: 'Never'
    };

    setUsers(prev => [...prev, newUser]);
    setShowAddUserModal(false);
    logActivity('USER_MGMT', `Created User ${newUser.staffId}`, `Created ${newUser.name} with role ${newUser.role}`);
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
      {/* Hidden File Input for Excel Import */}
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

          {/* Universal Search Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ID / Name / Type / Mobile..."
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
                    Matching Occupants ({universalSearchResults.length})
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
                            {occ.campNo} • Room {occ.roomNo} ({occ.roomGrade}) • Tel: {occ.mobileNo || 'N/A'}
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Building</span>
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

        {/* 7 Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'map' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Interactive Camp Map</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
              {globalStats.freeBeds} Free Spots
            </span>
          </button>

          <button
            onClick={() => setActiveTab('occupants')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'occupants' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <span>Book1 Occupants</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              {globalStats.activeStaffCount} Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invoicing')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'invoicing' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Invoicing & "Others" Costs</span>
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
            <span>Reports & 7 Templates</span>
          </button>

          <button
            onClick={() => setActiveTab('activity_logs')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'activity_logs' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Activity Time Log</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              {activityLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'approvals' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Approvals & Registries</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
              {transferRequests.filter(r => r.status === 'PENDING').length} Pending
            </span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'admin' ? 'bg-slate-800/90 text-white border-cyan-400' : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin & User Access (RBAC)</span>
            </button>
          )}
        </div>
      </header>

      {/* Sub-Header Status Bar with Quick Template Generators */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Logged in as:</span>
            <span className="font-bold text-slate-900">{currentUser.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
              {currentUser.role}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Camp Scope: {currentUser.campScope}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCampOccupancySummary(camps, occupants, leaveLogs, rtdLogs)}
              className="text-slate-700 hover:text-cyan-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer text-xs"
              title="Download Template 1"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600" />
              <span>Summary Status (T1)</span>
            </button>
            <button
              onClick={() => exportDailyOccupancyReport(activeCamp, occupants)}
              className="text-slate-700 hover:text-emerald-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer text-xs"
              title="Download Template 2"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daily Report (T2)</span>
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

        {/* TAB 1: INTERACTIVE CAMP MAP */}
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

              <div className="flex items-center gap-4 pt-1">
                <div className="inline-flex items-center gap-4 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span> On Job</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> On Leave</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Free Bed</span>
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
                          {floor.flats.length} Flats ({nmCount} Non-Manual • {mCount} Manual)
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

                        {/* Flat Grade Dropdown Selector */}
                        <div className="flex items-center gap-2">
                          <select
                            value={flat.roomGrade}
                            onChange={(e) => handleFlatGradeChange(activeCamp.id, activeFloor.floorNo, flat.flatCode, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                              flat.roomGrade === 'Non-Manual'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900'
                                : 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900'
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
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold border border-cyan-200">
                                              {occ.productiveType || 'DE'}
                                            </span>
                                          </div>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                            isOnLeave ? 'bg-amber-200 text-amber-900' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                          }`}>
                                            {isOnLeave ? '✈ On Leave' : 'On Job'}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-1.5 text-[11px]">
                                          <span className="text-slate-500 truncate">
                                            {occ.title} • <strong className="text-slate-700 font-semibold">{occ.nationality}</strong> • {occ.division} ({occ.costCenter})
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
                                      onClick={() => {
                                        setCheckInForm(prev => ({
                                          ...prev,
                                          campId: activeCamp.id,
                                          floorNo: activeFloor.floorNo,
                                          flatCode: flat.flatCode,
                                          roomNo: room.roomNo,
                                          roomGrade: flat.roomGrade
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

        {/* TAB 2: Book1 31-Column Occupant List */}
        {activeTab === 'occupants' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by ID, Name, Nationality, Room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
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
                  <option value="On Job">On Job</option>
                  <option value="On Leave">On Leave</option>
                  <option value="RTD - Resigned">RTD - Resigned</option>
                  <option value="RTD - Terminated">RTD - Terminated</option>
                  <option value="RTD - Dismissed">RTD - Dismissed</option>
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
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Import Excel Roster</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Showing {filteredOccupants.length} of {occupants.length} Records</span>
                <span className="text-cyan-700 font-mono">Book1.xlsx Normalized Table</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Productive Type</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Nationality</th>
                      <th className="p-3">Mobile No</th>
                      <th className="p-3">Division</th>
                      <th className="p-3">Cost Center</th>
                      <th className="p-3">Camp & Room</th>
                      <th className="p-3">Emergency Contact</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Stay Tenure</th>
                      <th className="p-3">Actions</th>
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
                          <span className={occ.roomGrade === 'Non-Manual' ? 'text-cyan-700 font-bold' : 'text-amber-700 font-bold'}>
                            {occ.roomGrade}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {occ.nationality}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-cyan-700 font-semibold">{occ.mobileNo || 'N/A'}</td>
                        <td className="p-3">{occ.division}</td>
                        <td className="p-3 font-mono text-slate-600">{occ.costCenter}</td>
                        <td className="p-3 font-mono">{occ.campNo} ({occ.roomNo})</td>
                        <td className="p-3 text-slate-600">{occ.emergencyContactName} ({occ.emergencyContactPhone})</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            occ.employeeStatus === 'On Job' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            occ.employeeStatus === 'On Leave' ? 'bg-amber-100 text-amber-800' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {occ.employeeStatus}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">
                          {calculateTenure(occ.entryDate, occ.employeeStatus.startsWith('RTD') ? occ.exitDate : null)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setViewingEmployeeDossier(occ)} className="text-cyan-600 font-bold hover:underline">
                              History
                            </button>
                            <button onClick={() => setManageOccupantModal(occ)} className="text-slate-600 font-bold hover:text-slate-900">
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

        {/* TAB 3: Invoicing Tab with "Others" */}
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

        {/* TAB 4: Reports Tab */}
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
            onExportCampOccupancySummary={() => exportCampOccupancySummary(camps, occupants, leaveLogs, rtdLogs)}
            onExportDailyOccupancyReport={() => exportDailyOccupancyReport(activeCamp, occupants)}
            onExportMisconductLog={() => exportMisconductLog(misconductLogs)}
            onExportMaintenanceLog={() => exportMaintenanceLog(maintenanceLogs)}
          />
        )}

        {/* TAB 5: Activity Time Log Tab */}
        {activeTab === 'activity_logs' && (
          <ActivityLogTab
            activityLogs={activityLogs}
            onClearLogs={() => setActivityLogs([])}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {/* TAB 6: Approvals & DB Tables Tab */}
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

        {/* TAB 7: Admin & User Access Tab */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  System Users & Role-Based Access Control (RBAC)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super Admins can directly manage roles, camp scopes, editing permissions, or reset user passwords.
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                  <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b">
                    <tr>
                      <th className="py-3.5 px-4">Staff ID</th>
                      <th className="py-3.5 px-4">Name & Title</th>
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'CAMP_EDITOR' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">{u.campScope}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setTargetUserForReset(u); setShowResetPasswordModal(true); }}
                              className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              Reset Password
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
      </main>

      {/* ======================================================= */}
      {/* MODAL: EDIT CAMP WITH FLOOR RATIO CONTROLS              */}
      {/* ======================================================= */}
      {editingCampModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-600" />
                Edit Camp Details & Floor Flats ({editingCampModal.campNo})
              </h3>
              <button onClick={() => setEditingCampModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampEdits} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Camp Code</label>
                  <input
                    type="text"
                    required
                    value={editingCampModal.campNo}
                    onChange={(e) => setEditingCampModal({ ...editingCampModal, campNo: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Camp Area Location</label>
                  <input
                    type="text"
                    required
                    value={editingCampModal.campArea}
                    onChange={(e) => setEditingCampModal({ ...editingCampModal, campArea: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* Floor Management Toolbar */}
              <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">Total Floors in Building</div>
                  <div className="text-[11px] text-slate-500">Currently {editingCampModal.floors.length} Floors configured</div>
                </div>
                <div className="flex items-center gap-2">
                  {editingCampModal.floors.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRemoveTopFloorDraft}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      - Remove Top Floor
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenAddFloorConfig}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add New Floor
                  </button>
                </div>
              </div>

              {/* Per-Floor Flat Controls with Engineering Breakdown */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <div className="font-bold text-slate-900">Per-Floor Flat & Grade Ratios:</div>
                <div className="space-y-2">
                  {editingCampModal.floors.map(fl => {
                    const nmCount = fl.flats.filter(ft => ft.roomGrade === 'Non-Manual').length;
                    const mCount = fl.flats.filter(ft => ft.roomGrade === 'Manual').length;

                    return (
                      <div key={fl.floorNo} className="p-3 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">Floor {fl.floorNo}</div>
                          <div className="text-[11px] text-slate-500">
                            {fl.flats.length} Flats ({nmCount} Non-Manual • {mCount} Manual)
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {fl.flats.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFlatFromFloor(fl.floorNo)}
                              className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold"
                            >
                              - Remove Flat
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddFlatWithGrade(fl.floorNo, 'Non-Manual')}
                            className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded text-xs font-bold"
                          >
                            + Add NM Flat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddFlatWithGrade(fl.floorNo, 'Manual')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-bold"
                          >
                            + Add M Flat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Decommission Action */}
              {currentUser.permissions?.canDeleteCamps && (
                <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-rose-900">Decommission Camp Facility</div>
                    <div className="text-[11px] text-rose-700">Safely archives this building once zero occupants remain.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const activeStaff = occupants.filter(o => o.campNo === editingCampModal.campNo && !o.employeeStatus.startsWith('RTD'));
                      if (activeStaff.length > 0) {
                        setDecommissionLockoutModal({ camp: editingCampModal, occupants: activeStaff });
                        return;
                      }
                      if (confirm(`Confirm decommissioning of ${editingCampModal.campNo}?`)) {
                        setCamps(prev => prev.map(c => c.id === editingCampModal.id ? { ...c, status: 'Decommissioned' } : c));
                        setEditingCampModal(null);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Decommission
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCampModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Camp Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Floor Configuration Modal */}
      {showAddFloorConfigModal && editingCampModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <form onSubmit={handleCommitNewFloorToCamp} className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Configure New Floor {editingCampModal.floors.length + 1}
            </h3>
            <div>
              <label className="block font-semibold mb-1">Total Flats on this Floor</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={newFloorDraft.flatsCount}
                onChange={e => setNewFloorDraft({ ...newFloorDraft, flatsCount: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Number of Non-Manual / Engineering Flats (2 beds/rm)</label>
              <input
                type="number"
                min="0"
                max={newFloorDraft.flatsCount}
                required
                value={newFloorDraft.nonManualFlats}
                onChange={e => setNewFloorDraft({ ...newFloorDraft, nonManualFlats: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 font-bold text-cyan-700"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Remaining {Math.max(0, newFloorDraft.flatsCount - newFloorDraft.nonManualFlats)} flats will default to Manual (3 beds/rm).
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddFloorConfigModal(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
              >
                Add Floor to Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================= */}
      {/* COST CENTER & DYNAMIC DIVISION MANAGEMENT MODAL         */}
      {/* ======================================================= */}
      {showManageCostCentersModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Project Cost Centers & Operating Divisions</h3>
                  <p className="text-slate-500 font-medium">
                    Configure master billing codes and dynamic company divisions used across check-in, bed transfers, and recharges.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowManageCostCentersModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Division Management Section */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" /> Company Operating Divisions ({divisions.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {divisions.map(div => (
                  <span
                    key={div}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-300 rounded-lg text-blue-900 font-bold text-xs shadow-2xs"
                  >
                    {div}
                    <button
                      type="button"
                      onClick={() => handleRemoveDivision(div)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddDivision} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Enter new Division (e.g. FACILITIES, HVAC, INSTRUMENTATION)..."
                  value={newDivisionInput}
                  onChange={e => setNewDivisionInput(e.target.value)}
                  className="bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 uppercase font-semibold flex-1 max-w-sm"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg cursor-pointer text-xs"
                >
                  + Add Division
                </button>
              </form>
            </div>

            {/* Add Cost Center Form */}
            <form onSubmit={handleCreateCostCenter} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
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
                  <label className="block text-slate-600 font-medium mb-1">Project Name / Description</label>
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
                      {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Existing Cost Centers Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[720px] text-left whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b">
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
                    const activeCount = occupants.filter(o => o.costCenter === cc.code && !o.employeeStatus.startsWith('RTD')).length;
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
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleCostCenterStatus(cc.id)}
                              className={`px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer ${
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

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowManageCostCentersModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* EXCEL ROSTER IMPORT PREVIEW & COMMIT MODAL              */}
      {/* ======================================================= */}
      {showExcelImportModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-5xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Import Preview: {excelImportFileName}
                  </h3>
                  <p className="text-slate-500 font-medium">
                    Review and validate employee bed allocations before committing to the database.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowExcelImportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3 bg-slate-50 border rounded-xl">
                <span className="text-slate-500 font-medium">Total Rows Parsed:</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">{excelImportStats.total}</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-800 font-medium">Ready to Commit:</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5">{excelImportStats.valid}</div>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-rose-800 font-medium">Conflict / Errors:</span>
                <div className="text-xl font-black text-rose-700 mt-0.5">{excelImportStats.errors}</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto flex-1 max-h-96">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b sticky top-0">
                  <tr>
                    <th className="p-2.5">Row</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Productive Type</th>
                    <th className="p-2.5">Nationality</th>
                    <th className="p-2.5">Camp & Room</th>
                    <th className="p-2.5">Grade</th>
                    <th className="p-2.5">Division / Cost Center</th>
                    <th className="p-2.5">Validation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {excelParsedRows.map(row => (
                    <tr key={row.rowIdx} className={row.status === 'ERROR' ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 font-mono text-slate-500">#{row.rowIdx}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-cyan-600">#{row.employeeId || 'N/A'}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{row.employeeName || 'N/A'}</td>
                      <td className="p-2.5 font-bold text-blue-700">{row.productiveType}</td>
                      <td className="p-2.5">{row.nationality}</td>
                      <td className="p-2.5 font-mono">{row.campNo} ({row.roomNo})</td>
                      <td className="p-2.5 font-bold text-[10px]">{row.roomGrade}</td>
                      <td className="p-2.5">{row.division} ({row.costCenter})</td>
                      <td className="p-2.5 font-medium">
                        {row.errors.length > 0 ? (
                          <span className="text-rose-600 font-semibold">{row.errors.join('; ')}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Ready for import</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t shrink-0">
              <span className="text-[11px] text-slate-500">
                Only valid rows without capacity or ID conflicts will be committed to the camp database.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExcelImportModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={excelImportStats.valid === 0}
                  onClick={handleCommitExcelImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Confirm & Batch Import ({excelImportStats.valid} Occupants)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC ADD BUILDING WIZARD (CONFIGURABLE FLOORS & ROOMS) */}
      {showAddCampModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Add Building (Configurable Floors & Topology)
              </h3>
              <button onClick={() => setShowAddCampModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
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
              logActivity('CAMP_CONFIG', `Created ${newCampObj.campNo}`, `Created building with ${generatedFloors.length} floors.`);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Camp Code</label>
                  <input type="text" required value={newCampForm.campNo} onChange={e => setNewCampForm({ ...newCampForm, campNo: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Building Digit Prefix (e.g. 4 for 4-01-01)</label>
                  <input type="text" required value={newCampForm.campDigit} onChange={e => setNewCampForm({ ...newCampForm, campDigit: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Camp Area Location</label>
                  <input type="text" required value={newCampForm.campArea} onChange={e => setNewCampForm({ ...newCampForm, campArea: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Camp Commissioning Date</label>
                  <input type="date" required value={newCampForm.campStartDate} onChange={e => setNewCampForm({ ...newCampForm, campStartDate: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              {/* Dynamic Floor & Rooms per Flat Steppers */}
              <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Total Building Floors</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFloorsCountChange(newCampForm.floorsCount - 1)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={newCampForm.floorsCount}
                      onChange={e => handleFloorsCountChange(e.target.value)}
                      className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleFloorsCountChange(newCampForm.floorsCount + 1)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      +
                    </button>
                    <span className="text-[11px] text-slate-500">Floors (1 to 20)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Rooms per Flat</label>
                  <select
                    value={newCampForm.roomsPerFlat}
                    onChange={e => setNewCampForm({ ...newCampForm, roomsPerFlat: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800"
                  >
                    <option value={2}>2 Rooms per Flat (A, B)</option>
                    <option value={3}>3 Rooms per Flat (A, B, C)</option>
                    <option value={4}>4 Rooms per Flat (A, B, C, D)</option>
                    <option value={5}>5 Rooms per Flat (A, B, C, D, E)</option>
                    <option value={6}>6 Rooms per Flat (A, B, C, D, E, F)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Per-Floor Topology Table */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Floor-by-Floor Flat Topology ({newCampForm.floorConfigs.length} Floors):</span>
                  <span className="text-[11px] text-slate-500">Non-Manual = 2 beds/rm • Manual = 3 beds/rm</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Floor</th>
                        <th className="py-2 px-3">Flats on this Floor</th>
                        <th className="py-2 px-3">Non-Manual Flats (2 beds/rm)</th>
                        <th className="py-2 px-3">Manual Flats (3 beds/rm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {newCampForm.floorConfigs.map(fc => (
                        <tr key={fc.floorNo}>
                          <td className="py-2 px-3 font-bold text-slate-900">Floor {fc.floorNo}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              max="15"
                              value={fc.flatsCount}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setNewCampForm(prev => ({
                                  ...prev,
                                  floorConfigs: prev.floorConfigs.map(f => f.floorNo === fc.floorNo ? {
                                    ...f, flatsCount: val, nonManualFlats: Math.min(f.nonManualFlats, val)
                                  } : f)
                                }));
                              }}
                              className="w-20 border rounded px-2 py-1 text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              max={fc.flatsCount}
                              value={fc.nonManualFlats}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setNewCampForm(prev => ({
                                  ...prev,
                                  floorConfigs: prev.floorConfigs.map(f => f.floorNo === fc.floorNo ? { ...f, nonManualFlats: Math.min(val, f.flatsCount) } : f)
                                }));
                              }}
                              className="w-20 border rounded px-2 py-1 text-center font-bold text-cyan-700"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono text-amber-700 font-bold">
                            {Math.max(0, fc.flatsCount - fc.nonManualFlats)} Manual
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddCampModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">Create Building</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Itemized Project Invoice Modal */}
      {selectedInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <DhowLogo className="h-6 w-auto" />
                <span className="font-mono font-bold text-slate-500">
                  INV-{selectedInvoiceModal.costCenter}-{billingPeriod.replace(' ', '-')}
                </span>
              </div>
              <button onClick={() => setSelectedInvoiceModal(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <div className="text-slate-500">Debited Project Cost Center:</div>
                <div className="text-sm font-black text-cyan-700">{selectedInvoiceModal.costCenter}</div>
                <div className="font-semibold text-slate-700">Site: {selectedInvoiceModal.projectName}</div>
                <div className="text-slate-500">Division: {selectedInvoiceModal.division}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border space-y-1 text-right">
                <div className="text-slate-500">Credited Camp Management:</div>
                <div className="text-sm font-black text-slate-900">Cost Center 1ACD000</div>
                <div className="font-semibold text-slate-700">Billing Period: {billingPeriod}</div>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b">
                  <tr>
                    <th className="py-2.5 px-3">Staff ID</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Nationality</th>
                    <th className="py-2.5 px-3">Room</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3 text-right">Charge (KWD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedInvoiceModal.occupants.map(occ => {
                    const bedCost = occ.roomGrade === 'Non-Manual' ? rates.nonManual : rates.manual;
                    return (
                      <tr key={occ.employeeId}>
                        <td className="py-2 px-3 font-mono font-bold text-cyan-600">#{occ.employeeId}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{occ.employeeName}</td>
                        <td className="py-2 px-3">{occ.nationality}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{occ.roomNo}</td>
                        <td className="py-2 px-3 font-bold text-[10px]">
                          <span className={`px-2 py-0.5 rounded ${
                            occ.roomGrade === 'Non-Manual' ? 'bg-cyan-50 text-cyan-700' : 'bg-amber-50 text-amber-700'
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

                  {selectedInvoiceModal.otherCostKWD > 0 && (
                    <tr className="bg-purple-50/70 font-semibold text-purple-900">
                      <td colSpan={3} className="py-2.5 px-3">
                        <strong>Others (Misc Camp Cost):</strong> {selectedInvoiceModal.otherCostDesc || 'Allocated recharge'}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-right">Allocated Recharge</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-purple-800">
                        {selectedInvoiceModal.otherCostKWD.toFixed(3)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t font-bold text-xs">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-3 text-right uppercase">Total Invoice:</td>
                    <td className="py-2.5 px-3 text-right font-black text-sm text-emerald-700">
                      {selectedInvoiceModal.totalAmountKWD.toFixed(3)} KWD
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-[11px] text-slate-400">Dhow Camp Management Registry</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button type="button" onClick={() => setSelectedInvoiceModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* EMPLOYEE DOSSIER MODAL WITH TEMPLATE EXPORT ACTIONS     */}
      {/* ======================================================= */}
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
              <button onClick={() => setViewingEmployeeDossier(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium">Civil ID</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.civilId}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium">Passport #</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.passportNo}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium flex items-center gap-1"><Phone className="w-3 h-3 text-cyan-600" /> Mobile</div>
                <div className="font-mono font-bold text-cyan-700 mt-0.5">{viewingEmployeeDossier.mobileNo || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium flex items-center gap-1"><Globe className="w-3 h-3 text-cyan-600" /> Nationality</div>
                <div className="font-bold text-slate-900 mt-0.5">{viewingEmployeeDossier.nationality}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium">Status</div>
                <div className="mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewingEmployeeDossier.employeeStatus === 'On Job' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewingEmployeeDossier.employeeStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Room Allocation & Duration */}
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-600" /> Current Room Allocation
                </span>
                <span className="font-bold px-2.5 py-1 rounded-lg bg-white text-cyan-700 border border-cyan-200">
                  {viewingEmployeeDossier.roomGrade} Grade
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500">Camp:</span>
                  <div className="font-bold text-slate-900">{viewingEmployeeDossier.campNo} ({viewingEmployeeDossier.campArea})</div>
                </div>
                <div>
                  <span className="text-slate-500">Room:</span>
                  <div className="font-bold text-cyan-700 font-mono">Flat {viewingEmployeeDossier.flatCode} • Room {viewingEmployeeDossier.roomNo}</div>
                </div>
                <div>
                  <span className="text-slate-500">Entry Date:</span>
                  <div className="font-bold text-slate-900 font-mono">{viewingEmployeeDossier.entryDate}</div>
                </div>
              </div>

              <div className="p-3 bg-white/90 border border-cyan-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span className="text-slate-600 font-medium">Current Room Duration:</span>
                </div>
                <div className="font-black text-slate-900 font-mono text-sm">
                  {calculateTenure(viewingEmployeeDossier.entryDate, viewingEmployeeDossier.employeeStatus.startsWith('RTD') ? viewingEmployeeDossier.exitDate : null)}
                </div>
              </div>

              {/* Action Buttons for Vouchers and Incident Logging */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-cyan-200/60">
                <button
                  type="button"
                  onClick={() => exportMaterialIssuanceForm(viewingEmployeeDossier)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Template 3: Material Issuance Form (Doc 150-04)"
                >
                  <Download className="w-3.5 h-3.5" /> Material Issuance (T3)
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
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Template 5 & 6: Report Misconduct"
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
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Template 7: Log Maintenance"
                >
                  <Wrench className="w-3.5 h-3.5" /> Log Maintenance (T7)
                </button>

                <button
                  onClick={() => {
                    const occ = viewingEmployeeDossier;
                    setViewingEmployeeDossier(null);
                    handleOpenRelocateModal(occ);
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Relocate Bed
                </button>
              </div>
            </div>

            {/* Relocation History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-600" /> Accommodation & Relocation History Ledger
              </h4>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                <div className="relative pl-6 pb-2 border-l-2 border-cyan-500">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-500 border-2 border-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-800">● Active Stay: {viewingEmployeeDossier.campNo} (Room {viewingEmployeeDossier.roomNo})</span>
                    <span className="font-mono text-slate-500 text-[11px]">{viewingEmployeeDossier.entryDate} – Present</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Grade: {viewingEmployeeDossier.roomGrade} • Cost Center: {viewingEmployeeDossier.costCenter}</div>
                </div>

                {viewingEmployeeDossier.stayHistory && viewingEmployeeDossier.stayHistory.length > 0 ? (
                  viewingEmployeeDossier.stayHistory.map((hist, idx) => (
                    <div key={idx} className="relative pl-6 pb-2 border-l-2 border-slate-300">
                      <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-slate-400 border border-white" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{hist.campNo} — Room {hist.roomNo}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{hist.startDate} – {hist.endDate}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Stayed: {calculateTenure(hist.startDate, hist.endDate)}</div>
                      <div className="text-[11px] text-slate-700 italic mt-0.5 bg-white p-1.5 rounded border">Reason: {hist.reason}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400 italic">No previous relocation records.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => setViewingEmployeeDossier(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bed Relocation Modal */}
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
                  <label className="block font-semibold mb-1">Transfer Date</label>
                  <input type="date" required value={relocationForm.transferDate} onChange={e => setRelocationForm({ ...relocationForm, transferDate: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Transfer Reason</label>
                  <input type="text" required value={relocationForm.reason} onChange={e => setRelocationForm({ ...relocationForm, reason: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <button
                  type="button"
                  onClick={() => exportOccupantsRelocationForm({
                    employeeId: relocatingOccupant.employeeId,
                    employeeName: relocatingOccupant.employeeName,
                    title: relocatingOccupant.title,
                    fromRoom: `${relocatingOccupant.campNo} - ${relocatingOccupant.roomNo}`,
                    toRoom: `${relocationForm.targetCampId} - ${relocationForm.targetRoomNo}`,
                    relocationDate: relocationForm.transferDate,
                    reason: relocationForm.reason
                  })}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Preview Form (T4)
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setRelocatingOccupant(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer">Confirm & Export</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* CHECK-IN MODAL WITH EMPLOYEE PRODUCTIVE TYPE DROPDOWN    */}
      {/* ======================================================= */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600" /> Room Assignment (AFR Check-In)
              </h3>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between">
              <span>Target Room: <strong>{checkInForm.roomNo}</strong> (Flat {checkInForm.flatCode})</span>
              <span className="font-bold text-cyan-700">{checkInForm.roomGrade} Grade</span>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee ID</label>
                  <input type="text" required placeholder="6410" value={checkInForm.employeeId} onChange={e => setCheckInForm({ ...checkInForm, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input type="text" required placeholder="Full Name" value={checkInForm.employeeName} onChange={e => setCheckInForm({ ...checkInForm, employeeName: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
              </div>

              {/* Employee Productive Type & Category */}
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
                  <label className="block font-semibold mb-1">Arrival Type</label>
                  <select
                    value={checkInForm.arrivalType}
                    onChange={e => setCheckInForm({ ...checkInForm, arrivalType: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-semibold bg-white"
                  >
                    <option value="Local Residency Transfer">Local Residency Transfer</option>
                    <option value="Overseas">Overseas Arrival</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nationality</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India, Egypt, Pakistan"
                    value={checkInForm.nationality}
                    onChange={e => setCheckInForm({ ...checkInForm, nationality: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-semibold"
                  />
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

              <div>
                <label className="block font-semibold mb-1">Job Title</label>
                <input type="text" required value={checkInForm.title} onChange={e => setCheckInForm({ ...checkInForm, title: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Emergency Contact Name</label>
                  <input type="text" placeholder="Name & Relation" value={checkInForm.emergencyContactName} onChange={e => setCheckInForm({ ...checkInForm, emergencyContactName: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Emergency Phone</label>
                  <input type="tel" placeholder="+965 or home phone" value={checkInForm.emergencyContactPhone} onChange={e => setCheckInForm({ ...checkInForm, emergencyContactPhone: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Project Cost Center</label>
                  <select
                    value={checkInForm.costCenter}
                    onChange={e => {
                      const c = costCenters.find(cc => cc.code === e.target.value);
                      setCheckInForm({ ...checkInForm, costCenter: e.target.value, division: c ? c.division : checkInForm.division });
                    }}
                    className="w-full border rounded-xl px-3 py-2 font-mono font-bold"
                  >
                    {costCenters.filter(c => c.status === 'Active').map(cc => (
                      <option key={cc.id} value={cc.code}>{cc.code} — {cc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Division</label>
                  <select
                    value={checkInForm.division}
                    onChange={e => setCheckInForm({ ...checkInForm, division: e.target.value })}
                    className="w-full border font-bold rounded-xl px-3 py-2"
                  >
                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCheckInModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold cursor-pointer">Confirm Check-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* TEMPLATE 5 & 6: ACCOMMODATION MISCONDUCT REPORT MODAL    */}
      {/* ======================================================= */}
      {showMisconductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveMisconduct} className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Accommodation Misconduct Report (Template 5 & 6)
              </h3>
              <button type="button" onClick={() => setShowMisconductModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Offender Employee ID</label>
                <input type="text" required value={misconductForm.employeeId} onChange={e => setMisconductForm({ ...misconductForm, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono font-bold" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Offender Name</label>
                <input type="text" required value={misconductForm.employeeName} onChange={e => setMisconductForm({ ...misconductForm, employeeName: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Accommodation</label>
                <input type="text" required value={misconductForm.campNo} onChange={e => setMisconductForm({ ...misconductForm, campNo: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Room No</label>
                <input type="text" required value={misconductForm.roomNo} onChange={e => setMisconductForm({ ...misconductForm, roomNo: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Incident Time</label>
                <input type="text" required value={misconductForm.incidentTime} onChange={e => setMisconductForm({ ...misconductForm, incidentTime: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Location of Offence</label>
              <input type="text" required value={misconductForm.incidentLocation} onChange={e => setMisconductForm({ ...misconductForm, incidentLocation: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
            </div>

            <div>
              <label className="block font-semibold mb-1">Type of Violation</label>
              <input type="text" required value={misconductForm.typeOfViolation} onChange={e => setMisconductForm({ ...misconductForm, typeOfViolation: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold text-rose-700" />
            </div>

            <div>
              <label className="block font-semibold mb-1">Brief Description of Offence</label>
              <textarea rows={3} required value={misconductForm.description} onChange={e => setMisconductForm({ ...misconductForm, description: e.target.value })} className="w-full border rounded-xl p-2.5" placeholder="Detail the violation, witnesses, and facts..." />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-xl">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Witness Name</label>
                <input type="text" value={misconductForm.witnessName} onChange={e => setMisconductForm({ ...misconductForm, witnessName: e.target.value })} className="w-full border bg-white rounded-lg px-2.5 py-1.5" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Witness ID</label>
                <input type="text" value={misconductForm.witnessId} onChange={e => setMisconductForm({ ...misconductForm, witnessId: e.target.value })} className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-mono" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowMisconductModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer">Record & Export Slip (.xlsx)</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================= */}
      {/* TEMPLATE 7: ACCOMMODATION MAINTENANCE LOG MODAL         */}
      {/* ======================================================= */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveMaintenance} className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                Accommodation Maintenance Complaint (Template 7)
              </h3>
              <button type="button" onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Date</label>
                <input type="date" required value={maintenanceForm.date} onChange={e => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Month</label>
                <input type="text" required value={maintenanceForm.month} onChange={e => setMaintenanceForm({ ...maintenanceForm, month: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Room No</label>
                <input type="text" required value={maintenanceForm.roomNo} onChange={e => setMaintenanceForm({ ...maintenanceForm, roomNo: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono font-bold" />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Maintenance Issue Details</label>
              <textarea rows={2.5} required value={maintenanceForm.issueDetails} onChange={e => setMaintenanceForm({ ...maintenanceForm, issueDetails: e.target.value })} className="w-full border rounded-xl p-2.5" placeholder="Describe the leak, electrical issue, A/C failure..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Reported by Emp ID</label>
                <input type="text" required value={maintenanceForm.reportedByEmpId} onChange={e => setMaintenanceForm({ ...maintenanceForm, reportedByEmpId: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Employee Name</label>
                <input type="text" required value={maintenanceForm.employeeName} onChange={e => setMaintenanceForm({ ...maintenanceForm, employeeName: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select value={maintenanceForm.status} onChange={e => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-bold">
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Material Cost (KWD)</label>
                <input type="text" value={maintenanceForm.replacedMaterialCost} onChange={e => setMaintenanceForm({ ...maintenanceForm, replacedMaterialCost: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Charge to Emp ID#</label>
                <input type="text" value={maintenanceForm.chargeToEmpId} onChange={e => setMaintenanceForm({ ...maintenanceForm, chargeToEmpId: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowMaintenanceModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold cursor-pointer">Save to Maintenance Log</button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Manage Modal */}
      {manageOccupantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Manage #{manageOccupantModal.employeeId} ({manageOccupantModal.employeeName})</h3>
              <button onClick={() => setManageOccupantModal(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <div><strong>Type:</strong> <span className="font-semibold text-blue-700">{manageOccupantModal.productiveType || 'Direct Employee (DE)'}</span></div>
              <div><strong>Nationality:</strong> <span className="font-semibold text-slate-800">{manageOccupantModal.nationality}</span></div>
              <div><strong>Mobile:</strong> {manageOccupantModal.mobileNo || 'N/A'}</div>
              <div><strong>Emergency:</strong> {manageOccupantModal.emergencyContactName} ({manageOccupantModal.emergencyContactPhone})</div>
              <div><strong>Status:</strong> <span className="font-bold text-cyan-700">{manageOccupantModal.employeeStatus}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {manageOccupantModal.employeeStatus !== 'On Leave' && !manageOccupantModal.employeeStatus.startsWith('RTD') && (
                <button onClick={() => setShowLeaveModal(manageOccupantModal)} className="p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold cursor-pointer">
                  Mark On Leave
                </button>
              )}
              {manageOccupantModal.employeeStatus === 'On Leave' && (
                <button onClick={() => setShowReturnJobModal(manageOccupantModal)} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">
                  Return from Leave
                </button>
              )}
              {!manageOccupantModal.employeeStatus.startsWith('RTD') && (
                <button onClick={() => setShowTransferRequestModal(manageOccupantModal)} className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer">
                  Change Cost Center
                </button>
              )}
              {!manageOccupantModal.employeeStatus.startsWith('RTD') && (
                <button onClick={() => setShowRtdModal(manageOccupantModal)} className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer">
                  Process RTD Exit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLeaveSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Mark On Leave (#{showLeaveModal.employeeId})</h3>
            <div>
              <label className="block font-bold mb-1">Leave Start Date</label>
              <input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block font-bold mb-1">Expected End Date</label>
              <input type="date" required value={leaveForm.expectedEndDate} onChange={e => setLeaveForm({ ...leaveForm, expectedEndDate: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block font-bold mb-1">AFR Log / Vacation Ref</label>
              <input type="text" required value={leaveForm.afrLogNo} onChange={e => setLeaveForm({ ...leaveForm, afrLogNo: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowLeaveModal(null)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold cursor-pointer">Confirm Leave</button>
            </div>
          </form>
        </div>
      )}

      {/* Return to Job Modal */}
      {showReturnJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReturnJobSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Return to Job (#{showReturnJobModal.employeeId})</h3>
            <div>
              <label className="block font-bold mb-1">Actual Return Date</label>
              <input type="date" required value={returnJobForm.actualReturnDate} onChange={e => setReturnJobForm({ ...returnJobForm, actualReturnDate: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block font-bold mb-1">Remarks</label>
              <input type="text" value={returnJobForm.remarks} onChange={e => setReturnJobForm({ ...returnJobForm, remarks: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowReturnJobModal(null)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold cursor-pointer">Confirm Return</button>
            </div>
          </form>
        </div>
      )}

      {/* RTD Exit Modal */}
      {showRtdModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRtdSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Process RTD Exit (#{showRtdModal.employeeId})</h3>
            <div>
              <label className="block font-bold mb-1">RTD Type</label>
              <select value={rtdForm.rtdType} onChange={e => setRtdForm({ ...rtdForm, rtdType: e.target.value })} className="w-full border rounded-lg p-2 font-bold">
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Exit Date</label>
              <input type="date" required value={rtdForm.rtdDate} onChange={e => setRtdForm({ ...rtdForm, rtdDate: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block font-semibold mb-1">AFR Exit Ref #</label>
              <input type="text" required value={rtdForm.afrExitRef} onChange={e => setRtdForm({ ...rtdForm, afrExitRef: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowRtdModal(null)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold cursor-pointer">Vacate Bed & Confirm RTD</button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Request Modal */}
      {showTransferRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCostCenterTransferRequest} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Transfer Cost Center (#{showTransferRequestModal.employeeId})</h3>
            <div>
              <label className="block font-bold mb-1">Target Project Cost Center</label>
              <select
                value={transferRequestForm.toCostCenter}
                onChange={e => {
                  const ccCode = e.target.value;
                  const cc = costCenters.find(c => c.code === ccCode);
                  setTransferRequestForm({ ...transferRequestForm, toCostCenter: ccCode, toDivision: cc ? cc.division : 'General' });
                }}
                className="w-full border rounded-lg p-2 font-bold font-mono"
              >
                {costCenters.filter(c => c.status === 'Active').map(cc => (
                  <option key={cc.id} value={cc.code}>{cc.code} — {cc.name} ({cc.division})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Reason for Transfer</label>
              <input type="text" required value={transferRequestForm.reason} onChange={e => setTransferRequestForm({ ...transferRequestForm, reason: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowTransferRequestModal(null)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-bold cursor-pointer">
                {currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'AUDITOR' ? 'Apply Transfer Directly' : 'Submit Transfer Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Management Modals */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600" /> Add System User Account
              </h3>
              <button onClick={() => setShowAddUserModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Staff ID</label>
                  <input type="text" required placeholder="EDT-025" value={newUserForm.staffId} onChange={e => setNewUserForm({ ...newUserForm, staffId: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input type="text" required placeholder="Full Name" value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input type="email" required placeholder="user@al-dhow.com" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Role</label>
                  <select value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value, ...getRoleDefaultPermissions(e.target.value) })} className="w-full border rounded-xl px-3 py-2 font-bold">
                    <option value="CAMP_EDITOR">Camp Editor</option>
                    <option value="AUDITOR">Auditor (Compliance)</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Password</label>
                <input type="password" required placeholder="Min 8 characters" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold cursor-pointer">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPasswordModal && targetUserForReset && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-600" /> Reset Password
              </h3>
              <button onClick={() => { setShowResetPasswordModal(false); setTargetUserForReset(null); }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {resetSuccessMessage ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold">{resetSuccessMessage}</div>
            ) : (
              <form onSubmit={handleExecutePasswordReset} className="space-y-3.5">
                <div>
                  <label className="block font-semibold mb-1">New Password for {targetUserForReset.name}</label>
                  <input type="password" required placeholder="Min 8 characters" value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Confirm Password</label>
                  <input type="password" required placeholder="Re-enter password" value={confirmPasswordValue} onChange={e => setConfirmPasswordValue(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setShowResetPasswordModal(false); setTargetUserForReset(null); }} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold cursor-pointer">Update Password</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Decommission Lockout Modal */}
      {decommissionLockoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Decommissioning Blocked</h3>
                <p className="text-rose-600">Facility {decommissionLockoutModal.camp.campNo} still has {decommissionLockoutModal.occupants.length} active occupants.</p>
              </div>
            </div>
            <p className="text-slate-600">Relocate or check out all residents before archiving this facility.</p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setDecommissionLockoutModal(null)} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer">
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}