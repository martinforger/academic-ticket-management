import { useState } from 'react';
import { NavigationSidebar } from './components/NavigationSidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { StudentRecords } from './components/StudentRecords';
import { RequestsView } from './components/RequestsView';
import { UserManagement } from './components/UserManagement';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingTour, useOnboarding } from './components/OnboardingTour';

import { PendingApprovalPage } from './components/PendingApprovalPage';

function AppContent() {
  const [activePage, setActivePage] = useState('overview');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const { session, loading, profile, error } = useAuth();
  const { showOnboarding, isReady, completeOnboarding, skipOnboarding, resetOnboarding } = useOnboarding();

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <DashboardOverview />;
      case 'students':
        return <StudentRecords />;
      case 'requests':
        return <RequestsView />;
      case 'users':
        return <UserManagement />;
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

  if (loading || !isReady) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-slate-500 text-sm animate-pulse">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">cloud_off</span>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Error de Conexión</h2>
        <p className="text-slate-500 mb-6 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!session) {
    if (authView === 'register') {
      return <RegisterPage onBackToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onRegisterClick={() => setAuthView('register')} />;
  }

  // Check if user is approved (has a role assigned)
  if (profile?.role === 'sin_asignar' || !profile?.role) {
    return <PendingApprovalPage />;
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <OnboardingTour
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <NavigationSidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {renderContent()}

        {/* Help Button to restart onboarding */}
        <button
          onClick={resetOnboarding}
          className="fixed bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all group z-50"
          title="Ver tour de ayuda"
        >
          <span className="material-symbols-outlined text-xl">help</span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ver tour de ayuda
          </span>
        </button>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
