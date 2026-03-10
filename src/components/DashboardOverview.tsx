import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  type ChartOptions
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

import { DEPARTMENT_COLORS, DEPARTMENT_NAMES } from '../constants/departments';

const statusColors: Record<string, string> = {
  'SOLUCIONADO': '#22c55e',
  'POR REVISAR': '#fbbf24',
  'NO PROCEDE': '#ef4444',
  'EN REVISIÓN': '#3b82f6',
  'REPETIDO': '#94a3b8',
  'IGNORADO': '#cbd5e1',
  'REVISADO': '#14b8a6'
};

const actionTranslations: Record<string, string> = {
  'UPDATE_REQUEST': 'Edición de Solicitud',
  'UPDATE_REQUEST_BATCH': 'Actualización en Lote',
  'BATCH_CLAIM_REQUESTS': 'Toma Automática',
  'CLAIM_REQUEST': 'Caso Tomado',
  'BATCH_UNCLAIM_REQUESTS': 'Liberación en Lote',
  'UNCLAIM_REQUEST': 'Caso Liberado',
  'CREATE_USER': 'Nuevo Usuario',
  'UPDATE_USER': 'Cambio de Perfil',
  'UPDATE_USER_ROLE': 'Cambio de Rol',
  'DELETE_USER_PROFILE': 'Usuario Eliminado',
  'DELETE_USER': 'Usuario Eliminado'
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
  const [chartData, setChartData] = useState<{ day: string; count: number }[]>([]);
  const [daysBack, setDaysBack] = useState<number>(7);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [responsibleStats, setResponsibleStats] = useState<ResponsibleStats[]>([]);
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { userName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState<string>('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [totalAuditLogs, setTotalAuditLogs] = useState(0);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const LOGS_PER_PAGE = 5;

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
          supabase.rpc('get_daily_volume', { 
            days_back: daysBack,
            interval_text: daysBack === 1 ? '1 hour' : daysBack === 7 ? '6 hours' : '1 day'
          })
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
          setChartData(volumeResult.data as { day: string; count: number }[]);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, daysBack]);

  // Realtime subscription for dashboard stats
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'observacion'
        },
        () => {
          // Trigger data re-fetch when any change occurs
          const fetchData = async () => {
            try {
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
                supabase.rpc('get_daily_volume', { 
                  days_back: daysBack,
                  interval_text: daysBack === 1 ? '1 hour' : daysBack === 7 ? '6 hours' : '1 day'
                })
              ]);

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

              if (statusResult.data) setStatusDistribution(statusResult.data);
              
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

              if (respResult.data) setResponsibleStats(respResult.data || []);
              if (volumeResult.data) setChartData(volumeResult.data as { day: string; count: number }[]);
              
            } catch (err) {
              console.error('Error re-fetching dashboard data:', err);
            }
          };
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [daysBack]);

  // Separate effect for Audit Logs to handle pagination/filtering without reloading everything
  useEffect(() => {
    const fetchLogs = async () => {
      if (!profile || (profile.role !== 'administrador' && profile.role !== 'coordinador')) return;

      setFetchingLogs(true);
      try {
        const from = (auditPage - 1) * LOGS_PER_PAGE;
        const to = from + LOGS_PER_PAGE - 1;

        let query = supabase
          .from('audit_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (auditFilter !== 'ALL') {
          query = query.eq('action', auditFilter);
        }

        const { data: logs, error, count } = await query;

        if (error) throw error;

        if (logs) {
          setTotalAuditLogs(count || 0);

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
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setFetchingLogs(false);
      }
    };

    fetchLogs();
  }, [profile, auditPage, auditFilter]);

  const lineChartData = useMemo(() => {
    return {
      labels: chartData.map(d => {
        const date = new Date(d.day);
        if (daysBack === 1) {
          return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
        }
        if (daysBack === 7) {
          // Point is the beginning of a 6h interval
          return `${date.getHours()}:00`;
        }
        return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
      }),
      datasets: [
        {
          label: 'Solicitudes',
          data: chartData.map(d => d.count),
          fill: true,
          borderColor: '#137fec',
          backgroundColor: 'rgba(19, 127, 236, 0.1)',
          tension: 0.4,
          pointRadius: daysBack > 14 ? 0 : 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#137fec',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [chartData, daysBack]);

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(16, 25, 34, 0.9)',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 14 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => ` ${context.parsed.y} solicitudes`,
          title: (items) => {
            if (items.length > 0) {
              const date = new Date(chartData[items[0].dataIndex].day);
              if (daysBack === 1) {
                return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
              }
              if (daysBack === 7) {
                const endRange = new Date(date);
                endRange.setHours(endRange.getHours() + 6);
                return `${date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })} ${date.getHours()}:00 - ${endRange.getHours()}:00`;
              }
              return date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });
            }
            return '';
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { family: 'Inter', size: 10, weight: 'bold' },
          color: '#94a3b8',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: daysBack === 1 ? 12 : 7
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          font: { family: 'Inter', size: 10, weight: 'bold' },
          color: '#94a3b8',
          stepSize: 1,
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const statusList = Object.entries(statusDistribution)
    .sort(([, a], [, b]) => b - a);

  const doughnutChartData = useMemo(() => ({
    labels: statusList.map(([status]) => status),
    datasets: [{
      data: statusList.map(([, count]) => count),
      backgroundColor: statusList.map(([status]) => statusColors[status] || '#cbd5e1'),
      borderWidth: 0,
      hoverOffset: 10,
      cutout: '75%',
      borderRadius: 4
    }]
  }), [statusDistribution]);

  const doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(16, 25, 34, 0.9)',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 14 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} (${Math.round((context.raw as number / Object.values(statusDistribution).reduce((a, b) => a + b, 0)) * 100)}%)`
        }
      }
    },
    layout: {
      padding: 30
    }
  };

  // Filters are now handled server-side via useEffect
  const filteredAuditLogs = auditLogs;

  const totalStatusCount = Object.values(statusDistribution).reduce((a, b) => a + b, 0);
  const globalCompletionRate = Math.round(
    (Object.entries(statusDistribution)
      .filter(([status]) => status !== 'POR REVISAR')
      .reduce((acc, [, count]) => acc + count, 0) / (totalStatusCount || 1)) * 100
  );
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPDATE_REQUEST':
      case 'UPDATE_REQUEST_BATCH': return 'edit_note';
      case 'BATCH_CLAIM_REQUESTS':
      case 'CLAIM_REQUEST': return 'assignment_ind';
      case 'BATCH_UNCLAIM_REQUESTS':
      case 'UNCLAIM_REQUEST': return 'assignment_return';
      case 'CREATE_USER': return 'person_add';
      case 'UPDATE_USER':
      case 'UPDATE_USER_ROLE': return 'manage_accounts';
      case 'DELETE_USER_PROFILE':
      case 'DELETE_USER': return 'person_remove';
      default: return 'history';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'UPDATE_REQUEST':
      case 'UPDATE_REQUEST_BATCH': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/30';
      case 'BATCH_CLAIM_REQUESTS':
      case 'CLAIM_REQUEST': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30';
      case 'BATCH_UNCLAIM_REQUESTS':
      case 'UNCLAIM_REQUEST': return 'text-slate-500 bg-slate-100 dark:bg-slate-800';
      case 'CREATE_USER': return 'text-green-500 bg-green-50 dark:bg-green-900/30';
      case 'UPDATE_USER':
      case 'UPDATE_USER_ROLE': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/30';
      case 'DELETE_USER_PROFILE':
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
        <div className="mb-8 animate-fadeInUp">
          <h2 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight mb-1">Resumen Ejecutivo</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Métricas de registro académico basadas en la tabla observaciones.</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover-lift animate-fadeInUp animate-delay-100">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">group</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Estudiantes Únicos</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 animate-countUp">{stats.totalStudents.toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-2">Registrados en el sistema</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover-lift animate-fadeInUp animate-delay-200">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-lg">clinical_notes</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Solicitudes Activas</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 animate-countUp">{stats.activeRequests}</p>
            <p className="text-slate-400 text-xs mt-2">En revisión o por revisar</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover-lift animate-fadeInUp animate-delay-300">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-2 rounded-lg">check_circle</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Tasa de Solución</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 animate-countUp">{stats.completionRate}%</p>
            <p className="text-slate-400 text-xs mt-2">Casos solucionados</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-red-500/20 hover-lift animate-fadeInUp animate-delay-400">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-lg">pending</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Por Revisar</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 animate-countUp">{stats.urgentCases}</p>
            <p className="text-slate-400 text-xs mt-2">Requiere atención inmediata</p>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900 border border-rose-200 dark:border-rose-800/30 rounded-xl p-6 shadow-sm hover-lift animate-fadeInUp animate-delay-500">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-rose-500 bg-rose-100 dark:bg-rose-900/50 p-2 rounded-lg">block</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Tasa de Rechazo</span>
            </div>
            <p className="text-4xl font-black text-rose-600 dark:text-rose-400">{stats.rejectionRate}%</p>
            <p className="text-rose-400 dark:text-rose-500 text-xs mt-2">Casos que no proceden</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/30 rounded-xl p-6 shadow-sm hover-lift animate-fadeInUp animate-delay-600">
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

          <div className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-slate-900 border border-cyan-200 dark:border-cyan-800/30 rounded-xl p-6 shadow-sm hover-lift animate-fadeInUp animate-delay-700">
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
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover-lift animate-fadeInLeft animate-delay-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Volumen de Solicitudes</h3>
                <p className="text-xs text-slate-400 font-medium">Histórico de casos recibidos</p>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[
                  { label: '30d', value: 30 },
                  { label: '14d', value: 14 },
                  { label: '7d', value: 7 },
                  { label: '1d', value: 1 }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setDaysBack(range.value)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      daysBack === range.value
                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 relative">
              {chartData.length > 0 ? (
                <Line data={lineChartData} options={lineChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <p>Cargando datos del gráfico...</p>
                </div>
              )}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col hover-lift animate-fadeInRight animate-delay-700">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg">pie_chart</span>
              Distribución de Estado
            </h3>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="relative size-52">
                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <p className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                    {globalCompletionRate}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Listo</p>
                </div>
              </div>

              <div className="mt-8 space-y-2.5 w-full">
                {statusList.map(([status, count]) => {
                  const percentage = Math.round((count / (totalStatusCount || 1)) * 100);
                  return (
                    <div key={status} className="group flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-2 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: statusColors[status] || '#e2e8f0' }}
                          ></span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">{count}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out animate-fadeInLeft"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: statusColors[status] || '#e2e8f0',
                            opacity: 0.8
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
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
                  onChange={(e) => {
                    setAuditFilter(e.target.value);
                    setAuditPage(1); // Reset to first page on filter change
                  }}
                  className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ALL">Todas las acciones</option>
                  <option value="UPDATE_REQUEST">Edición de Solicitud</option>
                  <option value="UPDATE_REQUEST_BATCH">Actualización Masiva</option>
                  <option value="BATCH_CLAIM_REQUESTS">Toma de Casos</option>
                  <option value="CREATE_USER">Nuevos Usuarios</option>
                  <option value="UPDATE_USER_ROLE">Cambios de Rol</option>
                  <option value="DELETE_USER_PROFILE">Eliminaciones</option>
                </select>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                  {totalAuditLogs} registros totales
                </span>
              </div>
            </div>

            {filteredAuditLogs.length > 0 ? (
              <>
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
                    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 transition-opacity duration-200 ${fetchingLogs ? 'opacity-50' : 'opacity-100'}`}>
                      {auditLogs.map((log) => (
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
                              {actionTranslations[log.action] || log.action.replace('_', ' ')}
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

                {/* Pagination Controls */}
                {totalAuditLogs > LOGS_PER_PAGE && (
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium">
                      Mostrando <span className="font-bold text-slate-700 dark:text-slate-300">{(auditPage - 1) * LOGS_PER_PAGE + 1}</span> a <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(auditPage * LOGS_PER_PAGE, totalAuditLogs)}</span> de <span className="font-bold text-slate-700 dark:text-slate-300">{totalAuditLogs}</span> registros
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                        disabled={auditPage === 1 || fetchingLogs}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        Anterior
                      </button>
                      <button
                        onClick={() => setAuditPage(p => p + 1)}
                        disabled={auditPage * LOGS_PER_PAGE >= totalAuditLogs || fetchingLogs}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        Siguiente
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
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
