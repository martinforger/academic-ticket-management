
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

export function UploadProjections() {
  const { profile } = useAuth();
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  // New State
  const [previewData, setPreviewData] = useState<StudentRow[]>([]);
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleProcessUpload = async () => {
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
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <header className="px-8 py-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          Carga Masiva de Proyecciones
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Sube archivos de Excel para actualizar proyecciones estudiantiles</p>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">

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

          {!previewData.length ? (
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Archivo Excel (.xlsx)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">cloud_upload</span>
                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click para subir</span> o arrastrar y soltar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">XLSX (Hoja: Poblaciones ({semester || 'CODIGO'}))</p>
                  </div>
                  <input id="dropzone-file" type="file" className="hidden" accept=".xlsx" onChange={handleFileSelect} disabled={loading || !semester} />
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
                  Se han encontrado <strong className="text-slate-900 dark:text-white">{previewData.length}</strong> registros para el semestre {semester}.
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setPreviewData([]); setProgress(''); }}
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
                        Procesar Datos
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && !previewData.length && (
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
