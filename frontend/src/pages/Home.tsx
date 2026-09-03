import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, SearchCheck, ArrowRight, ShieldCheck, Tag, PlusCircle } from 'lucide-react';
import { Listing, LostFoundReport, Category } from '../types';
import { api } from '../services/api';
import { ListingCard } from '../components/ListingCard';
import { ReportCard } from '../components/ReportCard';
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [recentReports, setRecentReports] = useState<LostFoundReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getListings({ limit: '6', sort: 'newest' }),
      api.getReports({ limit: '4' }),
    ])
      .then(([catRes, listRes, repRes]) => {
        setCategories(catRes.categories);
        setRecentListings(listRes.listings);
        setRecentReports(repRes.reports);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-14 px-4 sm:px-6 lg:px-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-100 backdrop-blur-sm text-xs font-semibold border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Campus-Only Student Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Buy, Sell & Recover Belongings Across Campus
          </h1>

          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Replace chaotic chat groups with one organized campus exchange. Verified student marketplace and explainable lost-and-found matching.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center bg-white rounded-xl p-1.5 shadow-lg border border-white/20">
            <Search className="w-5 h-5 text-gray-400 ml-3" />
            <input
              type="text"
              placeholder="Search textbooks, TI-84 calculators, cycles, lost keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition shrink-0"
            >
              Search
            </button>
          </form>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-semibold text-sm rounded-lg transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Explore Marketplace
            </Link>
            <Link
              to="/lost-and-found"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition border border-white/20"
            >
              <SearchCheck className="w-4 h-4" />
              Lost & Found Reports
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/marketplace?categoryId=${cat.id}`}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
                <Tag className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-800 line-clamp-1">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Marketplace Listings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Marketplace Listings</h2>
            <p className="text-xs text-gray-500">Fresh used items posted by verified students</p>
          </div>
          <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Lost & Found */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Active Lost & Found Reports</h2>
            <p className="text-xs text-gray-500">Help fellow students recover missing belongings</p>
          </div>
          <Link to="/lost-and-found" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
            View Reports & Matches <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recentReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </section>
    </div>
  );
};
