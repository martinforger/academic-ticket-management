import React, { useState } from 'react';
import type { StudentSummary, Request } from '../types';

interface StudentRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentSummary | null;
}

const RequestItem = ({ request }: { request: Request }) => {
  const isAdd = request.action === 'Agregar';
  // Define full classes to avoid Tailwind interpolation issues
  const iconBgClasses = isAdd
    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";

  const badgeClasses = isAdd
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
    : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-200 dark:border-rose-800";

  const icon = isAdd ? 'add_circle' : 'remove_circle';
  const label = isAdd ? 'ADD COURSE' : 'DROP COURSE';

  // State for form fields - initialized with props
  const [status, setStatus] = useState(request.status);
  const [response, setResponse] = useState(request.response || '');

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
            <p className="text-xs text-slate-500 font-mono">NRC: {request.nrc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}>
            {label}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span> {formatDate(request.date)}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Student Justification */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Justification</label>
          <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg border border-[#e7edf3] dark:border-gray-700 italic text-slate-600 dark:text-slate-300 text-sm leading-relaxed relative min-h-[100px]">
            <span className="material-symbols-outlined absolute top-2 left-2 text-slate-200 dark:text-slate-700 text-4xl -z-0 select-none">format_quote</span>
            <span className="relative z-10">{request.comments || "No justification provided."}</span>
          </div>
        </div>

        {/* Right: Admin Action */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Dropdown */}
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full appearance-none rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-[#0d141b] dark:text-white py-2.5 pl-3 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="SOLUCIONADO">Resolved (Solucionado)</option>
                  <option value="EN REVISIÓN">In Review (En revisión)</option>
                  <option value="NO PROCEDE">Rejected (No Procede)</option>
                  <option value="POR REVISAR">Pending (Por Revisar)</option>
                  <option value="REPETIDO/IGNORADO">Ignored (Repetido)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </label>

            {/* Action Type (Only for ADD) */}
            {isAdd && (
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Type</span>
                <div className="relative">
                  <select className="w-full appearance-none rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-[#0d141b] dark:text-white py-2.5 pl-3 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                    <option value="override">Override Capacity</option>
                    <option value="waitlist">Add to Waitlist</option>
                    <option value="regular">Regular Add</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Response Text Area */}
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response to Student</span>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-[#0d141b] dark:text-white p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-400 transition-all hover:border-primary/50 resize-none h-[80px]"
              placeholder={`Type a reply to ${request.studentName.split(' ')[0]}...`}
            ></textarea>
          </label>
        </div>
      </div>
    </div>
  );
};

export const StudentRequestDetailModal: React.FC<StudentRequestDetailModalProps> = ({ isOpen, onClose, student }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
        {/* Backdrop */}
        <div
            className="fixed inset-0 z-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className="relative z-10 bg-white dark:bg-surface-dark w-full max-w-[1000px] h-full max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e7edf3] dark:border-gray-700 bg-white dark:bg-surface-dark shrink-0">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-[#0d141b] dark:text-white leading-tight">Student Request Details</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Reviewing enrollment actions for Fall 2024</p>
                </div>
                <button
                    onClick={onClose}
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
                            <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm">
                                {student.avatarUrl ? (
                                    <img src={student.avatarUrl} alt={student.studentName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                                        {student.studentName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-[#0d141b] dark:text-white">{student.studentName}</h3>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Active</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">badge</span>
                                    ID: {student.studentId}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">school</span>
                                    {student.department} Engineering
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                                    Total Credits: {student.totalCredits}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">alternate_email</span>
                                    {student.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[18px]">history_edu</span>
                                View Transcript
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-[#0d141b] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">timeline</span>
                        Request Timeline
                    </h3>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-surface-dark px-3 py-1 rounded-full border border-[#e7edf3] dark:border-gray-700">
                        {student.requests.length} Requests Pending
                    </span>
                </div>

                {/* Timeline Items */}
                <div className="space-y-4">
                    {student.requests.map((req, idx) => (
                        <RequestItem key={`${req.nrc}-${idx}`} request={req} />
                    ))}
                </div>
            </div>

            {/* Footer Action Bar */}
            <div className="px-6 py-4 border-t border-[#e7edf3] dark:border-gray-700 bg-white dark:bg-surface-dark shrink-0 flex justify-between items-center">
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors"
                >
                    Cancel
                </button>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Save Draft
                    </button>
                    <button className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-blue-600 shadow-sm shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Save & Notify Student
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
