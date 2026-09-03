import React, { useEffect, useState } from 'react';
import { User as UserIcon, Calendar, Building, ShieldCheck, Tag, Trash2, Edit } from 'lucide-react';
import { Listing, LostFoundReport } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { ListingCard } from '../components/ListingCard';
import { ReportCard } from '../components/ReportCard';

export const Profile: React.FC = () => {
  const { user, openAuthModal } = useAuth();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myReports, setMyReports] = useState<LostFoundReport[]>([]);
  const [tab, setTab] = useState<'listings' | 'reports'>('listings');
  const [loading, setLoading] = useState(true);

  const fetchUserData = () => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.getListings({ sellerId: user.id }),
      api.getReports({ reporterId: user.id }),
    ])
      .then(([listRes, repRes]) => {
        setMyListings(listRes.listings);
        setMyReports(repRes.reports);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    try {
      await api.deleteListing(id);
      fetchUserData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Student Profile</h2>
        <p className="text-xs text-gray-500">Log in to view your campus profile and activity.</p>
        <button onClick={openAuthModal} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          Campus Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Profile Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-md">
            {user.name.charAt(0)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {user.isVerified && <Badge type="VERIFIED" />}
            </div>

            <p className="text-xs text-gray-500 font-mono">{user.email}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
              {user.department && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-gray-400" /> {user.department}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Role: {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-center shrink-0">
          <div>
            <div className="text-xl font-extrabold text-blue-600">{myListings.length}</div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase">My Listings</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-blue-600">{myReports.length}</div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase">My Reports</div>
          </div>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-gray-200 bg-white px-4 rounded-xl border">
          <button
            onClick={() => setTab('listings')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
              tab === 'listings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Marketplace Listings ({myListings.length})
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
              tab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Lost & Found Activity ({myReports.length})
          </button>
        </div>

        {tab === 'listings' ? (
          myListings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-xs text-gray-500">
              You haven't posted any marketplace listings yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {myListings.map((listing) => (
                <div key={listing.id} className="relative group">
                  <ListingCard listing={listing} />
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition opacity-0 group-hover:opacity-100 z-10"
                    title="Remove listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          myReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-xs text-gray-500">
              You haven't created any lost or found reports yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {myReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
