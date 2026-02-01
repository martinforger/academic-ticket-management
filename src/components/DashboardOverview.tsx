import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Request, AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const DashboardOverview: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeRequests: 0,
    completionRate: 0,
    urgentCases: 0
  });
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { userName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('observaciones')
          .select('*');

        if (error) throw error;

        const requests = data as any[];
        
        // 1. Estadísticas básicas
        const uniqueStudents = new Set(requests.map(r => r.cédula)).size;
        const active = requests.filter(r => ['POR REVISAR', 'EN REVISIÓN'].includes(r.estatus)).length;
        const solved = requests.filter(r => r.estatus === 'SOLUCIONADO').length;
        const total = requests.length;
        const urgent = requests.filter(r => r.estatus === 'POR REVISAR').length;

        setStats({
          totalStudents: uniqueStudents,
          activeRequests: active,
          completionRate: total > 0 ? Math.round((solved / total) * 100) : 0,
          urgentCases: urgent
        });

        // 2. Distribución de Estados
        const distribution: Record<string, number> = {};
        requests.forEach(r => {
          distribution[r.estatus] = (distribution[r.estatus] || 0) + 1;
        });
        setStatusDistribution(distribution);

        // 3. Gráfico de Volumen (Últimos 30 días)
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const dailyCounts: Record<string, number> = {};
        // Inicializar los 30 días con 0
        for (let i = 0; i <= 30; i++) {
          const d = new Date(thirtyDaysAgo);
          d.setDate(d.getDate() + i);
          dailyCounts[d.toISOString().split('T')[0]] = 0;
        }

        requests.forEach(r => {
          if (r.fecha) {
            const dateStr = new Date(r.fecha).toISOString().split('T')[0];
            if (dailyCounts[dateStr] !== undefined) {
              dailyCounts[dateStr]++;
            }
          }
        });

        const sortedDates = Object.keys(dailyCounts).sort();
        const maxCount = Math.max(...Object.values(dailyCounts), 1);
        
        const points = sortedDates.map((date, index) => ({
          x: (index / 30) * 400,
          y: 100 - (dailyCounts[date] / maxCount) * 80 - 10 // Entre 10 y 90 para margen
        }));
        
        setChartData(points);

        // 4. Audit Logs (Only for Admin/Coordinator)
        if (profile && (profile.role === 'administrador' || profile.role === 'coordinador')) {
            const { data: logs, error: logsError } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (!logsError && logs) {
                // Fetch user names
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
  }, []);

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

  const statusColors: Record<string, string> = {
    'SOLUCIONADO': '#137fec',
    'POR REVISAR': '#fbbf24',
    'NO PROCEDE': '#f87171',
    'EN REVISIÓN': '#60a5fa',
    'REPETIDO': '#94a3b8',
    'IGNORADO': '#cbd5e1',
    'REVISADO': '#34d399'
  };

  const getDonutSegments = () => {
    const total = Object.values(statusDistribution).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    let currentAngle = -90; // Empezar arriba
    return Object.entries(statusDistribution).map(([status, count]) => {
      const percentage = (count / total) * 100;
      const angle = (count / total) * 360;
      
      // Cálculo de arco SVG
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">group</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Estudiantes Únicos</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.totalStudents.toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-2">Registrados en el sistema</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-lg">clinical_notes</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Solicitudes Activas</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.activeRequests}</p>
            <p className="text-slate-400 text-xs mt-2">En revisión o por revisar</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-2 rounded-lg">check_circle</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Tasa de Solución</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.completionRate}%</p>
            <p className="text-slate-400 text-xs mt-2">Casos solucionados</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-lg">pending</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Por Revisar</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.urgentCases}</p>
            <p className="text-slate-400 text-xs mt-2">Requiere atención inmediata</p>
          </div>
        </div>

        {/* Middle Section: Analytics & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Line Graph Mockup */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">Volumen de Solicitudes (30 Días)</h3>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
                <span className="text-xs text-slate-500 font-medium">Nuevas Solicitudes</span>
              </div>
            </div>
            <div className="h-64 flex flex-col justify-end gap-2 relative">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-2">
                <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
                <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
                <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
                <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
              </div>
              {/* Simple SVG Line Visualization */}
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
          {/* Distribution Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6">Distribución de Estado</h3>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="relative size-48">
                <svg viewBox="0 0 100 100" className="size-full transform rotate-0">
                  {/* Fondo gris */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                  {/* Segmentos dinámicos */}
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

              {/* Legend with fixed truncation */}
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

        {/* Bottom Section: Audit Logs (Admin/Coord Only) */}
        {auditLogs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden col-span-2 animate-fade-in-up">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">history_edu</span>
                Registro de Auditoría
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Últimos movimientos del sistema</span>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Usuario</th>
                        <th className="px-6 py-3">Acción</th>
                        <th className="px-6 py-3">Detalle</th>
                        <th className="px-6 py-3 text-right">Fecha</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {log.userName?.substring(0,2).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-gray-200">{log.userName}</span>
                                </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 font-bold">
                                    {log.action}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-slate-600 dark:text-slate-400 max-w-md truncate">
                                {log.details?.description || 'Cambios en solicitud'} 
                                {log.changes && Object.keys(log.changes).length > 0 && (
                                    <span className="ml-2 text-xs text-slate-400 italic">
                                        ({Object.keys(log.changes).join(', ')})
                                    </span>
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
        </div>
        )}
      </div>
    </div>
  );
};
