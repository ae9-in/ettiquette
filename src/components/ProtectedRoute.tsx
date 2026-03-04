import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function getHomeRouteByRole(role: string | undefined) {
  if (role === 'platform_admin') return '/admin';
  if (role === 'hr') return '/hr';
  return '/employee';
}

export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactElement;
  role: 'employee' | 'hr' | 'platform_admin';
}) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Securing Access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but profile is missing (should be caught by AuthContext, but safety first)
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== role) {
    return <Navigate to={getHomeRouteByRole(profile.role)} replace />;
  }

  return children;
}
