import { useState } from 'react';
import { Header } from './components/Header';
import { NavigationSidebar } from './components/NavigationSidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { StudentRecords } from './components/StudentRecords';
import { LoginPage } from './components/LoginPage';

function App() {
  const [activePage, setActivePage] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <DashboardOverview />;
      case 'students':
        return <StudentRecords />;
      default:
        return (
            <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center text-slate-500">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl mb-4">construction</span>
                    <h2 className="text-2xl font-bold mb-2">Trabajo en Progreso</h2>
                    <p>La página {activePage} está en construcción.</p>
                </div>
            </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <NavigationSidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
