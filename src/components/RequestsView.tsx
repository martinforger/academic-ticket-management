import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Request, Status } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const RequestsView: React.FC = () => {

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // Filter state
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const DEPARTMENTS = [
    { id: 'GE', label: 'General' },
    { id: 'AT', label: 'Apoyo a la toma de decisiones' },
    { id: 'TE', label: 'Telematica' },
    { id: 'IS', label: 'Ingenieria de Software' },
    { id: 'IN', label: 'Ingles' },
    { id: 'LP', label: 'Logica y Programacion' },
    { id: 'MC', label: 'Materias comunes' },
    { id: 'PP', label: 'Practicas profesionales' },
  ];

  const STATUSES = [
    'POR REVISAR',
    'EN REVISIÓN',
    'REVISADO',
    'SOLUCIONADO',
    'NO PROCEDE',
    'REPETIDO',
    'IGNORADO',
  ];

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Only select the columns we need for the list view
        const { data, error } = await supabase
          .from('observaciones')
          .select('id, estatus, "Clasif.", "# de Caso", fecha, cédula, estudiante, "acción", "Nombre Asignatura", nrc, uc, "Sem.", "Prom.", autoriza, comentarios, contacto, responsable, "Respuesta interna", "Respuesta al Estudiante"')
          .order('fecha', { ascending: false });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedRequests: Request[] = (data || []).map((row: any) => ({
          id: row.id,
          status: row.estatus,
          classification: row['Clasif.'],
          caseId: row['# de Caso'],
          date: row.fecha,
          studentId: row['cédula']?.toString() || '',
          studentName: row.estudiante || 'Desconocido',
          credits: row.uc || 0,
          semester: row['Sem.'] || '',
          gpa: row.Prom || 0,
          authorized: row.autoriza,
          action: row.acción || '',
          subject: row['Nombre Asignatura'] || '',
          nrc: row.nrc || 0,
          comments: row.comentarios || '',
          contact: row.contacto || '',
          responsible: row.responsable || '',
          internalResponse: row['Respuesta interna'] || '',
          studentResponse: row['Respuesta al Estudiante'] || ''
        }));

        setRequests(formattedRequests);
      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Search term
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch =
          r.studentName.toLowerCase().includes(lowerSearch) ||
          r.studentId.includes(lowerSearch) ||
          r.subject.toLowerCase().includes(lowerSearch) ||
          r.caseId?.toString().includes(lowerSearch);

        if (!matchesSearch) return false;
      }

      // Dept filter
      if (selectedDepts.length > 0 && !selectedDepts.includes(r.classification)) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && r.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [requests, searchTerm, selectedDepts, selectedStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + pageSize);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  const handleDeptToggle = (deptId: string) => {
    setSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark p-6 lg:p-10">
      <div className="max-w-[1500px] mx-auto w-full flex flex-col h-full gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[#0d141b] dark:text-white text-3xl font-black leading-tight tracking-tight">Observaciones de inscripción - IINF</h1>
            <p className="text-[#4c739a] dark:text-gray-400">Control individual de cada solicitud recibida</p>
          </div>

          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Buscar por estudiante, C.I., materia o caso..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
          {/* Sidebar Filters */}
          <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">filter_alt</span>
                Departamentos
              </h3>
              <div className="flex flex-col gap-2">
                {DEPARTMENTS.map(dept => (
                  <label key={dept.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(dept.id)}
                      onChange={() => handleDeptToggle(dept.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {dept.label} <span className="text-[10px] opacity-50">({dept.id})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Estado de Solicitud
              </h3>
              <select
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">Todos los estados</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {(selectedDepts.length > 0 || selectedStatus !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedDepts([]);
                  setSelectedStatus('All');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all border border-rose-100 dark:border-rose-900/30"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="lg:col-span-9 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[#4c739a] dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 w-24">Caso / Fecha</th>
                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Estudiante</th>
                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Materia</th>
                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Acción Solicitada</th>
                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentRequests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-4 whitespace-nowrap w-24">
                        <div className="text-[10px] text-slate-400 font-mono mb-0.5">#{req.caseId}</div>
                        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 italic leading-tight">{formatDate(req.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{req.studentName}</div>
                        <div className="text-xs text-slate-500">C.I.: {req.studentId}</div>
                      </td>
                      <td className="px-6 py-4 max-w-[220px]">
                        <div className="text-sm text-slate-700 dark:text-slate-300 font-bold truncate">{req.subject}</div>
                        <div className="text-xs text-slate-500 font-medium">NRC: {req.nrc}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tight bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
                          {req.action || 'S/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                  <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                  <p className="text-lg font-bold">No se encontraron solicitudes</p>
                  <p className="text-sm">Prueba ajustando los filtros de búsqueda</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 mt-auto">
              <span className="text-sm text-slate-500 font-medium">
                Mostrando <span className="text-slate-900 dark:text-white font-bold">{filteredRequests.length > 0 ? startIndex + 1 : 0}</span>-
                <span className="text-slate-900 dark:text-white font-bold">{Math.min(startIndex + pageSize, filteredRequests.length)}</span> de
                <span className="text-slate-900 dark:text-white font-bold ml-1">{filteredRequests.length}</span>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}
                  className="p-1 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 text-sm font-bold transition-all shadow-sm"
                >
                  Anterior
                </button>
                <div className="flex items-center px-4 text-sm font-black text-primary">
                  {currentPage} / {totalPages || 1}
                </div>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                  className="p-1 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 text-sm font-bold transition-all shadow-sm"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={(updatedReq) => {
            setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'POR REVISAR': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'EN REVISIÓN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SOLUCIONADO': return 'bg-green-100 text-green-700 border-green-200';
      case 'NO PROCEDE': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'IGNORADO': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getColors()}`}>
      {status}
    </span>
  );
};

interface DetailModalProps {
  request: Request;
  onClose: () => void;
  onUpdate: (request: Request) => void;
}

const RequestDetailModal: React.FC<DetailModalProps> = ({ request, onClose, onUpdate }) => {
  const { profile } = useAuth();
  const [status, setStatus] = useState<Status>(request.status);
  const [internalResponse, setInternalResponse] = useState(request.internalResponse);
  const [studentResponse, setStudentResponse] = useState(request.studentResponse);
  const [saving, setSaving] = useState(false);

  const isReader = profile?.role === 'lector';

  const handleSave = async () => {
    if (isReader || !profile) return;
    setSaving(true);
    try {
      const updates: any = {
        estatus: status,
        'Respuesta interna': internalResponse,
        'Respuesta al Estudiante': studentResponse
      };

      // If status changed or response added, update responsible
      const hasChanges = status !== request.status ||
        internalResponse !== request.internalResponse ||
        studentResponse !== request.studentResponse;

      if (hasChanges) {
        updates.responsable = profile.initials;
      }

      // Update Database
      const { error } = await supabase
        .from('observaciones')
        .update(updates)
        .eq('id', request.id);

      if (error) throw error;

      // Audit Log
      if (hasChanges) {
        const changes: any = {};
        if (status !== request.status) changes.status = { old: request.status, new: status };
        if (internalResponse !== request.internalResponse) changes.internalResponse = { old: request.internalResponse, new: internalResponse };
        if (studentResponse !== request.studentResponse) changes.studentResponse = { old: request.studentResponse, new: studentResponse };

        await supabase.from('audit_logs').insert({
          user_id: profile.id,
          case_id: request.caseId,
          action: 'UPDATE_REQUEST',
          details: { description: 'Actualización desde vista de lista solicitudes' },
          changes: changes
        });
      }

      onUpdate({ ...request, status, internalResponse, studentResponse, responsible: updates.responsable || request.responsible });
      onClose();
    } catch (err) {
      console.error('Error updating request:', err);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border-t-8 border-emerald-600">
        <div className="flex items-center justify-between p-6 border-b border-emerald-50 dark:border-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-900/10">
          <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 italic flex items-center gap-2">
            <span className="material-symbols-outlined">description</span>
            Ficha de Solicitud #{request.caseId}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition-colors">
            <span className="material-symbols-outlined text-emerald-600">close</span>
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[70vh] space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Estudiante</label>
              <p className="font-bold">{request.studentName}</p>
              <p className="text-sm text-slate-500">C.I. {request.studentId}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Materia</label>
              <p className="font-bold">{request.subject}</p>
              <p className="text-sm text-slate-500">NRC: {request.nrc}</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Justificación del Estudiante</label>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm italic border border-slate-100 dark:border-slate-800">
              "{request.comments || 'Sin comentarios'}"
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Estatus</label>
              <select
                value={status}
                disabled={isReader}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:bg-slate-100"
              >
                {['POR REVISAR', 'EN REVISIÓN', 'REVISADO', 'SOLUCIONADO', 'NO PROCEDE', 'REPETIDO', 'IGNORADO'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {status !== 'POR REVISAR' ? (
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Responsable Gestión</label>
                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  {request.responsible || 'Sistema'}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Acción Solicitada</label>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium">
                  {request.action}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Respuesta Interna</label>
            <textarea
              value={internalResponse}
              disabled={isReader}
              onChange={(e) => setInternalResponse(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm min-h-[80px] disabled:opacity-50 disabled:bg-slate-100"
              placeholder="Notas para el equipo administrativo..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Respuesta al Estudiante</label>
            <textarea
              value={studentResponse}
              disabled={isReader}
              onChange={(e) => setStudentResponse(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm min-h-[80px] disabled:opacity-50 disabled:bg-slate-100"
              placeholder="Este mensaje será enviado al estudiante..."
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          {!isReader && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-200 dark:shadow-none"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
