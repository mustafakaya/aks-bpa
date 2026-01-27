import { Outlet, NavLink } from 'react-router-dom'
import {
  Home24Regular,
  Server24Regular,
  DocumentSearch24Regular,
  Lightbulb24Regular,
  Settings24Regular,
} from '@fluentui/react-icons'

const navItems = [
  { to: '/', icon: Home24Regular, label: 'Dashboard' },
  { to: '/clusters', icon: Server24Regular, label: 'Clusters' },
  { to: '/scans', icon: DocumentSearch24Regular, label: 'Scans' },
  { to: '/recommendations', icon: Lightbulb24Regular, label: 'Recommendations' },
  { to: '/settings', icon: Settings24Regular, label: 'Settings' },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K8s</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800">AKS BPA</h1>
              <p className="text-xs text-gray-500">Best Practices Assessment</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                  end={item.to === '/'}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            AKS BPA v2.0.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
