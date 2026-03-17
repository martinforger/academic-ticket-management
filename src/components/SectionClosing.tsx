import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────

interface EnrollmentRow {
  CRN: string;
  CEDULA: string;
  NOMBRE: string;
  MATERIA: string;
  SUBJECT: string;
  NUMERO_CURSO: string;
}

interface ScheduleRow {
  SSBSECT_CRN: string;
  SSBSECT_SUBJ_CODE: string;
  SSBSECT_CRSE_NUMB: string;
  COURSE_NAME: string;
  SECCION: string;
  INSCRITOS: string;
  CUPO: string;
  PROFESOR: string;
  CAMPUS: string;
  LUNES: string;
  MARTES: string;
  MIERCOLES: string;
  JUEVES: string;
  VIERNES: string;
  SABADO: string;
  DOMINGO: string;
}

interface TimeSlot {
  day: string;
  startMinutes: number;
  endMinutes: number;
}

interface SectionInfo {
  crn: string;
  section: string;
  enrolledCount: number;
  capacity: number;
  professor: string;
  schedule: TimeSlot[];
  students: string[];
}

interface SubjectOption {
  key: string;
  name: string;
  sectionCount: number;
}

interface SingleMove {
  subjectName: string;
  fromCrn: string;
  fromSection: string;
  fromProfessor: string;
  toCrn: string;
  toSection: string;
  toProfessor: string;
}

interface ClosureProposal {
  studentCedula: string;
  studentName: string;
  depth: number;
  moves: SingleMove[];
  status: 'solved' | 'unsolved';
}

// ─── Helpers ──────────────────────────────────────────────────────

function parseTimeSlot(value: string): { start: number; end: number } | null {
  if (!value || !value.trim()) return null;
  const match = value.trim().match(/(\d{1,2}):(\d{2})_(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return {
    start: parseInt(match[1]) * 60 + parseInt(match[2]),
    end: parseInt(match[3]) * 60 + parseInt(match[4]),
  };
}

function extractSchedule(row: ScheduleRow): TimeSlot[] {
  const days = [
    { value: row.LUNES, label: 'Lunes' },
    { value: row.MARTES, label: 'Martes' },
    { value: row.MIERCOLES, label: 'Miércoles' },
    { value: row.JUEVES, label: 'Jueves' },
    { value: row.VIERNES, label: 'Viernes' },
    { value: row.SABADO, label: 'Sábado' },
    { value: row.DOMINGO, label: 'Domingo' },
  ];
  const slots: TimeSlot[] = [];
  for (const d of days) {
    const parsed = parseTimeSlot(d.value);
    if (parsed) slots.push({ day: d.label, startMinutes: parsed.start, endMinutes: parsed.end });
  }
  return slots;
}

function slotsOverlap(a: TimeSlot[], b: TimeSlot[]): boolean {
  for (const sa of a) {
    for (const sb of b) {
      if (sa.day === sb.day && sa.startMinutes < sb.endMinutes && sb.startMinutes < sa.endMinutes) return true;
    }
  }
  return false;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatSchedule(slots: TimeSlot[]): string {
  if (slots.length === 0) return 'Sin horario';
  return slots.map(s => `${s.day} ${formatTime(s.startMinutes)}-${formatTime(s.endMinutes)}`).join(', ');
}

function cleanStr(v: unknown): string {
  return String(v ?? '').replace(/^'|'$/g, '').trim();
}

type Step = 'upload' | 'select' | 'results';

// ─── Component ────────────────────────────────────────────────────

export function SectionClosing() {
  const { profile } = useAuth();

  // CSV Data
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentRow[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>([]);
  const [enrollmentFileName, setEnrollmentFileName] = useState('');
  const [scheduleFileName, setScheduleFileName] = useState('');

  // UI State
  const [step, setStep] = useState<Step>('upload');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [sectionToClose, setSectionToClose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState<ClosureProposal[]>([]);
  const [analysisRun, setAnalysisRun] = useState(false);

  // ─── CSV Parsing ──────────────────────────────────────────────

  const parseEnrollmentCSV = (file: File) => {
    setLoading(true);
    setError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error('No se pudo leer el archivo.');
        const wb = XLSX.read(text, { type: 'string', FS: ';' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        if (raw.length === 0) throw new Error('El archivo está vacío.');

        const first = Object.fromEntries(Object.entries(raw[0]).map(([k, v]) => [k.trim(), v]));
        const required = ['CRN', 'CEDULA', 'NOMBRE', 'MATERIA', 'SUBJECT', 'NUMERO_CURSO'];
        const missing = required.filter(c => !(c in first));
        if (missing.length > 0) throw new Error(`Faltan columnas: ${missing.join(', ')}`);

        const rows: EnrollmentRow[] = raw.map(r => {
          const row = Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), v]));
          return {
            CRN: cleanStr(row['CRN']),
            CEDULA: cleanStr(row['CEDULA']),
            NOMBRE: cleanStr(row['NOMBRE']),
            MATERIA: cleanStr(row['MATERIA']),
            SUBJECT: cleanStr(row['SUBJECT']),
            NUMERO_CURSO: cleanStr(row['NUMERO_CURSO']),
          };
        });
        setEnrollmentData(rows);
        setEnrollmentFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error al procesar el archivo.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const parseScheduleCSV = (file: File) => {
    setLoading(true);
    setError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error('No se pudo leer el archivo.');
        const wb = XLSX.read(text, { type: 'string', FS: ';' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        if (raw.length === 0) throw new Error('El archivo está vacío.');

        const first = Object.fromEntries(Object.entries(raw[0]).map(([k, v]) => [k.trim(), v]));
        const required = ['SSBSECT_CRN', 'SSBSECT_SUBJ_CODE', 'SSBSECT_CRSE_NUMB', 'COURSE_NAME', 'SECCION', 'INSCRITOS', 'CUPO', 'PROFESOR', 'LUNES'];
        const missing = required.filter(c => !(c in first));
        if (missing.length > 0) throw new Error(`Faltan columnas: ${missing.join(', ')}`);

        const rows: ScheduleRow[] = raw.map(r => {
          const row = Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), v]));
          return {
            SSBSECT_CRN: cleanStr(row['SSBSECT_CRN']),
            SSBSECT_SUBJ_CODE: cleanStr(row['SSBSECT_SUBJ_CODE']),
            SSBSECT_CRSE_NUMB: cleanStr(row['SSBSECT_CRSE_NUMB']),
            COURSE_NAME: cleanStr(row['COURSE_NAME']),
            SECCION: cleanStr(row['SECCION']),
            INSCRITOS: cleanStr(row['INSCRITOS']),
            CUPO: cleanStr(row['CUPO']),
            PROFESOR: cleanStr(row['PROFESOR']),
            CAMPUS: cleanStr(row['CAMPUS']),
            LUNES: String(row['LUNES'] ?? ''),
            MARTES: String(row['MARTES'] ?? ''),
            MIERCOLES: String(row['MIERCOLES'] ?? ''),
            JUEVES: String(row['JUEVES'] ?? ''),
            VIERNES: String(row['VIERNES'] ?? ''),
            SABADO: String(row['SABADO'] ?? ''),
            DOMINGO: String(row['DOMINGO'] ?? ''),
          };
        });
        setScheduleData(rows);
        setScheduleFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error al procesar el archivo.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // ─── Derived Data ─────────────────────────────────────────────

  const crnScheduleMap = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    for (const row of scheduleData) map.set(row.SSBSECT_CRN, extractSchedule(row));
    return map;
  }, [scheduleData]);

  const crnRowMap = useMemo(() => {
    const map = new Map<string, ScheduleRow>();
    for (const row of scheduleData) map.set(row.SSBSECT_CRN, row);
    return map;
  }, [scheduleData]);

  const crnSubjectKeyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of scheduleData) map.set(row.SSBSECT_CRN, `${row.SSBSECT_SUBJ_CODE}-${row.SSBSECT_CRSE_NUMB}`);
    return map;
  }, [scheduleData]);

  const subjectSectionsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const row of scheduleData) {
      if (row.CAMPUS !== '001') continue;
      const key = `${row.SSBSECT_SUBJ_CODE}-${row.SSBSECT_CRSE_NUMB}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row.SSBSECT_CRN);
    }
    return map;
  }, [scheduleData]);

  // Subjects with 2+ sections on campus 001
  const subjectOptions = useMemo<SubjectOption[]>(() => {
    const subjectMap = new Map<string, { name: string; sections: Set<string> }>();
    for (const row of scheduleData) {
      if (row.CAMPUS !== '001') continue;
      const key = `${row.SSBSECT_SUBJ_CODE}-${row.SSBSECT_CRSE_NUMB}`;
      if (!subjectMap.has(key)) subjectMap.set(key, { name: row.COURSE_NAME, sections: new Set() });
      subjectMap.get(key)!.sections.add(row.SSBSECT_CRN);
    }
    return Array.from(subjectMap.entries())
      .filter(([, v]) => v.sections.size >= 2)
      .map(([key, v]) => ({ key, name: v.name, sectionCount: v.sections.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [scheduleData]);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch) return subjectOptions;
    const q = subjectSearch.toLowerCase();
    return subjectOptions.filter(s => s.name.toLowerCase().includes(q) || s.key.toLowerCase().includes(q));
  }, [subjectOptions, subjectSearch]);

  // Section infos for the selected subject
  const sectionInfos = useMemo<SectionInfo[]>(() => {
    if (!selectedSubject) return [];
    const subjectRows = scheduleData.filter(
      r => `${r.SSBSECT_SUBJ_CODE}-${r.SSBSECT_CRSE_NUMB}` === selectedSubject && r.CAMPUS === '001'
    );
    const subjectCRNs = new Set(subjectRows.map(r => r.SSBSECT_CRN));
    const studentsByCRN = new Map<string, string[]>();
    for (const e of enrollmentData) {
      if (subjectCRNs.has(e.CRN)) {
        if (!studentsByCRN.has(e.CRN)) studentsByCRN.set(e.CRN, []);
        studentsByCRN.get(e.CRN)!.push(e.CEDULA);
      }
    }
    return subjectRows.map(row => ({
      crn: row.SSBSECT_CRN,
      section: row.SECCION,
      enrolledCount: studentsByCRN.get(row.SSBSECT_CRN)?.length ?? 0,
      capacity: parseInt(row.CUPO) || 0,
      professor: row.PROFESOR,
      schedule: extractSchedule(row),
      students: studentsByCRN.get(row.SSBSECT_CRN) ?? [],
    })).sort((a, b) => a.enrolledCount - b.enrolledCount);
  }, [selectedSubject, scheduleData, enrollmentData]);

  // Auto-select section with fewest students when subject changes
  const defaultCloseSection = useMemo(() => {
    if (sectionInfos.length === 0) return '';
    return sectionInfos[0].crn; // already sorted by enrolledCount ascending
  }, [sectionInfos]);

  // Track actual selection (default if user hasn't changed)
  const activeSectionToClose = sectionToClose || defaultCloseSection;

  // ─── Closure Analysis Engine ──────────────────────────────────

  const MAX_DEPTH = 4;

  const runAnalysis = () => {
    const closingSection = sectionInfos.find(s => s.crn === activeSectionToClose);
    if (!closingSection || sectionInfos.length < 2) return;

    const remainingSections = sectionInfos.filter(s => s.crn !== activeSectionToClose);

    // Build student enrollment map
    const studentCRNs = new Map<string, Set<string>>();
    for (const e of enrollmentData) {
      if (!studentCRNs.has(e.CEDULA)) studentCRNs.set(e.CEDULA, new Set());
      studentCRNs.get(e.CEDULA)!.add(e.CRN);
    }

    const studentNames = new Map<string, string>();
    for (const e of enrollmentData) {
      if (!studentNames.has(e.CEDULA)) studentNames.set(e.CEDULA, e.NOMBRE);
    }

    const getStudentSlots = (cedula: string, excludeCRNs: Set<string>): TimeSlot[] => {
      const slots: TimeSlot[] = [];
      const crns = studentCRNs.get(cedula);
      if (!crns) return slots;
      for (const crn of crns) {
        if (excludeCRNs.has(crn)) continue;
        const s = crnScheduleMap.get(crn);
        if (s) slots.push(...s);
      }
      return slots;
    };

    const buildMove = (subjectKey: string, fromCrn: string, toCrn: string): SingleMove => {
      const fromRow = crnRowMap.get(fromCrn);
      const toRow = crnRowMap.get(toCrn);
      return {
        subjectName: fromRow?.COURSE_NAME ?? toRow?.COURSE_NAME ?? subjectKey,
        fromCrn,
        fromSection: fromRow ? cleanStr(fromRow.SECCION) : '?',
        fromProfessor: fromRow?.PROFESOR ?? '?',
        toCrn,
        toSection: toRow ? cleanStr(toRow.SECCION) : '?',
        toProfessor: toRow?.PROFESOR ?? '?',
      };
    };

    const findMoves = (
      cedula: string,
      currentCrn: string,
      targetCrn: string,
      subjectKey: string,
      swappedCRNs: Set<string>,
      depth: number
    ): SingleMove[] | null => {
      if (depth > MAX_DEPTH) return null;

      const targetSlots = crnScheduleMap.get(targetCrn) ?? [];
      const excludeSet = new Set([currentCrn, ...swappedCRNs]);
      const otherSlots = getStudentSlots(cedula, excludeSet);

      const studentAllCRNs = studentCRNs.get(cedula) ?? new Set();
      const conflictingCRNs: string[] = [];
      for (const crn of studentAllCRNs) {
        if (excludeSet.has(crn)) continue;
        const slots = crnScheduleMap.get(crn) ?? [];
        if (slotsOverlap(slots, targetSlots)) conflictingCRNs.push(crn);
      }

      if (conflictingCRNs.length === 0 && !slotsOverlap(otherSlots, targetSlots)) {
        return [buildMove(subjectKey, currentCrn, targetCrn)];
      }

      if (depth >= MAX_DEPTH || conflictingCRNs.length === 0) return null;

      const additionalMoves: SingleMove[] = [];
      const newSwapped = new Set(swappedCRNs);
      newSwapped.add(currentCrn);

      for (const conflictCrn of conflictingCRNs) {
        const conflictSubjectKey = crnSubjectKeyMap.get(conflictCrn);
        if (!conflictSubjectKey) return null;

        const altCRNs = subjectSectionsMap.get(conflictSubjectKey) ?? [];
        let resolved = false;

        for (const altCrn of altCRNs) {
          if (altCrn === conflictCrn) continue;
          if (newSwapped.has(altCrn)) continue;

          const subMoves = findMoves(cedula, conflictCrn, altCrn, conflictSubjectKey, newSwapped, depth + 1);
          if (subMoves) {
            additionalMoves.push(...subMoves);
            newSwapped.add(conflictCrn);
            resolved = true;
            break;
          }
        }
        if (!resolved) return null;
      }

      // Verify the primary move now works
      const finalExclude = new Set([currentCrn, ...newSwapped]);
      const finalSlots = getStudentSlots(cedula, finalExclude);
      for (const m of additionalMoves) {
        const s = crnScheduleMap.get(m.toCrn);
        if (s) finalSlots.push(...s);
      }
      if (slotsOverlap(finalSlots, targetSlots)) return null;

      return [buildMove(subjectKey, currentCrn, targetCrn), ...additionalMoves];
    };

    // For each student in the closing section, find a destination
    const allProposals: ClosureProposal[] = [];

    // Track how many students we're adding to each remaining section
    const addedCount = new Map<string, number>();
    for (const s of remainingSections) addedCount.set(s.crn, 0);

    for (const studentCedula of closingSection.students) {
      let bestMoves: SingleMove[] | null = null;

      // Try remaining sections, prefer those with more available space
      const sortedRemaining = [...remainingSections].sort((a, b) => {
        const availA = a.capacity - a.enrolledCount - (addedCount.get(a.crn) ?? 0);
        const availB = b.capacity - b.enrolledCount - (addedCount.get(b.crn) ?? 0);
        return availB - availA; // most space first
      });

      for (const targetSection of sortedRemaining) {
        const moves = findMoves(
          studentCedula,
          closingSection.crn,
          targetSection.crn,
          selectedSubject,
          new Set(),
          1
        );
        if (moves) {
          if (!bestMoves || moves.length < bestMoves.length) {
            bestMoves = moves;
            if (moves.length === 1) break; // optimal — simple move
          }
        }
      }

      if (bestMoves) {
        allProposals.push({
          studentCedula,
          studentName: studentNames.get(studentCedula) ?? 'Desconocido',
          depth: bestMoves.length,
          moves: bestMoves,
          status: 'solved',
        });
        // Track the destination section
        const destCrn = bestMoves[0].toCrn;
        addedCount.set(destCrn, (addedCount.get(destCrn) ?? 0) + 1);
      } else {
        allProposals.push({
          studentCedula,
          studentName: studentNames.get(studentCedula) ?? 'Desconocido',
          depth: 0,
          moves: [],
          status: 'unsolved',
        });
      }
    }

    allProposals.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'unsolved' ? 1 : -1;
      return a.depth - b.depth;
    });

    setProposals(allProposals);
    setAnalysisRun(true);
    setStep('results');
  };

  // ─── Stats ────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = proposals.length;
    const solved = proposals.filter(p => p.status === 'solved').length;
    const unsolved = proposals.filter(p => p.status === 'unsolved').length;
    const multiMove = proposals.filter(p => p.depth > 1).length;
    return { total, solved, unsolved, multiMove };
  }, [proposals]);

  // ─── Export ───────────────────────────────────────────────────

  const exportProposals = () => {
    if (proposals.length === 0) return;
    const subjectName = subjectOptions.find(s => s.key === selectedSubject)?.name ?? selectedSubject;
    const closingInfo = sectionInfos.find(s => s.crn === activeSectionToClose);

    const rows: Record<string, string | number>[] = [];
    for (const p of proposals) {
      if (p.status === 'unsolved') {
        rows.push({
          'Estudiante': p.studentName,
          'Cédula': p.studentCedula,
          'Estado': 'SIN SOLUCIÓN',
          'Tipo Movimiento': '',
          'Asignatura': subjectName,
          'NRC Origen': closingInfo?.crn ?? '',
          'Sección Origen': closingInfo?.section ?? '',
          'NRC Destino': '',
          'Sección Destino': '',
          'Profesor Destino': '',
        });
        continue;
      }
      for (let mi = 0; mi < p.moves.length; mi++) {
        const m = p.moves[mi];
        rows.push({
          'Estudiante': p.studentName,
          'Cédula': p.studentCedula,
          'Estado': 'Resuelto',
          'Tipo Movimiento': mi === 0 ? 'Principal' : `Auxiliar +${mi}`,
          'Asignatura': m.subjectName,
          'NRC Origen': m.fromCrn,
          'Sección Origen': m.fromSection,
          'NRC Destino': m.toCrn,
          'Sección Destino': m.toSection,
          'Profesor Destino': m.toProfessor,
        });
      }
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 35 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
      { wch: 40 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cierre de Sección');
    XLSX.writeFile(wb, `Cierre_${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_Sec${closingInfo?.section ?? ''}.xlsx`);
  };

  // ─── Navigation ───────────────────────────────────────────────

  const canProceedToSelect = enrollmentData.length > 0 && scheduleData.length > 0;

  const handleReset = () => {
    setEnrollmentData([]);
    setScheduleData([]);
    setEnrollmentFileName('');
    setScheduleFileName('');
    setSelectedSubject('');
    setSubjectSearch('');
    setSectionToClose('');
    setProposals([]);
    setAnalysisRun(false);
    setStep('upload');
    setError('');
  };

  // ─── Role Guard ───────────────────────────────────────────────

  if (profile?.role !== 'coordinador' && profile?.role !== 'administrador') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">lock</span>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Acceso Restringido</h2>
          <p className="text-slate-500">Solo coordinadores y administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      {/* Header */}
      <header className="px-8 py-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">cancel</span>
          Cierre de Secciones
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Simula el cierre de una sección y genera las propuestas de reubicación de estudiantes
        </p>
      </header>

      <main className="flex-1 p-8">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8 max-w-4xl mx-auto">
          {([
            { id: 'upload' as Step, label: 'Cargar Archivos', icon: 'upload_file' },
            { id: 'select' as Step, label: 'Seleccionar Sección', icon: 'checklist' },
            { id: 'results' as Step, label: 'Resultados', icon: 'analytics' },
          ]).map((s, i) => {
            const isActive = step === s.id;
            const stepIdx = ['upload', 'select', 'results'].indexOf(step);
            const isDone = i < stepIdx;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-semibold flex-1 ${
                  isActive ? 'bg-primary/10 text-primary border border-primary/30' :
                  isDone ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent'
                }`}>
                  <span className="material-symbols-outlined text-lg">{isDone ? 'check_circle' : s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 2 && <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">chevron_right</span>}
              </div>
            );
          })}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
            <p className="flex-1 text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* ───── STEP 1: Upload ───── */}
        {step === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Enrollment File */}
              <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed transition-colors p-8 ${
                enrollmentFileName ? 'border-emerald-300 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700'
              }`}>
                <div className="text-center">
                  <span className={`material-symbols-outlined text-4xl mb-3 ${enrollmentFileName ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {enrollmentFileName ? 'check_circle' : 'description'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Detalle de Inscripción</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Archivo CSV con inscripciones por alumno</p>
                  {enrollmentFileName ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">attach_file</span>
                        {enrollmentFileName}
                      </span>
                      <span className="text-xs text-slate-400">{enrollmentData.length.toLocaleString()} filas</span>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-lg">upload</span>
                      Seleccionar
                      <input type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) parseEnrollmentCSV(f); e.target.value = ''; }} disabled={loading} />
                    </label>
                  )}
                </div>
              </div>

              {/* Schedule File */}
              <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed transition-colors p-8 ${
                scheduleFileName ? 'border-emerald-300 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700'
              }`}>
                <div className="text-center">
                  <span className={`material-symbols-outlined text-4xl mb-3 ${scheduleFileName ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {scheduleFileName ? 'check_circle' : 'calendar_month'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Horarios de Secciones</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Archivo CSV con horarios y secciones</p>
                  {scheduleFileName ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">attach_file</span>
                        {scheduleFileName}
                      </span>
                      <span className="text-xs text-slate-400">{scheduleData.length.toLocaleString()} filas</span>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-lg">upload</span>
                      Seleccionar
                      <input type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) parseScheduleCSV(f); e.target.value = ''; }} disabled={loading} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button onClick={handleReset} disabled={!enrollmentFileName && !scheduleFileName}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined text-sm align-middle mr-1">restart_alt</span>
                Reiniciar
              </button>
              <button onClick={() => setStep('select')} disabled={!canProceedToSelect}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                Continuar
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ───── STEP 2: Select Subject & Section to Close ───── */}
        {step === 'select' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Subject Search */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">search</span>
                Seleccionar Asignatura
              </h3>
              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredSubjects.map(s => (
                  <button key={s.key}
                    onClick={() => { setSelectedSubject(s.key); setSectionToClose(''); setAnalysisRun(false); setProposals([]); }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                      selectedSubject === s.key
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="text-xs text-slate-400">{s.sectionCount} secciones</span>
                  </button>
                ))}
                {filteredSubjects.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-4">No se encontraron asignaturas con 2+ secciones</p>
                )}
              </div>
            </div>

            {/* Section Selection */}
            {selectedSubject && sectionInfos.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">cancel</span>
                  Seleccionar Sección a Cerrar
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Se preselecciona la sección con menos estudiantes. Puede seleccionar otra.
                </p>
                <div className="space-y-2">
                  {sectionInfos.map(section => {
                    const isSelected = activeSectionToClose === section.crn;
                    return (
                      <button key={section.crn}
                        onClick={() => setSectionToClose(section.crn)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors border ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-red-500' : 'text-slate-400'}`}>
                              {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                            </span>
                            <div>
                              <span className="font-bold text-sm">Sección {section.section}</span>
                              <span className="text-xs text-slate-500 ml-2">(NRC: {section.crn})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono">
                              {section.enrolledCount}/{section.capacity}
                            </span>
                            <span className="text-slate-500 max-w-[200px] truncate">{section.professor}</span>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-400 ml-8">{formatSchedule(section.schedule)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Atrás
              </button>
              <button onClick={runAnalysis} disabled={!selectedSubject || !activeSectionToClose || sectionInfos.length < 2}
                className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">bolt</span>
                Simular Cierre
              </button>
            </div>
          </div>
        )}

        {/* ───── STEP 3: Results ───── */}
        {step === 'results' && analysisRun && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Closing Info */}
            {(() => {
              const closingSection = sectionInfos.find(s => s.crn === activeSectionToClose);
              const subjectName = subjectOptions.find(s => s.key === selectedSubject)?.name ?? selectedSubject;
              return closingSection ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-500 mt-0.5">cancel</span>
                  <div className="text-sm">
                    <p className="font-bold text-red-700 dark:text-red-300">
                      Simulación de cierre: {subjectName} — Sección {closingSection.section}
                    </p>
                    <p className="text-red-600 dark:text-red-400 mt-0.5">
                      Profesor: {closingSection.professor} · {closingSection.enrolledCount} estudiantes a reubicar · Horario: {formatSchedule(closingSection.schedule)}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-lg text-blue-500">group</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">A Reubicar</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-lg text-emerald-500">check_circle</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Reubicados</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{stats.solved}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-lg text-red-500">error</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Sin Solución</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.unsolved}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-lg text-amber-500">swap_horiz</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Multi-Cambio</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.multiMove}</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center gap-3">
              <button onClick={exportProposals} disabled={proposals.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-lg">download</span>
                Exportar Excel
              </button>
              <button onClick={() => { setStep('select'); setAnalysisRun(false); setProposals([]); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Cambiar Sección
              </button>
              <button onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 ml-auto">
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Nueva Simulación
              </button>
            </div>

            {/* Results Table */}
            {proposals.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">group_off</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Sin Estudiantes</h3>
                <p className="text-slate-500 text-sm">La sección seleccionada no tiene estudiantes inscritos.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estudiante</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cédula</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Destino</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cambios Adicionales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {proposals.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-slate-800 dark:text-white font-medium">{p.studentName}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{p.studentCedula}</td>
                          <td className="px-4 py-3">
                            {p.status === 'solved' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                <span className="material-symbols-outlined text-xs">check</span>
                                Reubicado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                <span className="material-symbols-outlined text-xs">error</span>
                                Sin Solución
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {p.moves.length > 0 ? (
                              <div className="text-xs">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  Sec. {p.moves[0].toSection}
                                </span>
                                <span className="text-slate-400 ml-1">(NRC: {p.moves[0].toCrn})</span>
                                <div className="text-slate-500 mt-0.5">{p.moves[0].toProfessor}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {p.moves.length > 1 ? (
                              <div className="space-y-1">
                                {p.moves.slice(1).map((m, mi) => (
                                  <div key={mi} className="text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
                                    <span className="font-semibold text-amber-700 dark:text-amber-300">{m.subjectName}:</span>
                                    <span className="text-amber-600 dark:text-amber-400 ml-1">
                                      Sec. {m.fromSection} → Sec. {m.toSection}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : p.status === 'solved' ? (
                              <span className="text-xs text-slate-400">Movimiento directo</span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Remaining sections summary after closure */}
            {proposals.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
                  Distribución Proyectada Tras el Cierre
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sectionInfos.filter(s => s.crn !== activeSectionToClose).map(section => {
                    const added = proposals.filter(p => p.status === 'solved' && p.moves[0]?.toCrn === section.crn).length;
                    const projected = section.enrolledCount + added;
                    return (
                      <div key={section.crn} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                        <div className="font-bold text-sm text-slate-700 dark:text-slate-200">Sec. {section.section}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{section.professor}</div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-slate-800 dark:text-white">{projected}</span>
                          <span className="text-xs text-slate-400">/ {section.capacity}</span>
                          {added > 0 && (
                            <span className="text-xs text-emerald-500 font-semibold ml-1">(+{added})</span>
                          )}
                        </div>
                        <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${projected > section.capacity ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, (projected / section.capacity) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
