import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2, Users, ShieldCheck, Eye, EyeOff, Lock, LogOut, Plus, Search,
  Download, CheckCircle2, AlertCircle, Trash2, UserPlus, KeyRound, Bed,
  Home, RefreshCw, X, FileSpreadsheet, BarChart3, Plane, Settings,
  Receipt, Printer, Edit3, ArrowRightLeft, History, MapPin, AlertTriangle,
  Archive, Tag, Phone, Clock, SlidersHorizontal, Layers, CheckSquare, Globe
} from 'lucide-react';
import dhowLogoImg from './assets/dhow-logo.png';
import { calculateTenure, getRoleDefaultPermissions } from './utils/helpers';
import {
  INITIAL_USERS, INITIAL_COST_CENTERS, INITIAL_CAMPS, INITIAL_OCCUPANTS,
  INITIAL_LEAVE_LOGS, INITIAL_RTD_LOGS, INITIAL_TRANSFER_REQUESTS,
  INITIAL_BILLING_OTHER_COSTS, INITIAL_ACTIVITY_LOGS
} from './data/initialDatabase';

import InvoicingTab from './components/InvoicingTab';
import ReportsTab from './components/ReportsTab';
import ActivityLogTab from './components/ActivityLogTab';
import ApprovalsAndTablesTab from './components/ApprovalsAndTablesTab';

const DhowLogo = ({ className = "h-8 w-auto" }) => (
  <img src={dhowLogoImg} alt="Dhow Engineering" className={className} />
);

export default function App() {
  // ==========================================
  // STATE PERSISTENCE (13 NORMALIZED TABLES)
  // ==========================================
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('dhow_users_v13')) || INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('dhow_session_v13')) || null);
  const [camps, setCamps] = useState(() => JSON.parse(localStorage.getItem('dhow_camps_v13')) || INITIAL_CAMPS);
  const [occupants, setOccupants] = useState(() => JSON.parse(localStorage.getItem('dhow_occupants_v13')) || INITIAL_OCCUPANTS);
  const [costCenters, setCostCenters] = useState(() => JSON.parse(localStorage.getItem('dhow_cc_v13')) || INITIAL_COST_CENTERS);
  const [leaveLogs, setLeaveLogs] = useState(() => JSON.parse(localStorage.getItem('dhow_leave_v13')) || INITIAL_LEAVE_LOGS);
  const [rtdLogs, setRtdLogs] = useState(() => JSON.parse(localStorage.getItem('dhow_rtd_v13')) || INITIAL_RTD_LOGS);
  const [transferRequests, setTransferRequests] = useState(() => JSON.parse(localStorage.getItem('dhow_tr_v13')) || INITIAL_TRANSFER_REQUESTS);
  const [otherCosts, setOtherCosts] = useState(() => JSON.parse(localStorage.getItem('dhow_others_v13')) || INITIAL_BILLING_OTHER_COSTS);
  const [activityLogs, setActivityLogs] = useState(() => JSON.parse(localStorage.getItem('dhow_act_v13')) || INITIAL_ACTIVITY_LOGS);

  // Navigation Tabs: 'map' | 'occupants' | 'invoicing' | 'reports' | 'activity_logs' | 'approvals' | 'admin'
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
    roomGrade: 'Non-Manual', employeeId: '', employeeName: '', nationality: 'India',
    title: 'Site Engineer', division: 'IDS', costCenter: '1IDS038-KIPIC',
    passportNo: '', civilId: '', mobileNo: '+965 ', emergencyContactName: '',
    emergencyContactPhone: '+965 ', homeCountryAddress: '', entryDate: '2026-11-09'
  });

  const [relocationForm, setRelocationForm] = useState({
    targetCampId: '', targetFloorNo: '', targetFlatCode: '', targetRoomNo: '',
    transferDate: '2026-11-09', reason: 'Project Site Reallocation'
  });

  const [leaveForm, setLeaveForm] = useState({
    startDate: '2026-11-09', expectedEndDate: '2026-12-09', afrLogNo: 'LOG-VAC', remarks: 'Annual Vacation'
  });
  const [returnJobForm, setReturnJobForm] = useState({
    actualReturnDate: '2026-11-09', remarks: 'Returned on schedule'
  });
  const [rtdForm, setRtdForm] = useState({
    rtdType: 'Resigned', rtdDate: '2026-11-09', afrExitRef: 'EXIT-RTD', remarks: 'Resigned from company'
  });
  const [transferRequestForm, setTransferRequestForm] = useState({
    toCostCenter: '1MEP019-KNPC', toDivision: 'MEP', reason: 'Reassigned to new project site'
  });
  const [newCostCenterForm, setNewCostCenterForm] = useState({ code: '', name: '', division: 'IDS' });

  // Add Camp Wizard: Dynamic Per-Floor Flat Configuration
  const [newCampForm, setNewCampForm] = useState({
    campNo: 'CAMP-04', campArea: 'Ahmadi Sector 4', campDigit: '4', campStartDate: '2026-11-09',
    floorsCount: 3, roomsPerFlat: 3,
    floorConfigs: [
      { floorNo: 1, flatsCount: 2, nonManualFlats: 1 },
      { floorNo: 2, flatsCount: 3, nonManualFlats: 0 },
      { floorNo: 3, flatsCount: 3, nonManualFlats: 0 }
    ]
  });

  const [newUserForm, setNewUserForm] = useState({
    staffId: '', name: '', email: '', password: '', title: '', role: 'CAMP_EDITOR',
    campScope: 'ALL', canManageUsers: false, canAddCamps: false, canDeleteCamps: true,
    canEditOccupants: true, canExportReports: true, canApproveTransfers: false
  });

  // LocalStorage Sync
  useEffect(() => { localStorage.setItem('dhow_users_v13', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('dhow_camps_v13', JSON.stringify(camps)); }, [camps]);
  useEffect(() => { localStorage.setItem('dhow_occupants_v13', JSON.stringify(occupants)); }, [occupants]);
  useEffect(() => { localStorage.setItem('dhow_cc_v13', JSON.stringify(costCenters)); }, [costCenters]);
  useEffect(() => { localStorage.setItem('dhow_leave_v13', JSON.stringify(leaveLogs)); }, [leaveLogs]);
  useEffect(() => { localStorage.setItem('dhow_rtd_v13', JSON.stringify(rtdLogs)); }, [rtdLogs]);
  useEffect(() => { localStorage.setItem('dhow_tr_v13', JSON.stringify(transferRequests)); }, [transferRequests]);
  useEffect(() => { localStorage.setItem('dhow_others_v13', JSON.stringify(otherCosts)); }, [otherCosts]);
  useEffect(() => { localStorage.setItem('dhow_act_v13', JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => {
    if (currentUser && rememberMe) localStorage.setItem('dhow_session_v13', JSON.stringify(currentUser));
    else if (!currentUser) localStorage.removeItem('dhow_session_v13');
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
    localStorage.removeItem('dhow_session_v13');
    setActiveTab('map');
  };

  const activeCamps = useMemo(() => camps.filter(c => c.status !== 'Decommissioned'), [camps]);
  const activeCamp = useMemo(() => activeCamps.find(c => c.id === selectedCampId) || activeCamps[0] || camps[0], [activeCamps, camps, selectedCampId]);
  const activeFloor = useMemo(() => activeCamp?.floors.find(f => f.floorNo === selectedFloorNo) || activeCamp?.floors[0], [activeCamp, selectedFloorNo]);

  // Global Bed Telemetry
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
      (occ.mobileNo && occ.mobileNo.includes(q))
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

      return matchesSearch && matchesStatus && matchesDivision;
    });
  }, [occupants, searchTerm, statusFilter, divisionFilter]);

  const availableDivisions = useMemo(() => {
    return Array.from(new Set(costCenters.map(c => c.division))).filter(Boolean);
  }, [costCenters]);

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
  // 1. INLINE FLAT GRADE SWITCHER (NON-MANUAL VS MANUAL)
  // =========================================================
  const handleFlatGradeChange = (campId, floorNo, flatCode, newGrade) => {
    const newCapacity = newGrade === 'Non-Manual' ? 2 : 3;
    const targetCamp = camps.find(c => c.id === campId);
    const targetFloor = targetCamp?.floors.find(f => f.floorNo === floorNo);
    const targetFlat = targetFloor?.flats.find(f => f.flatCode === flatCode);

    if (!targetFlat) return;

    // Check capacity constraints
    const overCapacityRoom = targetFlat.rooms.find(r => r.occupants.length > newCapacity);
    if (overCapacityRoom) {
      alert(`Capacity Conflict: Room ${overCapacityRoom.roomNo} currently has ${overCapacityRoom.occupants.length} occupants. You cannot switch this flat to ${newGrade} (${newCapacity} beds/room) until excess occupants are relocated.`);
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
          return {
            ...occ,
            flatCode: newFlatCode,
            roomGrade: newGrade
          };
        }
        return occ;
      })
    );

    logActivity('CAMP_CONFIG', `Changed Grade of Flat ${flatCode}`, `Changed Flat ${flatCode} to ${newGrade} (${newCapacity} beds/room) in ${targetCamp.campNo}`, targetCamp.campNo);
  };

  // =========================================================
  // 2. DYNAMIC FLOOR-BY-FLOOR FLAT MANAGEMENT
  // =========================================================
  const handleFloorsCountChange = (count) => {
    const num = Math.max(1, Math.min(20, parseInt(count, 10) || 1));
    setNewCampForm(prev => {
      const currentConfigs = [...prev.floorConfigs];
      const newConfigs = [];
      for (let i = 1; i <= num; i++) {
        const existing = currentConfigs.find(c => c.floorNo === i);
        newConfigs.push(existing || { floorNo: i, flatsCount: 3, nonManualFlats: 0 });
      }
      return { ...prev, floorsCount: num, floorConfigs: newConfigs };
    });
  };

  const updateFloorConfig = (floorNo, field, val) => {
    setNewCampForm(prev => ({
      ...prev,
      floorConfigs: prev.floorConfigs.map(f => f.floorNo === floorNo ? { ...f, [field]: parseInt(val, 10) || 0 } : f)
    }));
  };

  const handleCreateCamp = (e) => {
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

      return {
        floorNo: fc.floorNo,
        flats: floorFlats
      };
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
    logActivity('CAMP_CONFIG', `Created Building ${newCampObj.campNo}`, `Created ${newCampObj.campNo} (${newCampObj.campArea}) with ${generatedFloors.length} floors configured floor-by-floor.`, newCampObj.campNo);
  };

  // Edit Camp Modal: Add/Remove Flat on Specific Floor
  const handleAddFlatToSpecificFloor = (floorNo) => {
    if (!editingCampModal) return;
    const targetFloor = editingCampModal.floors.find(f => f.floorNo === floorNo);
    if (!targetFloor) return;

    const nextFlatNo = targetFloor.flats.length + 1;
    const campDigit = editingCampModal.campDigit || '1';
    const flStr = String(floorNo).padStart(2, '0');
    const flatStr = String(nextFlatNo).padStart(2, '0');

    const newFlat = {
      flatNo: nextFlatNo,
      flatCode: `${campDigit}-${flStr}-${flatStr}-M`,
      roomGrade: 'Manual',
      rooms: [
        { roomNo: `${campDigit}-${flStr}-${flatStr}-A`, capacity: 3, occupants: [] },
        { roomNo: `${campDigit}-${flStr}-${flatStr}-B`, capacity: 3, occupants: [] },
        { roomNo: `${campDigit}-${flStr}-${flatStr}-C`, capacity: 3, occupants: [] },
      ]
    };

    setEditingCampModal(prev => ({
      ...prev,
      floors: prev.floors.map(f => f.floorNo === floorNo ? { ...f, flats: [...f.flats, newFlat] } : f)
    }));
  };

  const handleRemoveFlatFromSpecificFloor = (floorNo) => {
    if (!editingCampModal) return;
    const targetFloor = editingCampModal.floors.find(f => f.floorNo === floorNo);
    if (!targetFloor || targetFloor.flats.length <= 1) return;

    const lastFlat = targetFloor.flats[targetFloor.flats.length - 1];
    let hasOccupants = false;
    lastFlat.rooms.forEach(rm => { if (rm.occupants.length > 0) hasOccupants = true; });

    if (hasOccupants) {
      alert(`Cannot remove Flat ${lastFlat.flatCode} on Floor ${floorNo} because it has active occupants.`);
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
    logActivity('CAMP_CONFIG', `Updated Camp ${editingCampModal.campNo}`, `Saved floor structure and metadata for ${editingCampModal.campNo}`, editingCampModal.campNo);
    setEditingCampModal(null);
  };

  const handleAttemptDecommissionCamp = (camp) => {
    const activeStaffInCamp = occupants.filter(o => o.campNo === camp.campNo && !o.employeeStatus.startsWith('RTD'));
    if (activeStaffInCamp.length > 0) {
      setDecommissionLockoutModal({ camp, occupants: activeStaffInCamp });
      return;
    }
    if (confirm(`Confirm decommissioning of ${camp.campNo}? It will be safely archived from the active map.`)) {
      setCamps(prev => prev.map(c => c.id === camp.id ? { ...c, status: 'Decommissioned' } : c));
      logActivity('CAMP_DECOMMISSION', `Decommissioned ${camp.campNo}`, `Camp ${camp.campNo} (${camp.campArea}) archived safely with zero active occupants`);
      setEditingCampModal(null);
    }
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
    setNewCostCenterForm({ code: '', name: '', division: 'IDS' });
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

  // Occupant Operational Handlers
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
      productivityType: 'DE',
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
      afrEntryRef: checkInForm.afrEntryRef,
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
    logActivity('CHECK_IN', `Assigned #${empId} to Room ${checkInForm.roomNo}`, `${newOcc.employeeName} (${newOcc.nationality} • ${newOcc.title}) assigned to ${targetCamp.campNo} Flat ${checkInForm.flatCode} Room ${checkInForm.roomNo}`, targetCamp.campNo);
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
    logActivity('LEAVE_START', `Marked #${emp.employeeId} On Leave`, `${emp.employeeName} on vacation from ${leaveForm.startDate} to ${leaveForm.expectedEndDate} (Bed held in ${emp.campNo} Room ${emp.roomNo})`, emp.campNo);
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
      ...l, actualReturnDate: returnJobForm.actualReturnDate, status: 'Returned', remarks: `${l.remarks} • Return Note: ${returnJobForm.remarks}`
    } : l));

    logActivity('LEAVE_RETURN', `Marked #${emp.employeeId} Returned to Job`, `${emp.employeeName} returned on Actual Return Date: ${returnJobForm.actualReturnDate} (${emp.campNo} Room ${emp.roomNo})`, emp.campNo);
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
    logActivity('RTD_EXIT', `Processed RTD (${rtdForm.rtdType}) for #${emp.employeeId}`, `${emp.employeeName} vacated bed in ${emp.campNo} Room ${emp.roomNo} effective ${rtdForm.rtdDate}`, emp.campNo);
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
      logActivity('COST_CENTER_TRANSFER', `Direct Transfer #${emp.employeeId}`, `Moved #${emp.employeeId} (${emp.employeeName}) from ${emp.costCenter} to ${transferRequestForm.toCostCenter} directly by ${currentUser.name}`);
      alert(`Cost center for #${emp.employeeId} successfully updated to ${transferRequestForm.toCostCenter}!`);
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
      logActivity('COST_CENTER_REQUEST', `Requested Transfer for #${emp.employeeId}`, `Editor ${currentUser.name} requested transfer to ${transferRequestForm.toCostCenter}. Awaiting approval.`);
      alert(`Transfer request submitted! Awaiting Super Admin or Auditor approval.`);
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
      logActivity('COST_CENTER_APPROVAL', `Approved Transfer #${req.employeeId}`, `Approved move of #${req.employeeId} (${req.employeeName}) to ${req.toCostCenter}`);
    } else {
      logActivity('COST_CENTER_REJECTION', `Rejected Transfer #${req.employeeId}`, `Rejected transfer of #${req.employeeId} to ${req.toCostCenter}`);
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
      transferDate: '2026-11-09',
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

    logActivity('RELOCATION', `Relocated #${relocatingOccupant.employeeId} to ${targetCamp.campNo} Room ${targetRoom.roomNo}`, `${relocatingOccupant.employeeName} transferred from ${relocatingOccupant.campNo} Room ${relocatingOccupant.roomNo} to ${targetCamp.campNo} Room ${targetRoom.roomNo}. Reason: ${relocationForm.reason}`, targetCamp.campNo);
    setRelocatingOccupant(null);
    alert(`Successfully relocated #${relocatingOccupant.employeeId} to ${targetCamp.campNo} Room ${targetRoom.roomNo}!`);
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
    logActivity('USER_MGMT', `Created User Account ${newUser.staffId}`, `Created ${newUser.name} with role ${newUser.role}`);
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
    logActivity('USER_MGMT', `Reset Password for ${targetUserForReset.staffId}`, `Super Admin reset password for ${targetUserForReset.name}`);
    setTimeout(() => {
      setShowResetPasswordModal(false);
      setTargetUserForReset(null);
      setNewPasswordValue('');
      setConfirmPasswordValue('');
      setResetSuccessMessage('');
    }, 1400);
  };

  // Sign-In Screen
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
                Accommodation Registry • Floor-by-Floor Topology • Non-Manual & Manual
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
                  placeholder="Search Emp ID / Name / Nationality / Mobile..."
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
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">({occ.nationality})</span>
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

        {/* 7 MAIN TABS */}
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
            <span>Reports (Daily/Weekly/Monthly)</span>
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
            <span>Approvals & DB Tables</span>
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

      {/* Sub-Header Status Bar */}
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
                User Roles & RBAC →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* 6 Global KPI Metric Cards */}
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
        {/* TAB 1: INTERACTIVE CAMP MAP WITH FLAT GRADE DROPDOWN    */}
        {/* ======================================================= */}
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

            {/* Flats & Rooms Grid (With the requested dropdown in the flat card header) */}
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

                        {/* Flat Grade Dropdown Selector directly in the flat card header */}
                        <div className="flex items-center gap-2">
                          <select
                            value={flat.roomGrade}
                            onChange={(e) => handleFlatGradeChange(activeCamp.id, activeFloor.floorNo, flat.flatCode, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                              flat.roomGrade === 'Non-Manual'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900'
                                : 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900'
                            }`}
                            title="Change Flat Grade (Non-Manual: 2 beds/rm, Manual: 3 beds/rm)"
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

        {/* TAB 2: Book1 31-Column Occupant List (With Nationality Column) */}
        {activeTab === 'occupants' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by ID, Name, Nationality, Mobile, Civil ID, Room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
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
                  {availableDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
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
                      <th className="p-3">Nationality</th>
                      <th className="p-3">Mobile No</th>
                      <th className="p-3">Grade</th>
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
                        <td className="p-3 font-semibold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {occ.nationality}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-cyan-700 font-semibold">{occ.mobileNo || 'N/A'}</td>
                        <td className="p-3 font-bold text-[10px]">{occ.roomGrade}</td>
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
            projectInvoicingData={projectInvoicingData}
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
      {/* 3. MODAL: MANAGE MASTER COST CENTERS (ADD / EDIT)       */}
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
                  <h3 className="text-base font-bold text-slate-900">Project Cost Center Registry</h3>
                  <p className="text-slate-500 font-medium">
                    Configure master project billing codes used across room check-in, bed transfers, and monthly recharges.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowManageCostCentersModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Form */}
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
                      <option value="IDS">IDS</option>
                      <option value="MEP">MEP</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="OIL & GAS">OIL & GAS</option>
                      <option value="MARINE">MARINE</option>
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

      {/* Edit Cost Center Modal */}
      {editingCostCenterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-cyan-600" />
                Edit Cost Center
              </h3>
              <button onClick={() => setEditingCostCenterModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCostCenter} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Cost Center Code</label>
                <input
                  type="text"
                  required
                  value={editingCostCenterModal.code}
                  onChange={(e) => setEditingCostCenterModal({ ...editingCostCenterModal, code: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 font-mono uppercase font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Renaming will automatically update all existing occupant records tied to this code.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1">Project Name / Description</label>
                <input
                  type="text"
                  required
                  value={editingCostCenterModal.name}
                  onChange={(e) => setEditingCostCenterModal({ ...editingCostCenterModal, name: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Division</label>
                <select
                  value={editingCostCenterModal.division}
                  onChange={(e) => setEditingCostCenterModal({ ...editingCostCenterModal, division: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 font-bold"
                >
                  <option value="IDS">IDS</option>
                  <option value="MEP">MEP</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="OIL & GAS">OIL & GAS</option>
                  <option value="MARINE">MARINE</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCostCenterModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 4. MODAL: ADD BUILDING (FLOOR-BY-FLOOR CONFIGURATION)   */}
      {/* ======================================================= */}
      {showAddCampModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Add Building (Configured Floor-by-Floor)
              </h3>
              <button onClick={() => setShowAddCampModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Camp Code</label>
                  <input
                    type="text"
                    required
                    value={newCampForm.campNo}
                    onChange={(e) => setNewCampForm({ ...newCampForm, campNo: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Building Digit Prefix</label>
                  <input
                    type="text"
                    required
                    value={newCampForm.campDigit}
                    onChange={(e) => setNewCampForm({ ...newCampForm, campDigit: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Camp Area Location</label>
                  <input
                    type="text"
                    required
                    value={newCampForm.campArea}
                    onChange={(e) => setNewCampForm({ ...newCampForm, campArea: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Camp Start Date</label>
                  <input
                    type="date"
                    required
                    value={newCampForm.campStartDate}
                    onChange={(e) => setNewCampForm({ ...newCampForm, campStartDate: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Total Floors in Building</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={newCampForm.floorsCount}
                    onChange={(e) => handleFloorsCountChange(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 font-bold text-cyan-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rooms per Flat</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={newCampForm.roomsPerFlat}
                    onChange={(e) => setNewCampForm({ ...newCampForm, roomsPerFlat: parseInt(e.target.value, 10) || 3 })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* Floor-by-Floor Flat Configurator Table */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-2.5">
                <div className="font-bold text-slate-900">Floor-by-Floor Flat Topology:</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b">
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
                              max="10"
                              value={fc.flatsCount}
                              onChange={(e) => updateFloorConfig(fc.floorNo, 'flatsCount', e.target.value)}
                              className="w-20 border rounded px-2 py-1 text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              max={fc.flatsCount}
                              value={fc.nonManualFlats}
                              onChange={(e) => updateFloorConfig(fc.floorNo, 'nonManualFlats', e.target.value)}
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
                <button
                  type="button"
                  onClick={() => setShowAddCampModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Create Building in Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 5. MODAL: EDIT CAMP (ADD / REMOVE FLATS PER FLOOR)      */}
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

              {/* Floor-by-Floor Flat Adder/Remover */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <div className="font-bold text-slate-900">Per-Floor Flat Controls:</div>
                <div className="space-y-2">
                  {editingCampModal.floors.map(fl => (
                    <div key={fl.floorNo} className="p-2.5 bg-white border rounded-lg flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-900">Floor {fl.floorNo}</span>
                        <span className="text-slate-500 ml-2">({fl.flats.length} Flats currently)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fl.flats.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFlatFromSpecificFloor(fl.floorNo)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold"
                          >
                            - Remove Flat
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddFlatToSpecificFloor(fl.floorNo)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                        >
                          + Add Flat
                        </button>
                      </div>
                    </div>
                  ))}
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
                    onClick={() => handleAttemptDecommissionCamp(editingCampModal)}
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

      {/* ======================================================= */}
      {/* 6. MODAL: ITEMISED PROJECT INVOICE                      */}
      {/* ======================================================= */}
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
              <button onClick={() => setSelectedInvoiceModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
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
                    <th className="py-2.5 px-3">Civil ID</th>
                    <th className="py-2.5 px-3">Room / Flat</th>
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
                        <td className="py-2 px-3 font-mono text-slate-500">{occ.civilId}</td>
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
                        <strong>Others (Miscellaneous Camp Cost):</strong> {selectedInvoiceModal.otherCostDesc || 'General camp support'}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-right">
                        Allocated Recharge
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-purple-800">
                        {selectedInvoiceModal.otherCostKWD.toFixed(3)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t font-bold text-xs">
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

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-[11px] text-slate-400">
                Generated from Dhow Camp Management Registry • Verified by Camp Director
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 7. MODAL: EMPLOYEE DOSSIER                              */}
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
                  <h3 className="text-base font-bold text-slate-900">{viewingEmployeeDossier.employeeName}</h3>
                  <p className="text-slate-500 font-medium">
                    {viewingEmployeeDossier.title} • {viewingEmployeeDossier.division} ({viewingEmployeeDossier.costCenter})
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingEmployeeDossier(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Cards */}
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
                <div className="text-slate-400 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-cyan-600" /> Mobile
                </div>
                <div className="font-mono font-bold text-cyan-700 mt-0.5">{viewingEmployeeDossier.mobileNo || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400 font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-600" /> Nationality
                </div>
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

            {/* Current Room Allocation & Live Duration Clock */}
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
                  <div className="font-bold text-cyan-700 font-mono">
                    Flat {viewingEmployeeDossier.flatCode} • Room {viewingEmployeeDossier.roomNo}
                  </div>
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

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    const occ = viewingEmployeeDossier;
                    setViewingEmployeeDossier(null);
                    handleOpenRelocateModal(occ);
                  }}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Relocate / Transfer Bed
                </button>
              </div>
            </div>

            {/* Relocation History Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-600" />
                Accommodation & Relocation History Ledger
              </h4>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                <div className="relative pl-6 pb-2 border-l-2 border-cyan-500">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-500 border-2 border-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-800">● Active Stay: {viewingEmployeeDossier.campNo} (Room {viewingEmployeeDossier.roomNo})</span>
                    <span className="font-mono text-slate-500 text-[11px]">{viewingEmployeeDossier.entryDate} – Present</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Grade: {viewingEmployeeDossier.roomGrade} • Cost Center: {viewingEmployeeDossier.costCenter}
                  </div>
                </div>

                {viewingEmployeeDossier.stayHistory && viewingEmployeeDossier.stayHistory.length > 0 ? (
                  viewingEmployeeDossier.stayHistory.map((hist, idx) => (
                    <div key={idx} className="relative pl-6 pb-2 border-l-2 border-slate-300">
                      <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-slate-400 border border-white" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{hist.campNo} ({hist.campArea}) — Room {hist.roomNo}</span>
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

      {/* ======================================================= */}
      {/* 8. MODAL: 1-CLICK BED RELOCATION ENGINE                 */}
      {/* ======================================================= */}
      {relocatingOccupant && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-cyan-600" />
                Relocate Occupant #{relocatingOccupant.employeeId}
              </h3>
              <button onClick={() => setRelocatingOccupant(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
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
                      setRelocationForm({
                        ...relocationForm,
                        targetFlatCode: ftCode,
                        targetRoomNo: rm?.roomNo || ''
                      });
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
                  <label className="block font-semibold mb-1">Effective Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={relocationForm.transferDate}
                    onChange={(e) => setRelocationForm({ ...relocationForm, transferDate: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Reason for Transfer</label>
                  <input
                    type="text"
                    required
                    value={relocationForm.reason}
                    onChange={(e) => setRelocationForm({ ...relocationForm, reason: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setRelocatingOccupant(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer">
                  Confirm Relocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 9. MODAL: AFR ROOM CHECK-IN (WITH NATIONALITY)          */}
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

              <div>
                <label className="block font-semibold mb-1">Address in Home Country</label>
                <input type="text" placeholder="Full residential home address" value={checkInForm.homeCountryAddress} onChange={e => setCheckInForm({ ...checkInForm, homeCountryAddress: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
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
                  <input type="text" readOnly value={checkInForm.division} className="w-full border bg-slate-100 font-bold rounded-xl px-3 py-2 cursor-not-allowed" />
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
      {/* 10. QUICK MANAGE MODAL: LEAVE, RETURN, RTD, & TRANSFER  */}
      {/* ======================================================= */}
      {manageOccupantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Manage #{manageOccupantModal.employeeId} ({manageOccupantModal.employeeName})</h3>
              <button onClick={() => setManageOccupantModal(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <div><strong>Nationality:</strong> <span className="font-semibold text-slate-800">{manageOccupantModal.nationality}</span></div>
              <div><strong>Mobile:</strong> {manageOccupantModal.mobileNo || 'N/A'}</div>
              <div><strong>Emergency:</strong> {manageOccupantModal.emergencyContactName} ({manageOccupantModal.emergencyContactPhone})</div>
              <div><strong>Home Address:</strong> {manageOccupantModal.homeCountryAddress || 'N/A'}</div>
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
              <label className="block font-bold mb-1">AFR Log / Leave Ref</label>
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
              <label className="block font-bold mb-1">Return Remarks</label>
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
              <label className="block font-bold mb-1">Effective Date</label>
              <input type="date" required value={rtdForm.rtdDate} onChange={e => setRtdForm({ ...rtdForm, rtdDate: e.target.value })} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block font-bold mb-1">AFR Exit Ref #</label>
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
              <label className="block font-bold mb-1">Reason for Transfer</label>
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