import React from 'react';

export const DashboardOverview: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Page Heading */}
        <div className="mb-8">
          <h2 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight mb-1">Executive Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time academic registration metrics and system status.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">group</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">+2.4%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Students</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">1,240</p>
            <p className="text-slate-400 text-xs mt-2">Active this semester</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-lg">clinical_notes</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">+12%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Active Requests</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">45</p>
            <p className="text-slate-400 text-xs mt-2">12 pending review</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-2 rounded-lg">check_circle</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">+1.2%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Completion Rate</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">94.2%</p>
            <p className="text-slate-400 text-xs mt-2">Average 2.4 days</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-lg">warning</span>
              <span className="text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">-5%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Urgent Cases</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">3</p>
            <p className="text-slate-400 text-xs mt-2">Requires attention</p>
          </div>
        </div>

        {/* Middle Section: Analytics & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Line Graph Mockup */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">Request Volume (30 Days)</h3>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
                <span className="text-xs text-slate-500 font-medium">New Requests</span>
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
                <path d="M0,80 Q50,20 100,50 T200,30 T300,60 T400,10" fill="none" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                <path d="M0,80 Q50,20 100,50 T200,30 T300,60 T400,10 L400,100 L0,100 Z" fill="url(#grad1)" opacity="0.1"></path>
                <defs>
                  <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#137fec" stopOpacity="1"></stop>
                    <stop offset="100%" stopColor="#137fec" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>OCT 01</span>
                <span>OCT 10</span>
                <span>OCT 20</span>
                <span>OCT 30</span>
              </div>
            </div>
          </div>
          {/* Distribution Chart Mockup */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6">Status Distribution</h3>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="size-40 rounded-full border-[16px] border-slate-100 dark:border-slate-800 relative flex items-center justify-center">
                <div className="absolute inset-[-16px] rounded-full border-[16px] border-primary" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 60%)' }}></div>
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">72%</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Approved</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Approved (214)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Pending (42)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Draft (12)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Completed (28)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Recent Activity</h3>
            <button className="text-primary text-sm font-bold hover:underline">View All Activity</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Activity Item 1 */}
            <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBzI1vGqf-q3k3or7GWipkTCjHJCzjspPYRsFx6W8be45BVSxMIs6U5G3bJznpll5vkUHEP7tcmUEHRssu4fSTokEZWoYe-H9kVzbjr4gCmrspDaJ2519wiWVqBtutTSvdLv8FjkZEi4th8SsoLrrzRGc2bo87VA3GXc4CCeYvvx0kQPfAC42wXvLsJFhYgzEM9A12GoJ9bHf-szkJ4Acd0wYYjfz4m--3gdgiVfl_huC2wE0I_CUr4JVGn3PFb5ZeF--I2IEdYrG0f")' }}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-white">
                  <span className="font-bold">Sarah Jenkins</span> updated Transcript Request <span className="font-mono text-primary">#882</span>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Academic Coordinator • 12 minutes ago</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">In Review</span>
                <button className="material-symbols-outlined text-slate-400 hover:text-slate-600">more_vert</button>
              </div>
            </div>
            {/* Activity Item 2 */}
            <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-slate-500">settings_suggest</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-white">
                  <span className="font-bold">System</span> Automated Graduation Audit complete for <span className="font-bold">Cohort 2024</span>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Automated Task • 45 minutes ago</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Completed</span>
                <button className="material-symbols-outlined text-slate-400 hover:text-slate-600">more_vert</button>
              </div>
            </div>
            {/* Activity Item 3 */}
            <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAasFFX5O39vnDcoqlwj6MdZEGerR1SGb5ABcAMcMnC3MQU_AFXqwd0zpOpkVWqY_OKpV4Ty0Mg8IzV_KFRjQFHqTnvN82cF-N0JvgX_A1F2WtuFvTXkKaZNfpczKEUxebgjDZ6cX4zcUBmkyqKk1hqztt5SaxVTO_bmyaYzoX-rsvY5SXqUPhVXjOiiXdU3B9xqKI68HtD_Hdqw_En9_QIst4UJHyTFgYxiZBz56FqTKNWNvpygvF9Nfiz6bt7O6LWnxY6FalgMEws")' }}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-white">
                  <span className="font-bold">Marcus Webb</span> flagged Enrollment Case <span className="font-mono text-primary">#1024</span> as urgent
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Registrar Office • 2 hours ago</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Urgent</span>
                <button className="material-symbols-outlined text-slate-400 hover:text-slate-600">more_vert</button>
              </div>
            </div>
            {/* Activity Item 4 */}
            <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCLOoJCz6BpxaJ3Of1km2N5oLmdhFuPKHBqiGLGW9kZ22cUuJGGYuGekj_edm4IUZZHcrz34equueBWwEl9eSm7UBomRtvLVejG7xYqtdkR13GrY938Vwx0TLRbIARghL-88IGhiNEHp6A9hfoCyikOMdKGGDMG9K8NF9g-xc3uffZZ5FjQPELZ9rARliNBges8bgPBC7X-UREkqqddDS5nIhAUIt8C7toGi_7ZlG1mFHLj-YwgHTNnG4jwf57kmwATAaHeL5FKKJn1")' }}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-white">
                  <span className="font-bold">Elena Rodriguez</span> approved 14 course substitutions for <span className="font-bold">CompSci Major</span>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Department Head • 5 hours ago</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-primary/10 text-primary">Approved</span>
                <button className="material-symbols-outlined text-slate-400 hover:text-slate-600">more_vert</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
