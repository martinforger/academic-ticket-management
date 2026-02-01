import React, { useState, useEffect, useRef } from 'react';
import type { StudentSummary, Request, Status } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface StudentRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentSummary | null;
  onRefresh?: () => void;
}

interface RequestItemProps {
  request: Request;
  onChange: (id: number, changes: Partial<Request>) => void;
  isReader: boolean;
}

const RequestItem = ({ request, onChange, isReader }: RequestItemProps) => {
  const isAdd = request.action === 'Agregar';
  // Indigo-themed accents for Student Detail
  const iconBgClasses = isAdd
    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";

  const badgeClasses = isAdd
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
    : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-200 dark:border-rose-800";

  const icon = isAdd ? 'add_circle' : 'remove_circle';
  const label = isAdd ? 'AGREGAR CURSO' : 'ELIMINAR CURSO';

  // State for form fields - initialized with props
  const [status, setStatus] = useState(request.status);
  const [internalResponse, setInternalResponse] = useState(request.internalResponse || '');
  const [response, setResponse] = useState(request.studentResponse || '');

  const handleFieldChange = (field: keyof Request, value: any) => {
    if (field === 'status') setStatus(value);
    if (field === 'internalResponse') setInternalResponse(value);
    if (field === 'studentResponse') setResponse(value); // Note: mapping difference in local state name

    onChange(request.id, { [field]: value });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-VE', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date(dateStr));
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-[#e7edf3] dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header Bar */}
      <div className={`flex flex-wrap gap-4 items-center justify-between p-4 border-b border-[#e7edf3] dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClasses}`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div>
            <p className="font-bold text-[#0d141b] dark:text-white text-base">{request.subject}</p>
            <p className="text-xs text-slate-500 font-mono">#{request.caseId} • NRC: {request.nrc} • <span className="text-primary font-black uppercase">{request.action || 'S/A'}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}>
            {label}
          </span>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">history</span> {formatDate(request.date)}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Student Justification */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Justificación del Estudiante</label>
          <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg border border-[#e7edf3] dark:border-gray-700 italic text-slate-600 dark:text-slate-300 text-sm leading-relaxed relative min-h-[100px]">
            <span className="material-symbols-outlined absolute top-2 left-2 text-slate-200 dark:text-slate-700 text-4xl -z-0 select-none">format_quote</span>
            <span className="relative z-10">{request.comments || "No se proporcionó justificación."}</span>
          </div>
        </div>

        {/* Right: Admin Action */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Dropdown */}
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</span>
              <div className="relative">
                <select
                  value={status}
                  disabled={isReader}
                  onChange={(e) => handleFieldChange('status', e.target.value as Status)}
                  className="w-full appearance-none rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-[#0d141b] dark:text-white py-2.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                >
                  <option value="SOLUCIONADO">Solucionado</option>
                  <option value="EN REVISIÓN">En Revisión</option>
                  <option value="NO PROCEDE">No Procede</option>
                  <option value="POR REVISAR">Por Revisar</option>
                  <option value="REPETIDO/IGNORADO">Repetido/Ignorado</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </label>

            {/* Responsible (Visible if not POR REVISAR) */}
            {status !== 'POR REVISAR' && (
              <label className="flex flex-col gap-2 animate-fade-in">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Responsable</span>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-indigo-500 text-lg">person</span>
                  {request.responsible || 'Sistema'}
                </div>
              </label>
            )}

            {/* Action Type (Only for ADD) - REMOVED */}
          </div>

          {/* Internal Response Text Area */}
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">lock</span>
              Respuesta Interna (Solo Administrativo)
            </span>
            <textarea
              value={internalResponse}
              disabled={isReader}
              onChange={(e) => handleFieldChange('internalResponse', e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800/50 text-[#0d141b] dark:text-white p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-400 transition-all resize-none h-[70px] disabled:opacity-50"
              placeholder="Notas privadas para coordinación..."
            ></textarea>
          </label>

          {/* Response Text Area */}
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">send</span>
              Respuesta al Estudiante
            </span>
            <textarea
              value={response}
              disabled={isReader}
              onChange={(e) => handleFieldChange('studentResponse', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-[#0d141b] dark:text-white p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-400 transition-all hover:border-primary/50 resize-none h-[80px] disabled:opacity-50"
              placeholder={`Escriba una respuesta a ${request.studentName.split(' ')[0]}...`}
            ></textarea>
          </label>
        </div>
      </div>
    </div>
  );
};

export const StudentRequestDetailModal: React.FC<StudentRequestDetailModalProps> = ({ isOpen, onClose, student, onRefresh }) => {
  const { profile } = useAuth();
  const [requestChanges, setRequestChanges] = useState<Record<number, Partial<Request>>>({});
  const [saving, setSaving] = useState(false);
  const isReader = profile?.role === 'lector';

  // Track IDs of requests that were auto-claimed
  const autoClaimedIdsRef = useRef<number[]>([]);

  // Auto-claim effect: when modal opens, claim all "POR REVISAR" requests
  useEffect(() => {
    const autoClaim = async () => {
      if (!isOpen || !student || isReader || !profile) return;

      const porRevisarRequests = student.requests.filter(r => r.status === 'POR REVISAR');
      if (porRevisarRequests.length === 0) return;

      const idsToClam = porRevisarRequests.map(r => r.id);
      autoClaimedIdsRef.current = idsToClam;

      try {
        // Batch update all POR REVISAR to EN REVISIÓN
        const { error } = await supabase
          .from('observaciones')
          .update({
            estatus: 'EN REVISIÓN',
            responsable: profile.initials
          })
          .in('id', idsToClam);

        if (error) throw error;

        // Audit log for batch claim
        await supabase.from('audit_logs').insert({
          user_id: profile.id,
          case_id: student.studentId,
          action: 'BATCH_CLAIM_REQUESTS',
          details: {
            description: 'Solicitudes tomadas automáticamente al abrir expediente estudiante',
            count: idsToClam.length,
            ids: idsToClam
          },
          changes: { status: { old: 'POR REVISAR', new: 'EN REVISIÓN' } }
        });

      } catch (err) {
        console.error('Error auto-claiming requests:', err);
      }
    };

    autoClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, student?.studentId]);

  if (!isOpen || !student) return null;

  const handleRequestChange = (reqId: number, changes: Partial<Request>) => {
    setRequestChanges(prev => ({
      ...prev,
      [reqId]: { ...prev[reqId], ...changes }
    }));
  };

  const handleClose = async () => {
    // Revert any auto-claimed requests that weren't explicitly changed
    if (autoClaimedIdsRef.current.length > 0 && !isReader && profile) {
      // Find IDs that were NOT changed by the user at all (no status change)
      const unchangedIds = autoClaimedIdsRef.current.filter(id => {
        const changes = requestChanges[id];
        // Revert only if: no changes at all, OR status is still EN REVISIÓN (wasn't changed)
        // If user changed status to anything else (SOLUCIONADO, NO PROCEDE, etc.), don't revert
        return !changes || changes.status === undefined || changes.status === 'EN REVISIÓN';
      });

      if (unchangedIds.length > 0) {
        try {
          await supabase
            .from('observaciones')
            .update({
              estatus: 'POR REVISAR',
              responsable: ''
            })
            .in('id', unchangedIds);

          // Audit log for unclaim
          await supabase.from('audit_logs').insert({
            user_id: profile.id,
            case_id: student.studentId,
            action: 'BATCH_UNCLAIM_REQUESTS',
            details: {
              description: 'Solicitudes liberadas al cerrar expediente sin resolver',
              count: unchangedIds.length,
              ids: unchangedIds
            },
            changes: { status: { old: 'EN REVISIÓN', new: 'POR REVISAR' } }
          });
        } catch (err) {
          console.error('Error reverting requests:', err);
        }
      }
    }

    autoClaimedIdsRef.current = [];
    setRequestChanges({});
    onClose();
  };

  const handleSave = async () => {
    if (Object.keys(requestChanges).length === 0) return;
    if (isReader || !profile) return;

    setSaving(true);
    try {
      const promises = Object.entries(requestChanges).map(async ([reqIdStr, changes]) => {
        const reqId = parseInt(reqIdStr);
        console.log(`Updating req ${reqId}`, changes);

        // Determine if responsible needs to be updated.
        // Simplified: if there are changes, we update responsible
        const updatePayload = {
          estatus: changes.status,
          'Respuesta interna': changes.internalResponse,
          'Respuesta al Estudiante': changes.studentResponse,
          responsable: profile.initials
        };

        // Remove undefined 
        Object.keys(updatePayload).forEach(key => (updatePayload as any)[key] === undefined && delete (updatePayload as any)[key]);

        const { error } = await supabase
          .from('observaciones')
          .update(updatePayload)
          .eq('id', reqId);

        if (error) throw error;

        // Audit Log
        const originalReq = student.requests.find(r => r.id === reqId);
        const auditChanges: any = {};
        if (changes.status && originalReq && changes.status !== originalReq.status)
          auditChanges.status = { old: originalReq.status, new: changes.status };
        // ... similar for other fields if needed for audit detail

        await supabase.from('audit_logs').insert({
          user_id: profile.id,
          case_id: originalReq?.caseId,
          action: 'UPDATE_REQUEST_BATCH',
          details: { description: 'Actualización en lote desde vista Estudiante' },
          changes: auditChanges
        });

      });

      await Promise.all(promises);

      // Clear auto-claimed refs since user explicitly saved
      autoClaimedIdsRef.current = [];
      setRequestChanges({});
      if (onRefresh) onRefresh();
      onClose();
      alert('Cambios guardados correctamente');
    } catch (err) {
      console.error("Error saving batch:", err);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal Container */}
      <div className="relative z-10 bg-white dark:bg-surface-dark w-full max-w-[1000px] h-full max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border-t-8 border-indigo-600">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e7edf3] dark:border-gray-700 bg-indigo-50/30 dark:bg-indigo-900/10 shrink-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 leading-tight">Detalles de Solicitud del Estudiante</h2>
            <p className="text-sm text-indigo-600/70 dark:text-indigo-400">Revisando acciones de inscripción para Otoño 2024</p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-background-dark">
          {/* Student Profile Header */}
          <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-[#e7edf3] dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm flex items-center justify-center">
                  <span className="text-slate-400 text-2xl font-bold">
                    {student.studentName.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-[#0d141b] dark:text-white">{student.studentName}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider font-black">Expediente Alumno</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                    C.I.: {student.studentId}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    Créditos Totales: {student.totalCredits}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">alternate_email</span>
                    {student.email.replace(/[,]/g, '').replace(/\.{2,}/g, '.')}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                {/* Historial Académico button removed */}
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-lg font-bold text-[#0d141b] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">timeline</span>
              Cronología de Solicitudes
            </h3>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-surface-dark px-3 py-1 rounded-full border border-[#e7edf3] dark:border-gray-700">
              {student.requests.length} Solicitudes Pendientes
            </span>
          </div>

          {/* Timeline Items */}
          <div className="space-y-4">
            {student.requests.map((req, idx) => (
              <RequestItem
                key={`${req.nrc}-${idx}`}
                request={req}
                onChange={handleRequestChange}
                isReader={isReader}
              />
            ))}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 border-t border-[#e7edf3] dark:border-gray-700 bg-white dark:bg-surface-dark shrink-0 flex justify-between items-center">
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors"
          >
            Cancelar
          </button>
          <div className="flex gap-3">
            {!isReader && (
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(requestChanges).length === 0}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {saving ? 'Guardando...' : 'Guardar y Notificar al Estudiante'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
