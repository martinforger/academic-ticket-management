import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

// ─── Internal Types ──────────────────────────────────────────────

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
  students: string[]; // list of CEDULAs
}

interface SubjectOption {
  key: string; // SUBJECT + CRSE_NUMB
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

interface TransferProposal {
  studentCedula: string;
  studentName: string;
  depth: number; // 1 = simple, 2 = double, etc.
  moves: SingleMove[]; // first move is always the target subject
}

// ─── Helpers ─────────────────────────────────────────────────────

function parseTimeSlot(value: string): { start: number; end: number } | null {
  if (!value || !value.trim()) return null;
  // Format: "  13:00_14:50 P/A"
  const match = value.trim().match(/(\d{1,2}):(\d{2})_(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const start = parseInt(match[1]) * 60 + parseInt(match[2]);
  const end = parseInt(match[3]) * 60 + parseInt(match[4]);
  return { start, end };
}

function extractSchedule(row: ScheduleRow): TimeSlot[] {
  const days: { value: string; label: string }[] = [
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
    if (parsed) {
      slots.push({ day: d.label, startMinutes: parsed.start, endMinutes: parsed.end });
    }
  }
  return slots;
}

function slotsOverlap(a: TimeSlot[], b: TimeSlot[]): boolean {
  for (const sa of a) {
    for (const sb of b) {
      if (sa.day === sb.day && sa.startMinutes < sb.endMinutes && sb.startMinutes < sa.endMinutes) {
        return true;
      }
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

// ─── Component ───────────────────────────────────────────────────

type Step = 'upload' | 'select' | 'results';

interface AuditResult {
  studentCedula: string;
  studentName: string;
  move: SingleMove;
  status: 'ok' | 'missing' | 'wrong_section';
  actualCrn?: string;
}

export function SectionBalancing() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState<TransferProposal[]>([]);
  const [analysisRun, setAnalysisRun] = useState(false);

  // Audit State
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [auditRun, setAuditRun] = useState(false);
  const [auditFileName, setAuditFileName] = useState('');

  // ─── CSV Parsing ─────────────────────────────────────────────

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

        // Validate required columns
        const first = Object.fromEntries(
          Object.entries(raw[0]).map(([k, v]) => [k.trim(), v])
        );
        const required = ['CRN', 'CEDULA', 'NOMBRE', 'MATERIA', 'SUBJECT', 'NUMERO_CURSO'];
        const missing = required.filter(c => !(c in first));
        if (missing.length > 0) {
          throw new Error(`Faltan columnas: ${missing.join(', ')}`);
        }

        const rows: EnrollmentRow[] = raw.map(r => {
          const row = Object.fromEntries(
            Object.entries(r).map(([k, v]) => [k.trim(), v])
          );
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
        setError(err.message || 'Error al procesar el archivo de inscripción.');
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

        const first = Object.fromEntries(
          Object.entries(raw[0]).map(([k, v]) => [k.trim(), v])
        );
        const required = ['SSBSECT_CRN', 'SSBSECT_SUBJ_CODE', 'SSBSECT_CRSE_NUMB', 'COURSE_NAME', 'SECCION', 'INSCRITOS', 'CUPO', 'PROFESOR', 'LUNES'];
        const missing = required.filter(c => !(c in first));
        if (missing.length > 0) {
          throw new Error(`Faltan columnas: ${missing.join(', ')}`);
        }

        const rows: ScheduleRow[] = raw.map(r => {
          const row = Object.fromEntries(
            Object.entries(r).map(([k, v]) => [k.trim(), v])
          );
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
        setError(err.message || 'Error al procesar el archivo de horarios.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // ─── Derived Data ────────────────────────────────────────────

  // Build a map of CRN → schedule from scheduleData
  const crnScheduleMap = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    for (const row of scheduleData) {
      map.set(row.SSBSECT_CRN, extractSchedule(row));
    }
    return map;
  }, [scheduleData]);

  // Build a map of CRN → ScheduleRow for lookups
  const crnRowMap = useMemo(() => {
    const map = new Map<string, ScheduleRow>();
    for (const row of scheduleData) {
      map.set(row.SSBSECT_CRN, row);
    }
    return map;
  }, [scheduleData]);

  // Build a map of CRN → subject key (SUBJ-CRSE)
  const crnSubjectKeyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of scheduleData) {
      map.set(row.SSBSECT_CRN, `${row.SSBSECT_SUBJ_CODE}-${row.SSBSECT_CRSE_NUMB}`);
    }
    return map;
  }, [scheduleData]);

  // Build map: subject key → list of CRNs (campus 001 only)
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

  // Build list of subjects that have 2+ sections on campus 001
  const subjectOptions = useMemo<SubjectOption[]>(() => {
    const subjectMap = new Map<string, { name: string; sections: Set<string> }>();
    for (const row of scheduleData) {
      if (row.CAMPUS !== '001') continue;
      const key = `${row.SSBSECT_SUBJ_CODE}-${row.SSBSECT_CRSE_NUMB}`;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, { name: row.COURSE_NAME, sections: new Set() });
      }
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

  // Build section info for selected subject (campus 001 only)
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
    }));
  }, [selectedSubject, scheduleData, enrollmentData]);

  // ─── Analysis Engine (Multi-Depth) ───────────────────────────

  const MAX_DEPTH = 4;

  const runAnalysis = () => {
    if (sectionInfos.length < 2) return;

    const totalStudents = sectionInfos.reduce((sum, s) => sum + s.enrolledCount, 0);
    const target = Math.round(totalStudents / sectionInfos.length);

    const overSections = sectionInfos.filter(s => s.enrolledCount > target);
    const underSections = sectionInfos.filter(s => s.enrolledCount < target);

    if (overSections.length === 0 || underSections.length === 0) {
      setProposals([]);
      setAnalysisRun(true);
      return;
    }

    // Build student enrollment map: cedula → set of CRNs
    const studentCRNs = new Map<string, Set<string>>();
    for (const e of enrollmentData) {
      if (!studentCRNs.has(e.CEDULA)) studentCRNs.set(e.CEDULA, new Set());
      studentCRNs.get(e.CEDULA)!.add(e.CRN);
    }

    const studentNames = new Map<string, string>();
    for (const e of enrollmentData) {
      if (!studentNames.has(e.CEDULA)) studentNames.set(e.CEDULA, e.NOMBRE);
    }

    // Helper: get a student's full schedule as TimeSlot[], excluding certain CRNs
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

    // Helper: build a SingleMove from CRN info
    const buildMove = (subjectKey: string, fromCrn: string, toCrn: string): SingleMove => {
      const fromRow = crnRowMap.get(fromCrn);
      const toRow = crnRowMap.get(toCrn);
      const subjectName = fromRow?.COURSE_NAME ?? toRow?.COURSE_NAME ?? subjectKey;
      return {
        subjectName,
        fromCrn,
        fromSection: fromRow ? cleanStr(fromRow.SECCION) : '?',
        fromProfessor: fromRow?.PROFESOR ?? '?',
        toCrn,
        toSection: toRow ? cleanStr(toRow.SECCION) : '?',
        toProfessor: toRow?.PROFESOR ?? '?',
      };
    };

    /**
     * Recursive search: try to move a student to targetCrn for the target subject.
     * `swappedCRNs` tracks which CRNs have already been swapped (to avoid cycles).
     * Returns a list of SingleMove if feasible, null otherwise.
     */
    const findMoves = (
      cedula: string,
      currentCrn: string, // CRN the student currently has for the subject being moved
      targetCrn: string,  // CRN we want to move the student to
      subjectKey: string,
      swappedCRNs: Set<string>,
      depth: number
    ): SingleMove[] | null => {
      if (depth > MAX_DEPTH) return null;

      const targetSlots = crnScheduleMap.get(targetCrn) ?? [];

      // Get student's schedule excluding the CRN being moved AND any already-swapped CRNs
      const excludeSet = new Set([currentCrn, ...swappedCRNs]);
      const otherSlots = getStudentSlots(cedula, excludeSet);

      // Find which of the student's other CRNs conflict with the target
      const studentAllCRNs = studentCRNs.get(cedula) ?? new Set();
      const conflictingCRNs: string[] = [];
      for (const crn of studentAllCRNs) {
        if (excludeSet.has(crn)) continue;
        const slots = crnScheduleMap.get(crn) ?? [];
        if (slotsOverlap(slots, targetSlots)) {
          conflictingCRNs.push(crn);
        }
      }

      // No conflicts — direct move works
      if (conflictingCRNs.length === 0 && !slotsOverlap(otherSlots, targetSlots)) {
        return [buildMove(subjectKey, currentCrn, targetCrn)];
      }

      // If we're at max depth, we can't resolve further
      if (depth >= MAX_DEPTH || conflictingCRNs.length === 0) return null;

      // Try to resolve each conflict by swapping that subject's section
      const additionalMoves: SingleMove[] = [];
      const newSwapped = new Set(swappedCRNs);
      newSwapped.add(currentCrn);

      for (const conflictCrn of conflictingCRNs) {
        const conflictSubjectKey = crnSubjectKeyMap.get(conflictCrn);
        if (!conflictSubjectKey) return null;

        // Find alternative sections of the conflicting subject (campus 001)
        const altCRNs = subjectSectionsMap.get(conflictSubjectKey) ?? [];
        let resolved = false;

        for (const altCrn of altCRNs) {
          if (altCrn === conflictCrn) continue;
          if (newSwapped.has(altCrn)) continue;

          // Recursively check if this alternative works
          const subMoves = findMoves(
            cedula,
            conflictCrn,
            altCrn,
            conflictSubjectKey,
            newSwapped,
            depth + 1
          );

          if (subMoves) {
            additionalMoves.push(...subMoves);
            newSwapped.add(conflictCrn);
            resolved = true;
            break;
          }
        }

        if (!resolved) return null;
      }

      // Verify the primary move now works with all swaps applied
      const finalExclude = new Set([currentCrn, ...newSwapped]);
      const finalSlots = getStudentSlots(cedula, finalExclude);
      // Add slots from all new target CRNs of additional moves
      for (const m of additionalMoves) {
        const s = crnScheduleMap.get(m.toCrn);
        if (s) finalSlots.push(...s);
      }

      if (slotsOverlap(finalSlots, targetSlots)) return null;

      return [buildMove(subjectKey, currentCrn, targetCrn), ...additionalMoves];
    };

    const allProposals: TransferProposal[] = [];

    for (const overSection of overSections) {
      for (const studentCedula of overSection.students) {
        for (const underSection of underSections) {
          // Check under section hasn't exceeded its capacity with previous proposals
          const currentUnderCount = underSection.enrolledCount +
            allProposals.filter(p => p.moves[0]?.toCrn === underSection.crn).length -
            allProposals.filter(p => p.moves[0]?.fromCrn === underSection.crn).length;
          if (currentUnderCount >= underSection.capacity) continue;

          const moves = findMoves(
            studentCedula,
            overSection.crn,
            underSection.crn,
            selectedSubject,
            new Set(),
            1
          );

          if (moves) {
            allProposals.push({
              studentCedula,
              studentName: studentNames.get(studentCedula) ?? 'Desconocido',
              depth: moves.length,
              moves,
            });
            break;
          }
        }
      }
    }

    // Sort: simple moves first, then by depth
    allProposals.sort((a, b) => a.depth - b.depth);
    setProposals(allProposals);
    setAnalysisRun(true);
  };

  // ─── Navigation Helpers ──────────────────────────────────────

  const canProceedToSelect = enrollmentData.length > 0 && scheduleData.length > 0;

  const handleReset = () => {
    setEnrollmentData([]);
    setScheduleData([]);
    setEnrollmentFileName('');
    setScheduleFileName('');
    setSelectedSubject('');
    setSubjectSearch('');
    setProposals([]);
    setAnalysisRun(false);
    setAuditResults([]);
    setAuditRun(false);
    setAuditFileName('');
    setStep('upload');
    setError('');
  };

  // ─── Export Proposals ────────────────────────────────────────

  const exportProposals = () => {
    if (proposals.length === 0) return;
    const subjectName = subjectOptions.find(s => s.key === selectedSubject)?.name ?? selectedSubject;

    // Flatten all moves into rows
    const rows: Record<string, string | number>[] = [];
    for (const p of proposals) {
      for (let mi = 0; mi < p.moves.length; mi++) {
        const m = p.moves[mi];
        rows.push({
          'Estudiante': p.studentName,
          'Cédula': p.studentCedula,
          'Tipo': mi === 0 ? 'Principal' : `Auxiliar +${mi}`,
          'Profundidad': p.depth,
          'Asignatura': m.subjectName,
          'NRC Origen': m.fromCrn,
          'Sección Origen': m.fromSection,
          'Profesor Origen': m.fromProfessor,
          'NRC Destino': m.toCrn,
          'Sección Destino': m.toSection,
          'Profesor Destino': m.toProfessor,
        });
      }
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Propuestas');
    XLSX.writeFile(wb, `Balanceo_${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // ─── Audit Verification ──────────────────────────────────────

  const runAudit = (file: File) => {
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

        // Parse enrollment rows
        const newEnrollment = raw.map(r => {
          const row = Object.fromEntries(
            Object.entries(r).map(([k, v]) => [k.trim(), v])
          );
          return {
            CRN: cleanStr(row['CRN']),
            CEDULA: cleanStr(row['CEDULA']),
          };
        });

        // Build: cedula → set of CRNs in the new file
        const newStudentCRNs = new Map<string, Set<string>>();
        for (const e of newEnrollment) {
          if (!newStudentCRNs.has(e.CEDULA)) newStudentCRNs.set(e.CEDULA, new Set());
          newStudentCRNs.get(e.CEDULA)!.add(e.CRN);
        }

        // Check each proposal's moves
        const results: AuditResult[] = [];
        for (const p of proposals) {
          for (const m of p.moves) {
            const studentCRNs = newStudentCRNs.get(p.studentCedula) ?? new Set();
            const hasTarget = studentCRNs.has(m.toCrn);
            const hasSource = studentCRNs.has(m.fromCrn);

            let status: AuditResult['status'];
            if (hasTarget && !hasSource) {
              status = 'ok'; // Moved correctly
            } else if (hasSource && !hasTarget) {
              status = 'missing'; // Never moved
            } else {
              status = 'wrong_section'; // Something unexpected
            }

            results.push({
              studentCedula: p.studentCedula,
              studentName: p.studentName,
              move: m,
              status,
              actualCrn: hasTarget ? m.toCrn : hasSource ? m.fromCrn : undefined,
            });
          }
        }

        setAuditResults(results);
        setAuditRun(true);
        setAuditFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error al procesar el archivo de auditoría.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // ─── Role Guard ──────────────────────────────────────────────

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

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      {/* Header */}
      <header className="px-8 py-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">balance</span>
          Balanceo de Secciones
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Analiza y propone movimientos de estudiantes para equilibrar las secciones de una asignatura</p>
      </header>

      <main className="flex-1 p-8">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8 max-w-3xl mx-auto">
          {[
            { id: 'upload' as Step, label: 'Cargar Archivos', icon: 'upload_file' },
            { id: 'select' as Step, label: 'Seleccionar Asignatura', icon: 'school' },
            { id: 'results' as Step, label: 'Resultados', icon: 'analytics' },
          ].map((s, i) => {
            const isActive = step === s.id;
            const stepIdx = ['upload', 'select', 'results'].indexOf(step);
            const thisIdx = i;
            const isDone = thisIdx < stepIdx;
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
          <div className="max-w-3xl mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* ───── STEP 1: Upload ───── */}
        {step === 'upload' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Enrollment File */}
            <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed transition-colors p-8 ${
              enrollmentFileName ? 'border-emerald-300 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="text-center">
                <span className={`material-symbols-outlined text-4xl mb-3 ${
                  enrollmentFileName ? 'text-emerald-500' : 'text-slate-400'
                }`}>{enrollmentFileName ? 'check_circle' : 'description'}</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Detalle de Inscripción por Alumno-Escuela
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  Archivo CSV con las materias inscritas por cada alumno (separado por punto y coma)
                </p>
                {enrollmentFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">attach_file</span>
                      {enrollmentFileName}
                    </span>
                    <span className="text-xs text-slate-400">{enrollmentData.length.toLocaleString()} registros</span>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-lg">upload</span>
                    Seleccionar archivo
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) parseEnrollmentCSV(file);
                        e.target.value = '';
                      }}
                      disabled={loading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Schedule File */}
            <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed transition-colors p-8 ${
              scheduleFileName ? 'border-emerald-300 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="text-center">
                <span className={`material-symbols-outlined text-4xl mb-3 ${
                  scheduleFileName ? 'text-emerald-500' : 'text-slate-400'
                }`}>{scheduleFileName ? 'check_circle' : 'schedule'}</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Horarios por Programa
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  Archivo CSV con los horarios de las secciones (separado por punto y coma)
                </p>
                {scheduleFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">attach_file</span>
                      {scheduleFileName}
                    </span>
                    <span className="text-xs text-slate-400">{scheduleData.length.toLocaleString()} registros</span>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-lg">upload</span>
                    Seleccionar archivo
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) parseScheduleCSV(file);
                        e.target.value = '';
                      }}
                      disabled={loading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleReset}
                disabled={!enrollmentFileName && !scheduleFileName}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm align-middle mr-1">restart_alt</span>
                Reiniciar
              </button>
              <button
                onClick={() => setStep('select')}
                disabled={!canProceedToSelect}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continuar
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ───── STEP 2: Subject Selection ───── */}
        {step === 'select' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Seleccionar Asignatura</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                Solo se muestran asignaturas con 2 o más secciones ({subjectOptions.length} asignaturas disponibles)
              </p>

              {/* Search */}
              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Buscar asignatura..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Subject List */}
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {filteredSubjects.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">No se encontraron asignaturas</div>
                ) : (
                  filteredSubjects.map(s => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setSelectedSubject(s.key);
                        setProposals([]);
                        setAnalysisRun(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        selectedSubject === s.key ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${selectedSubject === s.key ? 'text-primary' : 'text-slate-800 dark:text-white'}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.key}</p>
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                        {s.sectionCount} secciones
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Section Overview (if subject is selected) */}
            {selectedSubject && sectionInfos.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                  Distribución Actual — {subjectOptions.find(s => s.key === selectedSubject)?.name}
                </h3>

                {/* Visual bar chart */}
                <div className="space-y-3 mb-6">
                  {(() => {
                    const maxCount = Math.max(...sectionInfos.map(s => Math.max(s.enrolledCount, s.capacity)));
                    return sectionInfos.map(s => {
                      const pct = maxCount > 0 ? (s.enrolledCount / maxCount) * 100 : 0;
                      const capPct = maxCount > 0 ? (s.capacity / maxCount) * 100 : 0;
                      return (
                        <div key={s.crn} className="flex items-center gap-3">
                          <div className="w-24 text-right">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sec {s.section}</span>
                          </div>
                          <div className="flex-1 relative h-7 bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 border-r-2 border-dashed border-slate-400/60 dark:border-slate-500/60"
                              style={{ width: `${capPct}%` }}
                              title={`Cupo: ${s.capacity}`}
                            />
                            <div
                              className={`h-full rounded-md transition-all ${
                                s.enrolledCount > s.capacity ? 'bg-red-500/80' :
                                pct > 80 ? 'bg-amber-500/70' : 'bg-primary/70'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white mix-blend-difference">
                              {s.enrolledCount} / {s.capacity}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Detailed table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <th className="text-left px-3 py-2 text-slate-500 font-medium">CRN</th>
                        <th className="text-left px-3 py-2 text-slate-500 font-medium">Sección</th>
                        <th className="text-left px-3 py-2 text-slate-500 font-medium">Profesor</th>
                        <th className="text-center px-3 py-2 text-slate-500 font-medium">Inscritos</th>
                        <th className="text-center px-3 py-2 text-slate-500 font-medium">Cupo</th>
                        <th className="text-left px-3 py-2 text-slate-500 font-medium">Horario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {sectionInfos.map(s => (
                        <tr key={s.crn} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                          <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">{s.crn}</td>
                          <td className="px-3 py-2 text-slate-800 dark:text-white font-medium">{s.section}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.professor}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                              s.enrolledCount > s.capacity ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                              s.enrolledCount >= s.capacity * 0.9 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                              'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            }`}>
                              {s.enrolledCount}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-300">{s.capacity}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{formatSchedule(s.schedule)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Atrás
              </button>
              <button
                onClick={() => {
                  runAnalysis();
                  setStep('results');
                }}
                disabled={!selectedSubject}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">analytics</span>
                Analizar Balanceo
              </button>
            </div>
          </div>
        )}

        {/* ───── STEP 3: Results ───── */}
        {step === 'results' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Summary */}
            {analysisRun && (
              <>
                {/* Current vs Ideal */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">insights</span>
                    Análisis de Balanceo — {subjectOptions.find(s => s.key === selectedSubject)?.name}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{sectionInfos.length}</p>
                      <p className="text-xs text-slate-500 mt-1">Secciones</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {sectionInfos.reduce((s, i) => s + i.enrolledCount, 0)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Total Estudiantes</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(sectionInfos.reduce((s, i) => s + i.enrolledCount, 0) / sectionInfos.length)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Meta por Sección</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className={`text-2xl font-bold ${proposals.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {proposals.length}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Movimientos Propuestos</p>
                    </div>
                  </div>

                  {/* Distribution comparison */}
                  <div className="space-y-3">
                    {(() => {
                      const totalStudents = sectionInfos.reduce((s, i) => s + i.enrolledCount, 0);
                      const target = Math.round(totalStudents / sectionInfos.length);
                      const maxVal = Math.max(...sectionInfos.map(s => Math.max(s.enrolledCount, s.capacity)));

                      return sectionInfos.map(s => {
                        const movesOut = proposals.filter(p => p.moves[0]?.fromCrn === s.crn).length;
                        const movesIn = proposals.filter(p => p.moves[0]?.toCrn === s.crn).length;
                        const projected = s.enrolledCount - movesOut + movesIn;
                        const currentPct = maxVal > 0 ? (s.enrolledCount / maxVal) * 100 : 0;
                        const projectedPct = maxVal > 0 ? (projected / maxVal) * 100 : 0;

                        return (
                          <div key={s.crn} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                Sec {s.section} <span className="text-slate-400 font-normal">({s.professor})</span>
                              </span>
                              <span className="text-slate-500">
                                {s.enrolledCount} → <span className={`font-bold ${Math.abs(projected - target) <= 1 ? 'text-emerald-600' : 'text-amber-500'}`}>{projected}</span>
                                {movesOut > 0 && <span className="text-red-400 ml-1">-{movesOut}</span>}
                                {movesIn > 0 && <span className="text-emerald-400 ml-1">+{movesIn}</span>}
                              </span>
                            </div>
                            <div className="relative h-5 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-slate-300/50 dark:bg-slate-500/30 rounded transition-all"
                                style={{ width: `${currentPct}%` }}
                              />
                              <div
                                className={`absolute inset-y-0 left-0 rounded transition-all ${
                                  Math.abs(projected - target) <= 1 ? 'bg-emerald-500/70' : 'bg-amber-500/60'
                                }`}
                                style={{ width: `${projectedPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300/50 dark:bg-slate-500/30 inline-block" /> Actual</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/70 inline-block" /> Proyectado</span>
                    </div>
                  </div>
                </div>

                {/* Proposals grouped by depth */}
                {proposals.length > 0 ? (
                  <>
                    {/* Group proposals by depth */}
                    {Array.from(new Set(proposals.map(p => p.depth))).sort((a, b) => a - b).map(depth => {
                      const depthProposals = proposals.filter(p => p.depth === depth);
                      const depthLabel = depth === 1 ? 'Movimiento Simple' : `Movimiento con ${depth} cambio${depth > 1 ? 's' : ''}`;
                      const depthDesc = depth === 1
                        ? 'Solo se cambia la sección de la asignatura seleccionada.'
                        : `Se requiere cambiar ${depth - 1} asignatura${depth > 2 ? 's' : ''} adicional${depth > 2 ? 'es' : ''} para evitar conflictos de horario.`;

                      return (
                        <div key={depth} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                            <span className={`material-symbols-outlined ${depth === 1 ? 'text-emerald-500' : depth === 2 ? 'text-amber-500' : 'text-orange-500'}`}>
                              {depth === 1 ? 'swap_horiz' : 'swap_calls'}
                            </span>
                            {depthLabel}
                            <span className="text-sm font-normal text-slate-400 ml-1">({depthProposals.length} estudiante{depthProposals.length > 1 ? 's' : ''})</span>
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{depthDesc}</p>

                          <div className="space-y-4">
                            {depthProposals.map((p, i) => (
                              <div key={`${p.studentCedula}-${i}`} className="border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                                {/* Student header */}
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{p.studentName}</span>
                                  <span className="font-mono text-xs text-slate-400">{p.studentCedula}</span>
                                </div>

                                {/* Moves list */}
                                <div className="space-y-2 ml-9">
                                  {p.moves.map((m, mi) => (
                                    <div key={mi} className="flex items-center gap-2 text-xs flex-wrap">
                                      <span className={`px-1.5 py-0.5 rounded font-bold ${mi === 0 ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                        {mi === 0 ? '★' : `+${mi}`}
                                      </span>
                                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[180px]" title={m.subjectName}>{m.subjectName}</span>
                                      <span className="font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded font-bold">{m.fromCrn}</span>
                                      <span className="text-slate-400 text-[10px]">Sec {m.fromSection} ({m.fromProfessor})</span>
                                      <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
                                      <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded font-bold">{m.toCrn}</span>
                                      <span className="text-slate-400 text-[10px]">Sec {m.toSection} ({m.toProfessor})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-emerald-400 mb-3">verified</span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Secciones Balanceadas</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Las secciones ya están equilibradas o no se encontraron movimientos viables sin conflictos de horario.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Export + Audit section (only when proposals exist) */}
            {analysisRun && proposals.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">fact_check</span>
                  Exportar y Auditar
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Export button */}
                  <button
                    onClick={exportProposals}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Exportar Propuestas (Excel)
                  </button>

                  {/* Audit upload */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    {auditFileName ? 'Cargar nuevo archivo' : 'Auditar con nuevo archivo'}
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) runAudit(file);
                        e.target.value = '';
                      }}
                      disabled={loading}
                    />
                  </label>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                  <span className="material-symbols-outlined text-xs align-middle mr-1">info</span>
                  Para auditar, sube un nuevo archivo de &quot;Detalle de Inscripción&quot; actualizado después de aplicar los cambios. El sistema comparará los NRC de cada estudiante para verificar si se realizaron los movimientos.
                </p>

                {/* Audit Results */}
                {auditRun && auditResults.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span className="text-slate-600 dark:text-slate-300">Aplicado: {auditResults.filter(r => r.status === 'ok').length}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                        <span className="text-slate-600 dark:text-slate-300">No aplicado: {auditResults.filter(r => r.status === 'missing').length}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span className="text-slate-600 dark:text-slate-300">Discrepancia: {auditResults.filter(r => r.status === 'wrong_section').length}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 mb-2">
                      Archivo auditado: <span className="font-medium text-slate-600 dark:text-slate-300">{auditFileName}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50">
                            <th className="text-left px-3 py-2 text-slate-500 font-medium">Estado</th>
                            <th className="text-left px-3 py-2 text-slate-500 font-medium">Estudiante</th>
                            <th className="text-left px-3 py-2 text-slate-500 font-medium">Cédula</th>
                            <th className="text-left px-3 py-2 text-slate-500 font-medium">Asignatura</th>
                            <th className="text-left px-3 py-2 text-slate-500 font-medium">NRC Esperado</th>
                            <th className="text-left px-3 py-2 text-slate-500 font-medium">Resultado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {auditResults.map((r, i) => (
                            <tr key={i} className={`${
                              r.status === 'ok' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' :
                              r.status === 'missing' ? 'bg-red-50/50 dark:bg-red-900/10' :
                              'bg-amber-50/50 dark:bg-amber-900/10'
                            }`}>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                  r.status === 'ok' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                                  r.status === 'missing' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                                  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                                }`}>
                                  <span className="material-symbols-outlined text-xs">
                                    {r.status === 'ok' ? 'check_circle' : r.status === 'missing' ? 'cancel' : 'warning'}
                                  </span>
                                  {r.status === 'ok' ? 'Aplicado' : r.status === 'missing' ? 'No aplicado' : 'Discrepancia'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-800 dark:text-white font-medium text-xs">{r.studentName}</td>
                              <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.studentCedula}</td>
                              <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={r.move.subjectName}>{r.move.subjectName}</td>
                              <td className="px-3 py-2">
                                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                  {r.move.toCrn}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {r.status === 'ok' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">Inscrito en NRC {r.move.toCrn} ✓</span>
                                ) : r.status === 'missing' ? (
                                  <span className="text-red-600 dark:text-red-400">Sigue en NRC {r.move.fromCrn}</span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400">No encontrado en ningún NRC esperado</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Cambiar Asignatura
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">restart_alt</span>
                Nuevo Análisis
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
