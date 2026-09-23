import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  CalendarCheck,
  FileText,
  Clock,
  Briefcase,
  Users,
  ShieldCheck,
  Tag,
  DollarSign,
  Activity,
  Headphones,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  return (
    <aside className="sidebar">
      {role === 'CUSTOMER' && (
        <>
          <div className="sidebar-heading">Customer Portal</div>
          <NavLink to="/customer/dashboard" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/customer/create-request" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <PlusCircle size={18} />
            <span>Request Service</span>
          </NavLink>
          <NavLink to="/customer/requests" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={18} />
            <span>My Requests & Quotes</span>
          </NavLink>
          <NavLink to="/customer/bookings" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <CalendarCheck size={18} />
            <span>Active Bookings</span>
          </NavLink>
          <NavLink to="/customer/invoices" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={18} />
            <span>Invoices & Payments</span>
          </NavLink>
        </>
      )}

      {role === 'SERVICE_PROVIDER' && (
        <>
          <div className="sidebar-heading">Provider Portal</div>
          <NavLink to="/provider/dashboard" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/provider/requests" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={18} />
            <span>Market Requests</span>
          </NavLink>
          <NavLink to="/provider/jobs" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Briefcase size={18} />
            <span>Jobs & Evidence</span>
          </NavLink>
          <NavLink to="/provider/availability" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Clock size={18} />
            <span>Availability Slots</span>
          </NavLink>
          <NavLink to="/provider/profile" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={18} />
            <span>Profile & Documents</span>
          </NavLink>
        </>
      )}

      {role === 'PLATFORM_ADMIN' && (
        <>
          <div className="sidebar-heading">Admin Management</div>
          <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Analytics Overview</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Users Control</span>
          </NavLink>
          <NavLink to="/admin/providers" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={18} />
            <span>Provider Verification</span>
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Tag size={18} />
            <span>Categories & Skills</span>
          </NavLink>
          <NavLink to="/admin/pricing" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <DollarSign size={18} />
            <span>Pricing Rules</span>
          </NavLink>
          <NavLink to="/admin/audit-logs" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Activity size={18} />
            <span>Audit Logs</span>
          </NavLink>
        </>
      )}

      {role === 'OPERATIONS_MANAGER' && (
        <>
          <div className="sidebar-heading">Operations Dispatch</div>
          <NavLink to="/operations/dashboard" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/operations/dispatch" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Briefcase size={18} />
            <span>Dispatcher & Jobs</span>
          </NavLink>
        </>
      )}

      {role === 'SUPPORT_AGENT' && (
        <>
          <div className="sidebar-heading">Support Desk</div>
          <NavLink to="/support/dashboard" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Headphones size={18} />
            <span>Disputes & Tickets</span>
          </NavLink>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
