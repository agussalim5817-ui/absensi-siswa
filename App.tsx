
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CLASSES, ATTENDANCE_PERIODS, STUDENT_COUNT } from './constants';
import { AttendanceStatus, GlobalStore, StudentNameStore } from './types';
import Toast from './components/Toast';

const STORAGE_KEY = 'absensi_smpn15_store_v2';
const NAME_STORAGE_KEY = 'absensi_smpn15_names_v2';
const ACADEMIC_YEAR_KEY = 'absensi_smpn15_tp';
const SUBJECT_NAME_KEY = 'absensi_smpn15_subject';
const SHEET_URL_KEY = 'absensi_smpn15_sheet_url';
const LOGO_STORAGE_KEY = 'absensi_smpn15_logo';

const DEFAULT_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/200px-Logo_Tut_Wuri_Handayani.png";

const SummaryCard: React.FC<{ label: string; value: string; icon: string; color: string; textColor?: string }> = ({ label, value, icon, color, textColor = 'text-slate-600' }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;
      case 'check': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>;
      case 'info': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
      case 'activity': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
      case 'x': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>;
      default: return null;
    }
  };

  return (
    <div className={`${color} p-3 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-3 transition-transform active:scale-[0.98]`}>
      <div className={`p-1.5 rounded-lg bg-white shadow-inner ${textColor}`}>
        {getIcon(icon)}
      </div>
      <div className="overflow-hidden">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
        <p className={`text-sm md:text-lg font-black ${textColor}`}>{value}</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedMonth, setSelectedMonth] = useState(ATTENDANCE_PERIODS[0].value);
  const [attendanceData, setAttendanceData] = useState<GlobalStore>({});
  const [studentNames, setStudentNames] = useState<StudentNameStore>({});
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [subjectName, setSubjectName] = useState('Informatika');
  const [sheetUrl, setSheetUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [selectedStudentForSummary, setSelectedStudentForSummary] = useState<number | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [startDay, setStartDay] = useState(1);
  const [endDay, setEndDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attendanceRef = useRef(attendanceData);
  const namesRef = useRef(studentNames);

  useEffect(() => { attendanceRef.current = attendanceData; }, [attendanceData]);
  useEffect(() => { namesRef.current = studentNames; }, [studentNames]);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedNames = localStorage.getItem(NAME_STORAGE_KEY);
    const savedTP = localStorage.getItem(ACADEMIC_YEAR_KEY);
    const savedSubject = localStorage.getItem(SUBJECT_NAME_KEY);
    const savedSheetUrl = localStorage.getItem(SHEET_URL_KEY);
    const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);

    if (savedData) setAttendanceData(JSON.parse(savedData));
    if (savedNames) setStudentNames(JSON.parse(savedNames));
    if (savedTP) setAcademicYear(savedTP);
    if (savedSubject) setSubjectName(savedSubject);
    if (savedSheetUrl) setSheetUrl(savedSheetUrl);
    if (savedLogo) setLogoUrl(savedLogo);
  }, []);

  // AUTO-SAVE SETIAP 5 MENIT
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attendanceRef.current));
      localStorage.setItem(NAME_STORAGE_KEY, JSON.stringify(namesRef.current));
      setToast({ message: 'Data tersimpan otomatis', type: 'info' });
    }, 300000); // 5 menit
    return () => clearInterval(interval);
  }, []);

  const saveData = useCallback((newData: GlobalStore, newNames: StudentNameStore) => {
    setLoading(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    localStorage.setItem(NAME_STORAGE_KEY, JSON.stringify(newNames));
    setTimeout(() => setLoading(false), 300);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { alert("Ukuran logo maksimal 1MB."); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoUrl(base64);
        localStorage.setItem(LOGO_STORAGE_KEY, base64);
        setToast({ message: "Logo diperbarui", type: "success" });
      };
      reader.readAsDataURL(file);
    }
  };

  const currentClassData = useMemo(() => attendanceData[selectedClass]?.[selectedMonth] || {}, [attendanceData, selectedClass, selectedMonth]);
  const currentClassNames = useMemo(() => studentNames[selectedClass] || {}, [studentNames, selectedClass]);
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  useEffect(() => {
    setEndDay(daysInMonth);
  }, [daysInMonth]);

  const filteredStudentIds = useMemo(() => {
    const ids = Array.from({ length: STUDENT_COUNT }, (_, i) => i + 1);
    if (!searchTerm.trim()) return ids;
    const term = searchTerm.toLowerCase();
    return ids.filter(id => (currentClassNames[id] || '').toLowerCase().includes(term) || id.toString().includes(term));
  }, [searchTerm, currentClassNames]);

  const isSunday = (day: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, day).getDay() === 0;
  };

  const getStudentStats = (studentId: number) => {
    const row = currentClassData[studentId] || {};
    let h = 0, a = 0, i = 0, s = 0;
    Object.values(row).forEach(v => {
      if (v === AttendanceStatus.HADIR) h++;
      else if (v === AttendanceStatus.ALPA) a++;
      else if (v === AttendanceStatus.IZIN) i++;
      else if (v === AttendanceStatus.SAKIT) s++;
    });
    return { h, a, i, s };
  };

  const handleExportCSV = () => {
    const students = Object.entries(currentClassNames).filter(([_, n]) => (n as string).trim() !== '');
    if (students.length === 0) { setToast({ message: 'Isi nama siswa dulu!', type: 'info' }); return; }
    let csv = `No,Nama Siswa,Hadir,Izin,Sakit,Alpa\n`;
    students.forEach(([id, name]) => {
      const stats = getStudentStats(parseInt(id));
      csv += `${id},"${name}",${stats.h},${stats.i},${stats.s},${stats.a}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Absensi_Kls_${selectedClass}_${selectedMonth}.csv`;
    a.click();
    setToast({ message: 'CSV berhasil diunduh', type: 'success' });
  };

  const handleSendToSheet = async () => {
    if (!sheetUrl) { 
      setToast({ message: 'Webhook URL belum diisi!', type: 'info' });
      setIsEditingSettings(true); 
      return; 
    }
    
    const students = Object.entries(currentClassNames).filter(([_, n]) => (n as string).trim() !== '');
    if (students.length === 0) {
      setToast({ message: 'Tidak ada data siswa untuk dikirim!', type: 'info' });
      return;
    }

    setExporting(true);
    setToast({ message: 'Sedang mengirim data...', type: 'info' });

    const exportRows = students.map(([id, name]) => {
      const sId = parseInt(id);
      const s = getStudentStats(sId);
      const row: any = { 'No': sId, 'Nama': name, 'H': s.h, 'I': s.i, 'S': s.s, 'A': s.a };
      for (let d = 1; d <= daysInMonth; d++) {
        row[`Tgl ${d}`] = currentClassData[sId]?.[d] || '-';
      }
      return row;
    });

    const payload = {
      kelas: selectedClass,
      bulan: ATTENDANCE_PERIODS.find(m => m.value === selectedMonth)?.label,
      tp: academicYear,
      mapel: subjectName,
      timestamp: new Date().toLocaleString(),
      data: exportRows
    };

    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      setToast({ message: 'Data berhasil dikirim ke Sheets!', type: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Gagal mengirim data. Cek koneksi.', type: 'info' });
    } finally {
      setExporting(false);
    }
  };

  const applyHadirRange = () => {
    const newData = { ...attendanceData };
    if (!newData[selectedClass]) newData[selectedClass] = {};
    if (!newData[selectedClass][selectedMonth]) newData[selectedClass][selectedMonth] = {};
    
    const s = Math.min(startDay, endDay);
    const e = Math.max(startDay, endDay);
    
    const studentIdsWithName = Object.entries(currentClassNames)
      .filter(([_, n]) => (n as string).trim() !== '')
      .map(([id]) => parseInt(id));

    if (studentIdsWithName.length === 0) {
      setToast({ message: 'Isi nama siswa dulu!', type: 'info' });
      return;
    }

    studentIdsWithName.forEach(id => {
      if (!newData[selectedClass][selectedMonth][id]) newData[selectedClass][selectedMonth][id] = {};
      for (let d = s; d <= e; d++) {
        if (!isSunday(d)) {
          newData[selectedClass][selectedMonth][id][d] = AttendanceStatus.HADIR;
        }
      }
    });

    setAttendanceData(newData);
    saveData(newData, studentNames);
    setShowRangeModal(false);
    setToast({ message: 'Hadir masal diterapkan', type: 'success' });
  };

  const handleStudentNameClick = (studentId: number) => {
    const name = currentClassNames[studentId] || '';
    if (name.trim()) {
      setSelectedStudentForSummary(studentId);
    }
  };

  const handleDeleteStudent = () => {
    if (studentToDelete === null) return;
    
    const newNames = { ...studentNames };
    const newData = { ...attendanceData };
    
    if (newNames[selectedClass]) {
      delete newNames[selectedClass][studentToDelete];
    }
    
    if (newData[selectedClass]?.[selectedMonth]) {
      delete newData[selectedClass][selectedMonth][studentToDelete];
    }
    
    setStudentNames(newNames);
    setAttendanceData(newData);
    saveData(newData, newNames);
    setStudentToDelete(null);
    setToast({ message: 'Siswa berhasil dihapus', type: 'success' });
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
      
      <header className="bg-emerald-700 text-white pt-8 pb-16 px-4 shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center space-x-0 md:space-x-6 mb-4">
            <img src={logoUrl} className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-0 bg-white/20 rounded-full p-1.5 border-2 border-white/30 cursor-pointer shadow-2xl active:scale-95 transition-all" onClick={() => setIsEditingSettings(true)} />
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase leading-tight">SMP NEGERI 15 TAKENGON</h1>
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4 mt-1 opacity-90">
                <p className="text-xs md:text-base font-bold text-emerald-100">Mata Pelajaran: <span className="text-white">{subjectName}</span></p>
                <div className="hidden md:block w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                <p className="text-xs md:text-base font-bold text-emerald-100">TP: <span className="text-white">{academicYear}</span></p>
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-3 w-full max-w-xl px-2 mt-8">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="flex-1 bg-emerald-800/60 backdrop-blur-md border border-emerald-500/30 rounded-2xl px-4 py-4 text-xs md:text-sm font-black text-white outline-none focus:ring-4 focus:ring-emerald-400/50 transition-all cursor-pointer">
              {CLASSES.map(c => <option key={c} value={c} className="bg-emerald-900">KELAS {c}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="flex-1 bg-emerald-800/60 backdrop-blur-md border border-emerald-500/30 rounded-2xl px-4 py-4 text-xs md:text-sm font-black text-white outline-none focus:ring-4 focus:ring-emerald-400/50 transition-all cursor-pointer">
              {ATTENDANCE_PERIODS.map(m => <option key={m.value} value={m.value} className="bg-emerald-900">{m.label.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto -mt-10 relative z-20 px-3 space-y-4">
        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <SummaryCard label="Siswa Aktif" value={Object.values(currentClassNames).filter(n => (n as string).trim() !== '').length.toString()} icon="users" color="bg-white" />
          <SummaryCard label="Total Hadir" value={useMemo(() => { let h = 0; Object.values(currentClassData).forEach(r => Object.values(r).forEach(v => { if (v === 'H') h++; })); return h; }, [currentClassData]).toString()} icon="check" color="bg-emerald-50" textColor="text-emerald-700" />
          <SummaryCard label="Izin" value={useMemo(() => { let i = 0; Object.values(currentClassData).forEach(r => Object.values(r).forEach(v => { if (v === 'I') i++; })); return i; }, [currentClassData]).toString()} icon="info" color="bg-indigo-50" textColor="text-indigo-700" />
          <SummaryCard label="Sakit" value={useMemo(() => { let s = 0; Object.values(currentClassData).forEach(r => Object.values(r).forEach(v => { if (v === 'S') s++; })); return s; }, [currentClassData]).toString()} icon="activity" color="bg-yellow-50" textColor="text-yellow-700" />
          <SummaryCard label="Alpa" value={useMemo(() => { let a = 0; Object.values(currentClassData).forEach(r => Object.values(r).forEach(v => { if (v === 'A') a++; })); return a; }, [currentClassData]).toString()} icon="x" color="bg-rose-50" textColor="text-rose-700" />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-3xl border shadow-sm gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => setIsEditingSettings(true)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
            <div className="relative flex-1">
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari Nama/No..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-400 outline-none transition-all" />
                <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <button onClick={() => setShowRangeModal(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-[10px] md:text-xs font-black shadow-lg transition-all active:scale-95">HADIR MASAL</button>
            <button onClick={handleExportCSV} className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] md:text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                CSV
            </button>
            <button onClick={handleSendToSheet} disabled={exporting} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-[10px] md:text-xs font-black shadow-lg disabled:opacity-50 transition-all active:scale-95">KIRIM KE SHEET</button>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[1000px]">
              <thead className="bg-slate-50 sticky top-0 z-20">
                <tr className="border-b">
                  <th className="w-12 p-3 text-[10px] font-black text-center sticky left-0 bg-slate-50 border-r text-slate-400 uppercase tracking-widest">No</th>
                  <th className="w-52 p-3 text-[10px] font-black text-left sticky left-12 bg-slate-50 border-r shadow-sm text-slate-400 uppercase tracking-widest">Nama Siswa</th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <th key={d} className={`w-9 p-1 text-[10px] font-black text-center border-r ${isSunday(d) ? 'bg-rose-100 text-rose-600' : 'text-slate-500'}`}>{d}</th>
                  ))}
                  <th className="w-10 p-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border-l">H</th>
                  <th className="w-10 p-1 text-[10px] font-black text-indigo-700 bg-indigo-50 border-l">I</th>
                  <th className="w-10 p-1 text-[10px] font-black text-yellow-700 bg-yellow-50 border-l">S</th>
                  <th className="w-10 p-1 text-[10px] font-black text-rose-700 bg-rose-50 border-l">A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudentIds.map(id => {
                  const s = getStudentStats(id);
                  const name = currentClassNames[id] || '';
                  return (
                    <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-[10px] text-center font-black text-slate-300 sticky left-0 bg-white border-r">{id}</td>
                      <td className="p-1 sticky left-12 bg-white border-r shadow-sm">
                        <div className="relative group flex items-center">
                          <input type="text" value={name} onChange={(e) => {
                            const newNames = { ...studentNames };
                            if (!newNames[selectedClass]) newNames[selectedClass] = {};
                            newNames[selectedClass][id] = e.target.value;
                            setStudentNames(newNames);
                            saveData(attendanceData, newNames);
                          }} placeholder="NAMA..." className="w-full px-3 py-2 text-[11px] font-bold bg-transparent border-none outline-none focus:bg-emerald-50/30 rounded-lg pr-12" />
                          {name.trim() && (
                            <div className="absolute right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStudentNameClick(id)}
                                className="p-1 text-slate-300 hover:text-emerald-500 transition-colors"
                                title="Detail"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              </button>
                              <button 
                                onClick={() => setStudentToDelete(id)}
                                className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                title="Hapus Siswa"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                        const sun = isSunday(d);
                        const status = currentClassData[id]?.[d] || AttendanceStatus.EMPTY;
                        return (
                          <td key={d} className={`p-0 border-r ${sun ? 'bg-rose-50/30' : ''}`}>
                            {!sun && (
                              <select value={status} onChange={(e) => {
                                const newData = { ...attendanceData };
                                if (!newData[selectedClass]) newData[selectedClass] = {};
                                if (!newData[selectedClass][selectedMonth]) newData[selectedClass][selectedMonth] = {};
                                if (!newData[selectedClass][selectedMonth][id]) newData[selectedClass][selectedMonth][id] = {};
                                newData[selectedClass][selectedMonth][id][d] = e.target.value as AttendanceStatus;
                                setAttendanceData(newData);
                                saveData(newData, studentNames);
                              }} className={`w-full h-11 text-center text-xs font-black appearance-none bg-transparent outline-none cursor-pointer transition-all
                                ${status === 'H' ? 'text-emerald-600 bg-emerald-100/30' : status === 'A' ? 'text-rose-600 bg-rose-100/30' : status === 'I' ? 'text-indigo-600' : status === 'S' ? 'text-yellow-600' : 'text-slate-200'}`}>
                                <option value="">-</option>
                                <option value="H">H</option>
                                <option value="I">I</option>
                                <option value="S">S</option>
                                <option value="A">A</option>
                              </select>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-[10px] font-black text-center bg-emerald-50/40 text-emerald-700 border-l">{s.h}</td>
                      <td className="text-[10px] font-black text-center bg-indigo-50/40 text-indigo-700 border-l">{s.i}</td>
                      <td className="text-[10px] font-black text-center bg-yellow-50/40 text-yellow-700 border-l">{s.s}</td>
                      <td className="text-[10px] font-black text-center bg-rose-50/40 text-rose-700 border-l">{s.a}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL HADIR MASAL */}
      {showRangeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden animate-bounce-in">
            <div className="bg-emerald-600 p-5 text-white text-center font-bold uppercase tracking-widest text-sm">Set Hadir Masal</div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-[11px] text-slate-500 font-medium">Isi status 'Hadir' secara otomatis untuk rentang tanggal:</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-1">DARI TGL</label>
                  <input type="number" min="1" max={daysInMonth} value={startDay} onChange={(e) => setStartDay(parseInt(e.target.value))} className="w-full border-2 border-slate-100 rounded-xl p-3 text-center font-black text-lg focus:border-emerald-400 outline-none" />
                </div>
                <div className="text-slate-300 font-black">─</div>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-1">SAMPAI TGL</label>
                  <input type="number" min="1" max={daysInMonth} value={endDay} onChange={(e) => setEndDay(parseInt(e.target.value))} className="w-full border-2 border-slate-100 rounded-xl p-3 text-center font-black text-lg focus:border-emerald-400 outline-none" />
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button onClick={applyHadirRange} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all">TERAPKAN</button>
                <button onClick={() => setShowRangeModal(false)} className="w-full py-2 text-slate-400 text-[10px] font-bold">BATALKAN</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL RINGKASAN SISWA */}
      {selectedStudentForSummary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in">
            <div className="bg-slate-800 p-8 text-white relative">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
                  {currentClassNames[selectedStudentForSummary]?.[0] || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight leading-tight">{currentClassNames[selectedStudentForSummary]}</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1 uppercase">NO. ABSEN {selectedStudentForSummary} • KELAS {selectedClass}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentForSummary(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-700 rounded-full text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-8">
              <div className="flex flex-col space-y-2 mb-6">
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Ringkasan Bulan {ATTENDANCE_PERIODS.find(m => m.value === selectedMonth)?.label.split(' ')[0]}</p>
                <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const s = getStudentStats(selectedStudentForSummary);
                  return (
                    <>
                      <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Hadir</span>
                        <span className="text-3xl font-black text-emerald-700">{s.h}</span>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Izin</span>
                        <span className="text-3xl font-black text-indigo-700">{s.i}</span>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-3xl border border-yellow-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Sakit</span>
                        <span className="text-3xl font-black text-yellow-700">{s.s}</span>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Alpa</span>
                        <span className="text-3xl font-black text-rose-700">{s.a}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedStudentForSummary(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Tutup Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS SISWA */}
      {studentToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xs overflow-hidden animate-bounce-in">
            <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
                <div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Hapus Siswa?</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-bold mt-2">
                      Menghapus <span className="text-slate-800 font-black">"{currentClassNames[studentToDelete]}"</span> akan membersihkan nama dan data absensi siswa ini di kelas {selectedClass} untuk bulan {ATTENDANCE_PERIODS.find(m => m.value === selectedMonth)?.label.split(' ')[0]}.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <button onClick={handleDeleteStudent} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 active:scale-95 transition-all text-xs uppercase tracking-widest">Hapus Sekarang</button>
                    <button onClick={() => setStudentToDelete(null)} className="w-full py-3 text-slate-400 text-[10px] font-black hover:text-slate-600">Batalkan</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN */}
      {isEditingSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
            <div className="bg-emerald-600 p-8 text-white text-center relative">
              <h3 className="text-xl font-black uppercase tracking-wider">Identitas Sekolah</h3>
              <p className="text-xs text-emerald-100 font-bold mt-1">Sesuaikan informasi dasar aplikasi</p>
              <button onClick={() => setIsEditingSettings(false)} className="absolute top-6 right-6 p-2 hover:bg-emerald-500 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
                <div className="flex items-center space-x-6 pb-2">
                    <div className="relative group">
                        <img src={logoUrl} className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-inner bg-slate-50 object-contain p-1" />
                        <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full border shadow-md text-emerald-600 hover:text-emerald-700 active:scale-90 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </button>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Upload Logo</label>
                        <p className="text-[10px] text-slate-500 font-medium italic">Klik ikon kamera untuk ganti logo sekolah.</p>
                    </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mata Pelajaran</label>
                    <input type="text" value={subjectName} onChange={(e) => { setSubjectName(e.target.value); localStorage.setItem(SUBJECT_NAME_KEY, e.target.value); }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-emerald-400/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tahun Pelajaran</label>
                    <input type="text" value={academicYear} onChange={(e) => { setAcademicYear(e.target.value); localStorage.setItem(ACADEMIC_YEAR_KEY, e.target.value); }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-emerald-400/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Google Sheet Webhook URL</label>
                    <input type="text" value={sheetUrl} placeholder="https://script.google.com/macros/s/..." onChange={(e) => { setSheetUrl(e.target.value); localStorage.setItem(SHEET_URL_KEY, e.target.value); }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[10px] font-mono focus:ring-4 focus:ring-emerald-400/20 outline-none transition-all" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={() => setIsEditingSettings(false)} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98]">SIMPAN PERUBAHAN</button>
                  <button onClick={() => setShowResetConfirm(true)} className="w-full py-2 text-rose-500 text-[10px] font-black hover:bg-rose-50 rounded-xl transition-all uppercase tracking-widest">Reset Data Aplikasi</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET KUSTOM */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xs overflow-hidden animate-bounce-in">
            <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hapus Semua?</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-bold mt-2">Seluruh data absensi dan nama siswa akan dihapus dari perangkat ini secara permanen.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-5 bg-rose-600 text-white rounded-3xl font-black shadow-xl shadow-rose-200 active:scale-95 transition-all">YA, HAPUS PERMANEN</button>
                    <button onClick={() => setShowResetConfirm(false)} className="w-full py-3 text-slate-400 text-xs font-black hover:text-slate-600">BATALKAN</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <footer className="mt-12 mb-8 text-center px-4">
         <p className="text-slate-300 text-[10px] font-black tracking-widest uppercase">© {new Date().getFullYear()} SMP NEGERI 15 TAKENGON</p>
         <p className="text-slate-400 text-[9px] mt-1 font-bold italic opacity-60">Sistem Absensi Digital Informatika</p>
      </footer>
    </div>
  );
};

export default App;
