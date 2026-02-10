
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { OutcomeModal } from './OutcomeModal';
import { SemesterInput } from './SemesterInput';

interface StudentRow {
  campus: string;
  program: string;
  studentId: number;
  studentName: string;
  studentGender: string;
  compliance: string;
  semesterLocation: string;
  averageGradePoints: number;
  accumulatedCredits: number;
  subjectId: string;
  attempts: number;
}

interface ScheduleRow {
  LUNES?: string;
  MARTES?: string;
  MIERCOLES?: string;
  JUEVES?: string;
  VIERNES?: string;
  SABADO?: string;
  DOMINGO?: string;
  SSBSECT_CRN?: string | number;
  SSBSECT_SUBJ_CODE?: string;
  SSBSECT_CRSE_NUMB?: string | number;
  PROFESOR?: string;
  SECCION?: string | number;
  INSCRITOS?: string | number;
  CUPO?: string | number;
}

interface GeneralStudentRow {
  est_cedula: number | string;
  est_genero: string;
  est_nombre: string;
  est_correo: string;
  est_cod_programa: string;
  est_ubic_sem: string;
  est_cumplimiento: string;
  est_creditos_acum: number;
  est_promedio: number;
}

type UploadType = 'proyecciones' | 'horarios' | 'estudiantes';

export function UploadProjections() {
  const { profile } = useAuth();
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [uploadType, setUploadType] = useState<UploadType>('proyecciones');

  // New State
  const [previewData, setPreviewData] = useState<StudentRow[]>([]);
  const [schedulePreview, setSchedulePreview] = useState<ScheduleRow[]>([]);
  const [studentPreview, setStudentPreview] = useState<GeneralStudentRow[]>([]);
  const [studentPreviewTotal, setStudentPreviewTotal] = useState(0);
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));
  const resetPreview = () => {
    setPreviewData([]);
    setSchedulePreview([]);
    setStudentPreview([]);
    setStudentPreviewTotal(0);
    setProgress('');
  };

  const normalizeHeader = (header: string) => {
    return header
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  };

  const parseDecimal = (value: unknown) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    const cleaned = value.trim().replace(/\s/g, '').replace(',', '.');
    const result = Number.parseFloat(cleaned);
    return Number.isFinite(result) ? result : 0;
  };

  const parseInteger = (value: unknown) => {
    if (typeof value === 'number') return Math.trunc(value);
    if (typeof value !== 'string') return '';
    const cleaned = value.trim().replace(/\s/g, '').replace(/\./g, '');
    const result = Number.parseInt(cleaned, 10);
    return Number.isFinite(result) ? result : '';
  };

  if (profile?.role !== 'administrador') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">lock</span>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Acceso Restringido</h2>
          <p className="text-slate-500">Solo administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const handleProjectionsFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!semester || semester.length !== 6) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Semestre Inválido',
        message: 'Por favor ingrese un código de semestre completo (6 dígitos).'
      });
      e.target.value = ''; // Reset input
      return;
    }

    const suffix = semester.slice(4, 6);
    if (!['15', '20', '25', '30'].includes(suffix)) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Semestre Inválido',
        message: 'El código del semestre debe terminar en 15, 20, 25 o 30.'
      });
      e.target.value = '';
      return;
    }

    setLoading(true);
    setProgress('Leyendo archivo...');
    setPreviewData([]); // Reset preview

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const sheetName = `Poblaciones (${semester})`;
        const ws = wb.Sheets[sheetName];

        if (!ws) {
          throw new Error(`No se encontró la hoja "${sheetName}". Verifique el nombre de la hoja en el archivo.`);
        }

        const data = XLSX.utils.sheet_to_json<StudentRow>(ws);

        if (data.length === 0) {
          throw new Error('La hoja está vacía.');
        }

        setPreviewData(data);
        setProgress('');
      } catch (err: any) {
        console.error(err);
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error de Lectura',
          message: err.message || 'Error al procesar el archivo Excel.'
        });
        e.target.value = ''; // Reset input on error
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleScheduleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress('Leyendo archivo...');
    setSchedulePreview([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result;
        const csvText = typeof content === 'string' ? content : '';

        if (!csvText) {
          throw new Error('No se pudo leer el contenido del archivo CSV.');
        }

        const wb = XLSX.read(csvText, { type: 'string', FS: ';' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('El archivo CSV no contiene hojas válidas.');
        }

        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        if (data.length === 0) {
          throw new Error('El archivo CSV está vacío.');
        }

        const cleanedData = data.map((row) => {
          const trimmedEntries = Object.entries(row).map(([key, value]) => [key.trim(), value]);
          return Object.fromEntries(trimmedEntries);
        });

        const requiredColumns = [
          'LUNES',
          'MARTES',
          'MIERCOLES',
          'JUEVES',
          'VIERNES',
          'SABADO',
          'DOMINGO',
          'SSBSECT_CRN',
          'SSBSECT_SUBJ_CODE',
          'SSBSECT_CRSE_NUMB',
          'PROFESOR',
          'SECCION',
          'INSCRITOS',
          'CUPO'
        ];
        const missingColumns = requiredColumns.filter((column) => !(column in cleanedData[0]));
        if (missingColumns.length > 0) {
          throw new Error(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
        }

        setSchedulePreview(cleanedData as ScheduleRow[]);
        setProgress('');
      } catch (err: any) {
        console.error(err);
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error de Lectura',
          message: err.message || 'Error al procesar el archivo CSV.'
        });
        e.target.value = '';
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleStudentsFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress('Leyendo archivo...');
    setStudentPreview([]);
    setStudentPreviewTotal(0);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result;
        const csvText = typeof content === 'string' ? content : '';

        if (!csvText) {
          throw new Error('No se pudo leer el contenido del archivo CSV.');
        }

        const wb = XLSX.read(csvText, { type: 'string', FS: ';' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('El archivo CSV no contiene hojas válidas.');
        }

        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        if (data.length === 0) {
          throw new Error('El archivo CSV está vacío.');
        }

        const cleanedData = data.map((row) => {
          const trimmedEntries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]);
          return Object.fromEntries(trimmedEntries);
        });

        const requiredColumns = [
          'ESTU_CEDULA',
          'ESTU_SEXO',
          'ESTU_NOMBRE',
          'EMAIL_ADDRESS',
          'PROGRAM_CODE',
          'SEMESTRE O ANO',
          'CREDITOS',
          'PROMEDIO'
        ];
        const missingColumns = requiredColumns.filter((column) => !(column in cleanedData[0]));
        if (missingColumns.length > 0) {
          throw new Error(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
        }

        const allowedPrograms = new Set(['LICINFORM001', 'LICINGINF001', 'TSUDIPRSO001']);
        const mappedStudents = cleanedData
          .map((row) => {
            const programCode = String(row['PROGRAM_CODE'] ?? '').trim();
            if (!allowedPrograms.has(programCode)) return null;

            const semesterValue = String(row['SEMESTRE O ANO'] ?? '').trim();
            return {
              est_cedula: parseInteger(row['ESTU_CEDULA']),
              est_genero: String(row['ESTU_SEXO'] ?? '').trim(),
              est_nombre: String(row['ESTU_NOMBRE'] ?? '').trim(),
              est_correo: String(row['EMAIL_ADDRESS'] ?? '').trim(),
              est_cod_programa: programCode,
              est_ubic_sem: semesterValue,
              est_cumplimiento: semesterValue,
              est_creditos_acum: parseDecimal(row['CREDITOS']),
              est_promedio: parseDecimal(row['PROMEDIO'])
            } satisfies GeneralStudentRow;
          })
          .filter((row): row is GeneralStudentRow => Boolean(row && row.est_cedula));

        if (mappedStudents.length === 0) {
          throw new Error('No se encontraron estudiantes válidos para los programas permitidos.');
        }

        setStudentPreviewTotal(cleanedData.length);
        setStudentPreview(mappedStudents);
        setProgress('');
      } catch (err: any) {
        console.error(err);
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error de Lectura',
          message: err.message || 'Error al procesar el archivo CSV.'
        });
        e.target.value = '';
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleProcessUpload = async () => {
    if (uploadType === 'proyecciones') {
      if (previewData.length === 0) return;

      setLoading(true);
      setProgress(`Iniciando carga de ${previewData.length} registros...`);

      try {
        // Note: sending all data in one transaction to ensure atomicity with the specific SP logic
        // which deletes previous data.

        // Note: The stored procedure handles deletion of old data on the first call?
        // Actually, if we batch, we only want to delete ONCE.
        // Limitation: The current SP deletes on EVERY call if we don't handle it.
        // FIX: We should probably change the SP to logic, OR we send chunks.
        // Since the User requested "Vaciar antes de insertar", we must be careful.
        // Strategy: Send data in chunks. 
        // The SP deletes `proyeccion` by semester and ALL strings. 
        // If we call it 10 times for 10 batches, it will delete existing data 10 times.
        // This means Batch 2 will delete Batch 1's work!
        //
        // CRITICAL FIX: The SP needs a mode, or we must use a single large payload if possible, 
        // OR we modify the SP to 'upsert' only and have a separate 'clean' function.
        //
        // Given constraints and previous instructions:
        // I will assume for now we must send ALL data in one go if possible, OR
        // I need to split the "Clean" operation from the "Insert" operation.
        //
        // Refined Plan (executed here in code):
        // 1. Call a new 'clean' function or pass a flag?
        // Since I cannot change SP easily in this file content without context switch, 
        // I will assume the SP `upload_proyecciones` currently WIPES data.
        // So I CANNOT batch calls unless I change the SP to not wipe every time.
        //
        // Wait, passing 5000 rows in JSON might be heavy but doable for Supabase/Postgres.
        // Let's try sending ALL. usage of chunks often implies limits.
        // If the file is huge (20k rows), one request might timeout.
        //
        // Alternative: Modify SP to take a 'clear_first' boolean.
        // Since I just defined the SP, I know it unconditionally deletes.
        // I SHOULD FIX THE SP FIRST if I want batching.
        // BUT, for now, let's try to send it all in one chunk if it's reasonable size (< 5MB json).
        // If 500 rows, it's fine. If 10,000 rows, it might be 2-3MB. perfectly fine for one request.

        const { error: rpcError } = await supabase.rpc('upload_proyecciones', {
          p_semestre: semester,
          p_data: previewData
        });

        if (rpcError) throw rpcError;

        setPreviewData([]); // Clear preview
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Carga Completada',
          message: `Se han procesado record ${previewData.length} registros exitosamente.`
        });

      } catch (err: any) {
        console.error(err);
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error de Carga',
          message: err.message || 'Ocurrió un error al insertar los datos en la base de datos.'
        });
      } finally {
        setLoading(false);
        setProgress('');
      }
      return;
    }

    if (uploadType === 'horarios') {
      if (schedulePreview.length === 0) return;

      setLoading(true);
      setProgress(`Iniciando carga de ${schedulePreview.length} registros...`);

      try {
        const { error: rpcError } = await supabase.rpc('upload_horarios_programa', {
          p_data: schedulePreview
        });

        if (rpcError) throw rpcError;

        setSchedulePreview([]);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Carga Completada',
          message: `Se han procesado ${schedulePreview.length} registros exitosamente.`
        });
      } catch (err: any) {
        console.error(err);
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error de Carga',
          message: err.message || 'Ocurrió un error al insertar los datos en la base de datos.'
        });
      } finally {
        setLoading(false);
        setProgress('');
      }
      return;
    }

    if (studentPreview.length === 0) return;

    setLoading(true);
    setProgress(`Iniciando carga de ${studentPreview.length} registros...`);

    try {
      const batchSize = 500;
      for (let i = 0; i < studentPreview.length; i += batchSize) {
        const batch = studentPreview.slice(i, i + batchSize);
        setProgress(`Cargando registros ${i + 1}-${i + batch.length} de ${studentPreview.length}...`);

        const { error: uploadError } = await supabase.rpc('upload_estudiantes_general', {
          p_data: batch
        });

        if (uploadError) throw uploadError;
      }

      setStudentPreview([]);
      setStudentPreviewTotal(0);
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Carga Completada',
        message: `Se han procesado ${studentPreview.length} registros exitosamente.`
      });
    } catch (err: any) {
      console.error(err);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Carga',
        message: err.message || 'Ocurrió un error al insertar los datos en la base de datos.'
      });
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const previewCount = uploadType === 'proyecciones'
    ? previewData.length
    : uploadType === 'horarios'
      ? schedulePreview.length
      : studentPreview.length;

  const showUploadDropzone = previewCount === 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <header className="px-8 py-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          Carga Masiva de Datos
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Sube archivos para actualizar proyecciones, horarios y estudiantes por programa</p>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Tipo de carga
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUploadType('proyecciones');
                  resetPreview();
                }}
                disabled={loading}
                className={`px-4 py-3 rounded-lg border text-sm font-semibold transition-colors ${uploadType === 'proyecciones'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                Proyecciones
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadType('horarios');
                  resetPreview();
                }}
                disabled={loading}
                className={`px-4 py-3 rounded-lg border text-sm font-semibold transition-colors ${uploadType === 'horarios'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                Horarios por programa
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadType('estudiantes');
                  resetPreview();
                }}
                disabled={loading}
                className={`px-4 py-3 rounded-lg border text-sm font-semibold transition-colors ${uploadType === 'estudiantes'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                General Estudiantes
              </button>
            </div>
          </div>

          {uploadType === 'proyecciones' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">
                Código de Semestre
              </label>
              <SemesterInput
                value={semester}
                onChange={setSemester}
                disabled={loading || previewData.length > 0}
              />
              <p className="text-xs text-slate-500 mt-4 text-center">El código debe coincidir con el nombre de la hoja en el Excel.</p>
            </div>
          )}

          {showUploadDropzone ? (
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {uploadType === 'proyecciones' ? 'Archivo Excel (.xlsx)' : 'Archivo CSV (.csv)'}
              </label>
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">cloud_upload</span>
                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click para subir</span> o arrastrar y soltar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {uploadType === 'proyecciones'
                        ? `XLSX (Hoja: Poblaciones (${semester || 'CODIGO'}))`
                        : uploadType === 'horarios'
                          ? 'CSV (Reporte de horarios por programa)'
                          : 'CSV (Reporte General Estudiantes)'
                      }
                    </p>
                  </div>
                  {uploadType === 'proyecciones' ? (
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept=".xlsx"
                      onChange={handleProjectionsFileSelect}
                      disabled={loading || !semester}
                    />
                  ) : uploadType === 'horarios' ? (
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={handleScheduleFileSelect}
                      disabled={loading}
                    />
                  ) : (
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={handleStudentsFileSelect}
                      disabled={loading}
                    />
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-600 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">description</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Archivo listo para procesar</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  {uploadType === 'estudiantes'
                    ? (
                      <>
                        Se han encontrado <strong className="text-slate-900 dark:text-white">{studentPreview.length}</strong> estudiantes de los programas permitidos
                        {studentPreviewTotal > 0 && (
                          <> de un total de <strong className="text-slate-900 dark:text-white">{studentPreviewTotal}</strong> en el reporte</>
                        )}.
                      </>
                    )
                    : (
                      <>
                        Se han encontrado <strong className="text-slate-900 dark:text-white">{uploadType === 'proyecciones' ? previewData.length : schedulePreview.length}</strong> registros {uploadType === 'proyecciones' ? `para el semestre ${semester}` : 'en el reporte de horarios'}.
                      </>
                    )}
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetPreview}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProcessUpload}
                    disabled={loading}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send</span>
                        {uploadType === 'proyecciones'
                          ? 'Procesar Datos'
                          : uploadType === 'horarios'
                            ? 'Procesar Horarios'
                            : 'Procesar Estudiantes'
                        }
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && !previewData.length && !schedulePreview.length && !studentPreview.length && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span>Estado</span>
                <span>{progress}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          )}

        </div>
      </main>

      <OutcomeModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}
