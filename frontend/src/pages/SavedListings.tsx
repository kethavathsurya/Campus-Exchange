import React, { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Listing } from '../types';
import { api } from '../services/api';
import { ListingCard } from '../components/ListingCard';
import { useAuth } from '../context/AuthContext';

export const SavedListings: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = () => {
    if (!user) { setLoading(false); return; }
    api.getSavedListings()
      .then((res) => setSavedListings(res.savedListings))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSaved();
  }, [user]);

  const handleUnsave = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.unsaveListing(listingId);
      setSavedListings(prev => prev.filter(l => l.id !== listingId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Saved Wishlist</h2>
        <p className="text-xs text-gray-500">Log in with your campus account to save and manage listings.</p>
        <button onClick={openAuthModal} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          Campus Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <Bookmark className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Wishlist</h1>
          <p className="text-xs text-gray-500">Your bookmarked marketplace items ({savedListings.length})</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : savedListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
          You haven't saved any marketplace listings yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {savedListings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isSaved={true}
              onToggleSave={handleUnsave}
            />
          ))}
        </div>
      )}
    </div>
  );
};
