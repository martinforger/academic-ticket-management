import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────

interface EnrollmentRow {
  CEDULA: string;
  NOMBRE: string;
  MATERIA: string;
  CAMPUS: string;
  SUBJECT: string;
  NUMERO_CURSO: string;
}

interface ProjectionRow {
  studentId: string;
  subjectId: string;
  subjectName: string;
  accumulatedCredits: number;
}

interface Discrepancy {
  cedula: string;
  nombre: string;
  materiaInscrita: string;
  tipo: 'obligatoria' | 'electiva_excedente';
  ucAprobadas: number;
}

// Elective placeholder mat_cod values used in projections
const ELECTIVE_PLACEHOLDER_CODES = new Set([
  'FING-ELEC1', // Electiva (Informática) I
  'FING-ELEC2', // Electiva (Informática) II
  'FING-ELEC3', // Electiva (Complementaria)
]);

// ─── Helpers ─────────────────────────────────────────────────────

function cleanStr(v: unknown): string {
  return String(v ?? '').replace(/^"|"$/g, '').trim();
}

/** Build a mat_cod from SUBJECT and NUMERO_CURSO columns of the CSV.
 *  DB format: INFO-02027 (SUBJECT dash 5-digit zero-padded number).
 *  CSV NUMERO_CURSO can be '2027' (needs padding) or 'IILTG' (non-numeric code, keep as-is). */
function buildMatCod(subject: string, numeroCurso: string): string {
  const s = subject.trim();
  const n = numeroCurso.trim();
  // If purely numeric, zero-pad to 5 digits; otherwise keep as-is
  if (/^\d+$/.test(n)) {
    return `${s}-${n.padStart(5, '0')}`;
  }
  return `${s}-${n}`;
}

type Step = 'upload' | 'results';

// ─── Component ───────────────────────────────────────────────────

export function ProjectionAudit() {
  const { profile } = useAuth();

  // CSV Data
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentRow[]>([]);
  const [fileName, setFileName] = useState('');

  // Projections File Data
  const [projections, setProjections] = useState<ProjectionRow[]>([]);
  const [projFileName, setProjFileName] = useState('');
  const [semester, setSemester] = useState('');

  // UI State
  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [analysisRun, setAnalysisRun] = useState(false);

  // Filter/Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'obligatoria' | 'electiva_excedente'>('all');

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
        const required = ['CEDULA', 'NOMBRE', 'MATERIA', 'CAMPUS', 'SUBJECT', 'NUMERO_CURSO'];
        const missing = required.filter(c => !(c in first));
        if (missing.length > 0) {
          throw new Error(`Faltan columnas: ${missing.join(', ')}`);
        }

        const rows: EnrollmentRow[] = raw.map(r => {
          const row = Object.fromEntries(
            Object.entries(r).map(([k, v]) => [k.trim(), v])
          );
          return {
            CEDULA: cleanStr(row['CEDULA']),
            NOMBRE: cleanStr(row['NOMBRE']),
            MATERIA: cleanStr(row['MATERIA']),
            CAMPUS: cleanStr(row['CAMPUS']),
            SUBJECT: cleanStr(row['SUBJECT']),
            NUMERO_CURSO: cleanStr(row['NUMERO_CURSO']),
          };
        });

        setEnrollmentData(rows);
        setFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error al procesar el archivo.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // ─── Projections XLSX Parsing ───────────────────────────────

  const parseProjectionsXLSX = (file: File) => {
    if (!semester.trim()) {
      setError('Debe ingresar el período/semestre antes de cargar el archivo de proyecciones.');
      return;
    }
    setLoading(true);
    setError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        // Look for sheet named "Poblaciones (SEMESTER)"
        const targetSheet = `Poblaciones (${semester.trim()})`;
        const sheetName = wb.SheetNames.find(n => n === targetSheet);
        if (!sheetName) {
          throw new Error(
            `No se encontró la hoja "${targetSheet}" en el archivo.\nHojas disponibles: ${wb.SheetNames.join(', ')}`
          );
        }

        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        if (raw.length === 0) throw new Error('La hoja de poblaciones está vacía.');

        // Validate required columns: studentId, subjectId
        const firstKeys = Object.keys(raw[0]);
        if (!firstKeys.includes('studentId') || !firstKeys.includes('subjectId')) {
          throw new Error(
            `Faltan columnas requeridas (studentId, subjectId).\nColumnas encontradas: ${firstKeys.join(', ')}`
          );
        }

        const rows: ProjectionRow[] = raw.map(r => ({
          studentId: cleanStr(r['studentId' as keyof typeof r]),
          subjectId: cleanStr(r['subjectId' as keyof typeof r]),
          subjectName: cleanStr(r['subjectName' as keyof typeof r]),
          accumulatedCredits: Number(r['accumulatedCredits' as keyof typeof r]) || 0,
        }));

        setProjections(rows);
        setProjFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error al procesar el archivo de proyecciones.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ─── Analysis ────────────────────────────────────────────────

  const runAnalysis = () => {
    setLoading(true);
    setError('');
    try {
      // 1. Build per-student projections: cedula → list of projected subjectId (mat_cod)
      // and studentId → accumulatedCredits
      const studentProjectionCodes = new Map<string, string[]>();
      const studentUCs = new Map<string, number>();
      for (const p of projections) {
        const key = p.studentId;
        if (!studentProjectionCodes.has(key)) {
          studentProjectionCodes.set(key, []);
          studentUCs.set(key, p.accumulatedCredits);
        }
        studentProjectionCodes.get(key)!.push(p.subjectId);
      }

      // 2. Group enrollments by student, only campus 1 and non-practice subjects
      const studentEnrollments = new Map<string, { nombre: string; materias: { materia: string; matCod: string }[] }>();
      for (const row of enrollmentData) {
        if (row.CAMPUS.trim() !== '1') continue;
        // Skip practices — identified by "(Práctica)" in subject name or NUMERO_CURSO starting with P
        if (row.MATERIA.includes('(Práctica)') || row.NUMERO_CURSO.startsWith('P')) continue;

        const matCod = buildMatCod(row.SUBJECT, row.NUMERO_CURSO);
        if (!studentEnrollments.has(row.CEDULA)) {
          studentEnrollments.set(row.CEDULA, { nombre: row.NOMBRE, materias: [] });
        }
        studentEnrollments.get(row.CEDULA)!.materias.push({ materia: row.MATERIA, matCod });
      }

      // 3. Compare using mat_cod
      const results: Discrepancy[] = [];

      for (const [cedula, enrollment] of studentEnrollments) {
        const projectedCodes = studentProjectionCodes.get(cedula) ?? [];

        // Skip students with no projections (e.g. nuevo ingreso)
        if (projectedCodes.length === 0) continue;

        // Count elective slots in projection
        let electiveSlots = 0;
        const nonElectiveProjectedCodes: string[] = [];
        for (const code of projectedCodes) {
          if (ELECTIVE_PLACEHOLDER_CODES.has(code)) {
            electiveSlots++;
          } else {
            nonElectiveProjectedCodes.push(code);
          }
        }

        // Check each enrolled subject
        let electiveUsed = 0;
        const unmatched: { materia: string; tipo: Discrepancy['tipo'] }[] = [];

        for (const { materia, matCod } of enrollment.materias) {
          // Check if it's a direct match in non-elective projections by code
          if (nonElectiveProjectedCodes.includes(matCod)) {
            continue; // matched — OK
          }

          // Check if it's an elective subject — identified by "Electiva" in name
          const isElective = materia.toLowerCase().includes('electiva');
          if (isElective) {
            electiveUsed++;
            if (electiveUsed > electiveSlots) {
              // Exceeds elective slots
              unmatched.push({ materia, tipo: 'electiva_excedente' });
            }
            continue; // covered by elective slot or reported as excess
          }

          // Not in projection at all
          unmatched.push({ materia, tipo: 'obligatoria' });
        }

        for (const um of unmatched) {
          results.push({
            cedula,
            nombre: enrollment.nombre,
            materiaInscrita: um.materia,
            tipo: um.tipo,
            ucAprobadas: studentUCs.get(cedula) ?? 0,
          });
        }
      }

      // Sort by student name, then subject
      results.sort((a, b) => a.nombre.localeCompare(b.nombre) || a.materiaInscrita.localeCompare(b.materiaInscrita));

      setDiscrepancies(results);
      setAnalysisRun(true);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Error durante el análisis.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtered Results ────────────────────────────────────────

  const filteredDiscrepancies = useMemo(() => {
    let filtered = discrepancies;
    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.tipo === filterType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.nombre.toLowerCase().includes(q) ||
        d.cedula.includes(q) ||
        d.materiaInscrita.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [discrepancies, filterType, searchQuery]);

  // Summary stats
  const stats = useMemo(() => {
    const uniqueStudents = new Set(discrepancies.map(d => d.cedula)).size;
    const obligatorias = discrepancies.filter(d => d.tipo === 'obligatoria').length;
    const electivas = discrepancies.filter(d => d.tipo === 'electiva_excedente').length;
    return { uniqueStudents, obligatorias, electivas, total: discrepancies.length };
  }, [discrepancies]);

  // ─── Export ──────────────────────────────────────────────────

  const exportToExcel = () => {
    if (filteredDiscrepancies.length === 0) return;

    const rows = filteredDiscrepancies.map(d => ({
      'Cédula': d.cedula,
      'Nombre': d.nombre,
      'UC Aprobadas': d.ucAprobadas,
      'Materia Inscrita (No Proyectada)': d.materiaInscrita,
      'Tipo': d.tipo === 'obligatoria' ? 'No Proyectada' : 'Electiva Excedente',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-size columns
    ws['!cols'] = [
      { wch: 12 },
      { wch: 40 },
      { wch: 15 },
      { wch: 50 },
      { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');
    XLSX.writeFile(wb, `Auditoria_Proyecciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ─── Reset ───────────────────────────────────────────────────

  const handleReset = () => {
    setEnrollmentData([]);
    setFileName('');
    setProjections([]);
    setProjFileName('');
    setDiscrepancies([]);
    setAnalysisRun(false);
    setStep('upload');
    setError('');
    setSearchQuery('');
    setFilterType('all');
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
          <span className="material-symbols-outlined text-primary">fact_check</span>
          Auditoría de Proyecciones
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Compara las materias inscritas con las proyecciones para detectar discrepancias
        </p>
      </header>

      <main className="flex-1 p-8">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8 max-w-3xl mx-auto">
          {[
            { id: 'upload' as Step, label: 'Cargar Archivos', icon: 'upload_file' },
            { id: 'results' as Step, label: 'Resultados', icon: 'analytics' },
          ].map((s, i) => {
            const isActive = step === s.id;
            const stepIdx = ['upload', 'results'].indexOf(step);
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
                {i < 1 && <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">chevron_right</span>}
              </div>
            );
          })}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium whitespace-pre-line">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* ───── STEP 1: Upload ───── */}
        {step === 'upload' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Semester Input */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Período / Semestre</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                Código del semestre tal como aparece en los archivos (ej: 202625)
              </p>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="202625"
                className="w-full max-w-xs px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Enrollment File */}
            <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed transition-colors p-8 ${
              fileName ? 'border-emerald-300 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="text-center">
                <span className={`material-symbols-outlined text-4xl mb-3 ${
                  fileName ? 'text-emerald-500' : 'text-slate-400'
                }`}>{fileName ? 'check_circle' : 'description'}</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Detalle de Inscripción por Alumno-Escuela
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  Archivo CSV con las materias inscritas por cada alumno (separado por punto y coma)
                </p>
                {fileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">attach_file</span>
                      {fileName}
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

            {/* Projections File */}
            <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed transition-colors p-8 ${
              projFileName ? 'border-emerald-300 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="text-center">
                <span className={`material-symbols-outlined text-4xl mb-3 ${
                  projFileName ? 'text-emerald-500' : 'text-slate-400'
                }`}>{projFileName ? 'check_circle' : 'table_chart'}</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Archivo de Proyecciones
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  Archivo Excel (.xlsx) con la hoja «Poblaciones ({semester || '______'})»
                </p>
                {projFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">attach_file</span>
                      {projFileName}
                    </span>
                    <span className="text-xs text-slate-400">{projections.length.toLocaleString()} proyecciones</span>
                  </div>
                ) : (
                  <label className={`inline-flex items-center gap-2 px-5 py-2.5 font-semibold rounded-lg transition-colors cursor-pointer ${
                    !semester.trim()
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}>
                    <span className="material-symbols-outlined text-lg">upload</span>
                    Seleccionar archivo
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) parseProjectionsXLSX(file);
                        e.target.value = '';
                      }}
                      disabled={loading || !semester.trim()}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">¿Cómo funciona?</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
                  <li>Se comparan las materias inscritas (del CSV) con las proyecciones (del Excel)</li>
                  <li>Las materias prácticas y campus distintos al principal se excluyen</li>
                  <li>Las electivas se validan contra los slots de «Electiva (Informática) I/II» y «Electiva (Complementaria)»</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleReset}
                disabled={!fileName && !projFileName}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm align-middle mr-1">restart_alt</span>
                Reiniciar
              </button>
              <button
                onClick={runAnalysis}
                disabled={enrollmentData.length === 0 || projections.length === 0 || loading}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analizando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">search</span>
                    Analizar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ───── STEP 2: Results ───── */}
        {step === 'results' && analysisRun && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-lg text-amber-500">warning</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Discrepancias</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-lg text-blue-500">group</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Estudiantes</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.uniqueStudents}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-lg text-red-500">book</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">No Proyectadas</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.obligatorias}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-lg text-purple-500">extension</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Electivas Excedentes</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.electivas}</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, cédula o materia..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                <option value="all">Todos los tipos</option>
                <option value="obligatoria">No Proyectadas</option>
                <option value="electiva_excedente">Electivas Excedentes</option>
              </select>

              {/* Export */}
              <button
                onClick={exportToExcel}
                disabled={filteredDiscrepancies.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Exportar Excel
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <span className="material-symbols-outlined text-sm align-middle mr-1">restart_alt</span>
                Nueva Auditoría
              </button>
            </div>

            {/* Results Table */}
            {discrepancies.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-emerald-400 mb-3">check_circle</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">¡Sin Discrepancias!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Todas las materias inscritas coinciden con las proyecciones del semestre.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Mostrando <strong className="text-slate-700 dark:text-slate-200">{filteredDiscrepancies.length}</strong> de {discrepancies.length} discrepancias
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cédula</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">UC Aprob.</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Materia Inscrita</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredDiscrepancies.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{d.cedula}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-white font-medium">{d.nombre}</td>
                          <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded font-medium">
                              {d.ucAprobadas}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{d.materiaInscrita}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              d.tipo === 'obligatoria'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            }`}>
                              <span className="material-symbols-outlined text-xs">
                                {d.tipo === 'obligatoria' ? 'error' : 'extension'}
                              </span>
                              {d.tipo === 'obligatoria' ? 'No Proyectada' : 'Electiva Excedente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contextual Info */}
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">info</span>
              <div>
                <p>Se cargaron <strong>{projections.length}</strong> proyecciones del archivo y <strong>{enrollmentData.length}</strong> registros de inscripción.</p>
                <p className="mt-1">Los registros del CSV con campus distinto a «1» o materias prácticas fueron excluidos del análisis.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
