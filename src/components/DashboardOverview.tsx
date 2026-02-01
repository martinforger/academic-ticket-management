import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Department colors matching the provided color scheme
const DEPARTMENT_COLORS: Record<string, string> = {
  'IN': '#0077B6', // Fundamentos de Ingeniería - Blue
  'LP': '#8BC34A', // Lógica y Programación - Lime Green
  'IS': '#E91E63', // Ingeniería de Software - Pink/Magenta
  'TE': '#FF9800', // Telemática - Orange
  'GE': '#00BCD4', // Formación Gerencial - Teal
  'MC': '#FFC107', // Materias Comunes / Formación Integral - Yellow
  'PP': '#9C27B0', // Prácticas Profesionales - Purple
  'AT': '#673AB7', // Apoyo / Electivas - Deep Purple
};

const DEPARTMENT_NAMES: Record<string, string> = {
  'IN': 'Fundamentos de Ingeniería',
  'LP': 'Lógica y Programación',
  'IS': 'Ingeniería de Software',
  'TE': 'Telemática',
  'GE': 'Formación Gerencial',
  'MC': 'Formación Integral',
  'PP': 'Prácticas Profesionales',
  'AT': 'Electivas',
};

const statusColors: Record<string, string> = {
  'SOLUCIONADO': '#22c55e',
  'POR REVISAR': '#fbbf24',
  'NO PROCEDE': '#ef4444',
  'EN REVISIÓN': '#3b82f6',
  'REPETIDO': '#94a3b8',
  'IGNORADO': '#cbd5e1',
  'REVISADO': '#14b8a6'
};

interface DashboardStats {
  totalStudents: number;
  activeRequests: number;
  completionRate: number;
  urgentCases: number;
  rejectionRate: number;
  addCount: number;
  removeCount: number;
  dailyAverage: number;
}

interface ResponsibleStats {
  name: string;
  total: number;
  solved: number;
  rate: number;
}

interface DepartmentStats {
  id: string;
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export const DashboardOverview: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeRequests: 0,
    completionRate: 0,
    urgentCases: 0,
    rejectionRate: 0,
    addCount: 0,
    removeCount: 0,
    dailyAverage: 0
  });
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [responsibleStats, setResponsibleStats] = useState<ResponsibleStats[]>([]);
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { userName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Run all queries in parallel for better performance
        const [
          statsResult,
          statusResult,
          deptResult,
          respResult,
          volumeResult
        ] = await Promise.all([
          supabase.rpc('get_dashboard_stats'),
          supabase.rpc('get_status_distribution'),
          supabase.rpc('get_department_distribution'),
          supabase.rpc('get_top_responsibles', { limit_count: 5 }),
          supabase.rpc('get_daily_volume', { days_back: 30 })
        ]);

        // 1. Process basic statistics
        if (statsResult.data) {
          const s = statsResult.data;
          const total = s.total || 0;
          const solved = s.solved || 0;
          const noProcede = s.no_procede || 0;
          const uniqueDates = s.unique_dates || 1;

          setStats({
            totalStudents: s.unique_students || 0,
            activeRequests: s.active_requests || 0,
            completionRate: total > 0 ? Math.round((solved / total) * 100) : 0,
            urgentCases: s.urgent || 0,
            rejectionRate: total > 0 ? Math.round((noProcede / total) * 100 * 10) / 10 : 0,
            addCount: s.add_count || 0,
            removeCount: s.remove_count || 0,
            dailyAverage: uniqueDates > 0 ? Math.round(total / uniqueDates) : 0
          });
        }

        // 2. Status Distribution
        if (statusResult.data) {
          setStatusDistribution(statusResult.data);
        }

        // 3. Department Distribution
        if (deptResult.data) {
          const deptStats: DepartmentStats[] = deptResult.data.map((d: any) => ({
            id: d.id,
            name: DEPARTMENT_NAMES[d.id] || d.id,
            count: d.count,
            percentage: d.percentage,
            color: DEPARTMENT_COLORS[d.id] || '#94a3b8'
          }));
          setDepartmentStats(deptStats);
        }

        // 4. Responsible Stats
        if (respResult.data) {
          setResponsibleStats(respResult.data || []);
        }

        // 5. Line Chart Data
        if (volumeResult.data) {
          const dailyData = volumeResult.data as { day: string; count: number }[];
          const maxCount = Math.max(...dailyData.map(d => d.count), 1);

          const points = dailyData.map((d, index) => ({
            x: (index / 30) * 400,
            y: 100 - (d.count / maxCount) * 80 - 10
          }));

          setChartData(points);
        }

        // 6. Audit Logs (only for admins/coordinators)
        if (profile && (profile.role === 'administrador' || profile.role === 'coordinador')) {
          const { data: logs, error: logsError } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

          if (!logsError && logs) {
            const userIds = [...new Set(logs.map((l: any) => l.user_id))];
            if (userIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, initials, full_name')
                .in('id', userIds);

              const profileMap = (profiles || []).reduce((acc: any, p: any) => {
                acc[p.id] = p.full_name || p.initials || '??';
                return acc;
              }, {});

              setAuditLogs(logs.map((l: any) => ({
                ...l,
                userName: profileMap[l.user_id] || 'Usuario'
              })));
            } else {
              setAuditLogs(logs.map((l: any) => ({ ...l, userName: 'Desconocido' })));
            }
          }
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const generatePath = () => {
    if (chartData.length === 0) return "";
    return `M ${chartData[0].x},${chartData[0].y} ` +
      chartData.map((p, i) => i === 0 ? "" : `L ${p.x},${p.y}`).join(" ");
  };

  const generateAreaPath = () => {
    if (chartData.length === 0) return "";
    const line = generatePath();
    return `${line} L 400,100 L 0,100 Z`;
  };

  const getDonutSegments = () => {
    const total = Object.values(statusDistribution).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    let currentAngle = -90;
    return Object.entries(statusDistribution).map(([status, count]) => {
      const percentage = (count / total) * 100;
      const angle = (count / total) * 360;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
      const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
      const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
      const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      return {
        status,
        percentage: Math.round(percentage),
        path: `M ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        color: statusColors[status] || '#e2e8f0'
      };
    });
  };

  const filteredAuditLogs = auditFilter === 'ALL'
    ? auditLogs
    : auditLogs.filter(log => log.action === auditFilter);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPDATE_REQUEST': return 'edit_note';
      case 'CREATE_USER': return 'person_add';
      case 'UPDATE_USER': return 'manage_accounts';
      case 'DELETE_USER': return 'person_remove';
      default: return 'history';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'UPDATE_REQUEST': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/30';
      case 'CREATE_USER': return 'text-green-500 bg-green-50 dark:bg-green-900/30';
      case 'UPDATE_USER': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/30';
      case 'DELETE_USER': return 'text-red-500 bg-red-50 dark:bg-red-900/30';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Page Heading */}
        <div className="mb-8">
          <h2 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight mb-1">Resumen Ejecutivo</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Métricas de registro académico basadas en la tabla observaciones.</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">group</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Estudiantes Únicos</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.totalStudents.toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-2">Registrados en el sistema</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-lg">clinical_notes</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Solicitudes Activas</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.activeRequests}</p>
            <p className="text-slate-400 text-xs mt-2">En revisión o por revisar</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-2 rounded-lg">check_circle</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Tasa de Solución</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.completionRate}%</p>
            <p className="text-slate-400 text-xs mt-2">Casos solucionados</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-red-500/20 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-lg">pending</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Por Revisar</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.urgentCases}</p>
            <p className="text-slate-400 text-xs mt-2">Requiere atención inmediata</p>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900 border border-rose-200 dark:border-rose-800/30 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-rose-500 bg-rose-100 dark:bg-rose-900/50 p-2 rounded-lg">block</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Tasa de Rechazo</span>
            </div>
            <p className="text-4xl font-black text-rose-600 dark:text-rose-400">{stats.rejectionRate}%</p>
            <p className="text-rose-400 dark:text-rose-500 text-xs mt-2">Casos que no proceden</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/30 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-indigo-500 bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">swap_horiz</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Tipo de Acción</span>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.addCount}</p>
                <p className="text-indigo-400 text-xs">Agregar</p>
              </div>
              <div className="text-slate-400 text-2xl font-light">/</div>
              <div>
                <p className="text-3xl font-black text-indigo-400 dark:text-indigo-300">{stats.removeCount}</p>
                <p className="text-indigo-400 text-xs">Eliminar</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-slate-900 border border-cyan-200 dark:border-cyan-800/30 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-cyan-500 bg-cyan-100 dark:bg-cyan-900/50 p-2 rounded-lg">trending_up</span>
              <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Promedio Diario</span>
            </div>
            <p className="text-4xl font-black text-cyan-600 dark:text-cyan-400">{stats.dailyAverage}</p>
            <p className="text-cyan-400 dark:text-cyan-500 text-xs mt-2">Solicitudes por día</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Line Graph */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">Volumen de Solicitudes (30 Días)</h3>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
                <span className="text-xs text-slate-500 font-medium">Nuevas Solicitudes</span>
              </div>
            </div>
            <div className="h-64 flex flex-col justify-end gap-2 relative">
              <div className="absolute inset-0 flex flex-col justify-between py-2">
                <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
                <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
                <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
                <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
              </div>
              <svg className="w-full h-full relative z-0" preserveAspectRatio="none" viewBox="0 0 400 100">
                <path d={generatePath()} fill="none" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                <path d={generateAreaPath()} fill="url(#grad1)" opacity="0.1"></path>
                <defs>
                  <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#137fec" stopOpacity="1"></stop>
                    <stop offset="100%" stopColor="#137fec" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>Hace 30 días</span>
                <span>Hace 15 días</span>
                <span>Hoy</span>
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6">Distribución de Estado</h3>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="relative size-48">
                <svg viewBox="0 0 100 100" className="size-full transform rotate-0">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                  {getDonutSegments().map((segment, i) => (
                    <path
                      key={i}
                      d={segment.path}
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.completionRate}%</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Solucionado</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 w-full">
                {Object.entries(statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: statusColors[status] || '#e2e8f0' }}
                    ></span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                      {status} ({count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Department Distribution & Top Responsibles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Department Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">domain</span>
              Distribución por Departamento
            </h3>
            <div className="space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: dept.color }}
                      ></span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {dept.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({dept.id})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{dept.count}</span>
                      <span className="text-xs text-slate-400">({dept.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
                      style={{
                        width: `${dept.percentage}%`,
                        backgroundColor: dept.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Responsibles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">emoji_events</span>
              Top Gestores
            </h3>
            <div className="space-y-3">
              {responsibleStats.map((resp, index) => (
                <div
                  key={resp.name}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${index === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' :
                    index === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                      index === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                      {resp.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Responsable de {resp.total} gestiones
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">
                      {resp.total}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Casos</p>
                  </div>
                </div>
              ))}
              {responsibleStats.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
                  <p className="text-sm">No hay datos de responsables</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Logs Section */}
        {(profile?.role === 'administrador' || profile?.role === 'coordinador') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">history_edu</span>
                Registro de Auditoría
              </h3>
              <div className="flex items-center gap-3">
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ALL">Todas las acciones</option>
                  <option value="UPDATE_REQUEST">Actualización de solicitud</option>
                  <option value="CREATE_USER">Creación de usuario</option>
                  <option value="UPDATE_USER">Actualización de usuario</option>
                </select>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                  {filteredAuditLogs.length} registros
                </span>
              </div>
            </div>

            {filteredAuditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Usuario</th>
                      <th className="px-6 py-3">Acción</th>
                      <th className="px-6 py-3">Caso</th>
                      <th className="px-6 py-3">Detalle</th>
                      <th className="px-6 py-3 text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAuditLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                              {log.userName?.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-gray-200">{log.userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${getActionColor(log.action)}`}>
                            <span className="material-symbols-outlined text-[16px]">{getActionIcon(log.action)}</span>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {log.case_id ? (
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                              #{log.case_id}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400 max-w-xs">
                          <div className="truncate">
                            {log.details?.description || 'Sin descripción'}
                          </div>
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(log.changes).slice(0, 3).map(([key, value]: [string, any]) => (
                                <span key={key} className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                                  {key}:
                                  <span className="line-through text-rose-400 mx-1">{String(value.old || '—').substring(0, 15)}</span>
                                  →
                                  <span className="text-emerald-500 ml-1">{String(value.new || '—').substring(0, 15)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-500 whitespace-nowrap font-mono text-xs">
                          {new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(log.created_at))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-3">history</span>
                <p className="font-bold">No hay registros de auditoría</p>
                <p className="text-sm">Las acciones realizadas en el sistema aparecerán aquí</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
