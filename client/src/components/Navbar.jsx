import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
      <span className="font-semibold text-sm text-gray-900 tracking-tight">FlowAI</span>
      <div className="flex gap-4 text-xs">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-600'
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-600'
          }
        >
          Dashboard
        </NavLink>
      </div>
    </nav>
  );
}
