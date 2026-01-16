import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Building2,
  CalendarCheck,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Empleados', href: '/empleados', icon: Users },
  { name: 'Turnos', href: '/turnos', icon: Clock },
  { name: 'Vist. Programación', href: '/programacion', icon: Calendar },
  { name: 'Generar Programación', href: '/programacion-areas', icon: Building2 },
  { name: 'Gestión Mensual', href: '/gestion-mensual', icon: ClipboardList },
  // { name: 'Recargos', href: '/recargos', icon: DollarSign },
  // { name: 'Novedades', href: '/novedades', icon: FileText },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
  { name: 'Config. Programación y Novedades', href: '/configuracion-programacion', icon: CalendarCheck },
];

export default function Sidebar() {
  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-primary">
            Sistema de Nómina
          </h1>
        </div>

        <nav className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Versión 2.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}