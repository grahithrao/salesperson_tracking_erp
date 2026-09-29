'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  MapPin,
  TrendingUp,
  Building2,
  CalendarCheck,
  Package,
  ShoppingCart,
  CreditCard,
  FileBarChart,
  Settings,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  LogOut,
  Navigation2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  children?: { title: string; href: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Salespersons: true,
    Clients: false,
    Orders: false,
    Payments: false,
    Reports: false,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Salespersons',
      icon: Users,
      children: [
        { title: 'All Salespersons', href: '/salespersons' },
        { title: 'Attendance', href: '/salespersons/attendance' },
        { title: 'Live Tracking', href: '/salespersons/live' },
        { title: 'Performance', href: '/salespersons/performance' },
      ],
    },
    {
      title: 'Clients',
      icon: Building2,
      children: [
        { title: 'All Clients', href: '/clients' },
        { title: 'Assignments', href: '/clients/assignments' },
        { title: 'Visits', href: '/clients/visits' },
      ],
    },
    {
      title: 'Products',
      href: '/products',
      icon: Package,
    },
    {
      title: 'Orders',
      icon: ShoppingCart,
      children: [
        { title: 'All Orders', href: '/orders' },
        { title: 'Pending Approval', href: '/orders?status=SUBMITTED' },
        { title: 'Confirmed', href: '/orders?status=CONFIRMED' },
        { title: 'Delivered', href: '/orders?status=DELIVERED' },
      ],
    },
    {
      title: 'Payments',
      icon: CreditCard,
      children: [
        { title: 'All Collections', href: '/payments' },
        { title: 'Pending Verification', href: '/payments?status=PENDING' },
      ],
    },
    {
      title: 'Reports',
      icon: FileBarChart,
      children: [
        { title: 'Sales Report', href: '/reports?tab=sales' },
        { title: 'Collection Report', href: '/reports?tab=collections' },
        { title: 'Attendance Report', href: '/reports?tab=attendance' },
        { title: 'Visit Report', href: '/reports?tab=visits' },
        { title: 'Product Sales', href: '/reports?tab=products' },
      ],
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
    },
    {
      title: 'Audit Logs',
      href: '/audit-logs',
      icon: ShieldAlert,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950">
        <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/20">
          <Navigation2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-white text-sm tracking-wide">FIELD TRACK ERP</h1>
          <p className="text-xs text-teal-400 font-medium">Enterprise Suite</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const isSectionOpen = openSections[item.title];
          const isActive = item.href ? pathname === item.href : false;

          if (!hasChildren) {
            return (
              <Link
                key={item.title}
                href={item.href || '#'}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600/15 text-teal-400 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.title}</span>
              </Link>
            );
          }

          return (
            <div key={item.title} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(item.title)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.title}</span>
                </div>
                {isSectionOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {isSectionOpen && (
                <div className="pl-9 pr-2 space-y-0.5">
                  {item.children!.map((sub) => {
                    const isSubActive = pathname === sub.href.split('?')[0];
                    return (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        className={`block px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isSubActive
                            ? 'text-teal-400 bg-teal-500/10 font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        {sub.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
            {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="truncate">
            <p className="text-xs font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-teal-400 uppercase tracking-wider">{user?.role?.replace('_', ' ') || 'Admin'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
