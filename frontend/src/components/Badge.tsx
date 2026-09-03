import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface BadgeProps {
  type: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, className = '' }) => {
  switch (type) {
    case 'VERIFIED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Verified Member
        </span>
      );
    case 'SELL':
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 ${className}`}>SELL</span>;
    case 'EXCHANGE':
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 ${className}`}>EXCHANGE</span>;
    case 'GIVE_AWAY':
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 ${className}`}>GIVE AWAY</span>;
    case 'BUY_REQUEST':
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 ${className}`}>BUY REQUEST</span>;
    case 'ACTIVE':
      return <span className={`px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ${className}`}>Active</span>;
    case 'RESERVED':
      return <span className={`px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 ${className}`}>Reserved</span>;
    case 'SOLD':
    case 'EXCHANGED':
    case 'GIVEN_AWAY':
      return <span className={`px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 ${className}`}>{type}</span>;
    case 'LOST':
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 ${className}`}>LOST</span>;
    case 'FOUND':
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 ${className}`}>FOUND</span>;
    case 'CLAIMED':
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 ${className}`}>CLAIMED</span>;
    case 'RESOLVED':
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 ${className}`}>RESOLVED</span>;
    default:
      return <span className={`px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 ${className}`}>{type}</span>;
  }
};
