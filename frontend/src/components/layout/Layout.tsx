import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 print:block print:h-auto print:bg-white">
      {/* Sidebar – oculto al imprimir */}
      <div className="print:hidden">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
        {/* TopBar – oculta al imprimir */}
        <div className="print:hidden">
          <TopBar />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

