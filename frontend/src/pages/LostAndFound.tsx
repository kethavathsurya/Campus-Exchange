import React, { useEffect, useState } from 'react';
import { Search, PlusCircle, Filter, Calendar, MapPin, X } from 'lucide-react';
import { LostFoundReport, Category } from '../types';
import { api } from '../services/api';
import { ReportCard } from '../components/ReportCard';
import { useAuth } from '../context/AuthContext';

export const LostAndFound: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  
  const [reportType, setReportType] = useState<'LOST' | 'FOUND'>('LOST');
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');

  // Create Report Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState<'LOST' | 'FOUND'>('LOST');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDateEvent, setNewDateEvent] = useState(new Date().toISOString().split('T')[0]);
  const [newApproxTime, setNewApproxTime] = useState('');
  const [newDistinguishing, setNewDistinguishing] = useState('');
  const [newVisible, setNewVisible] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories)).catch(console.error);
  }, []);

  const fetchReports = () => {
    setLoading(true);
    const params: Record<string, string> = { reportType };
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    if (location) params.location = location;

    api.getReports(params)
      .then((res) => setReports(res.reports))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [reportType, search, categoryId, location]);

  const handleCreateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuthModal(); return; }

    try {
      setCreateError(null);
      await api.createReport({
        reportType: newType,
        title: newTitle,
        description: newDescription,
        categoryId: newCategoryId || categories[0]?.id,
        location: newLocation,
        dateEvent: newDateEvent,
        approximateTime: newApproxTime || undefined,
        distinguishingAttributes: newDistinguishing || undefined,
        visibleAttributes: newVisible || undefined,
        images: newImageUrl.trim() ? [newImageUrl.trim()] : undefined,
      });

      setIsModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewLocation('');
      fetchReports();
    } catch (err: any) {
      setCreateError(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Lost & Found</h1>
          <p className="text-xs text-gray-500">Search missing items or submit reports to run automatic explainable matching</p>
        </div>

        <button
          onClick={() => {
            if (!user) openAuthModal();
            else {
              if (!newCategoryId && categories.length > 0) setNewCategoryId(categories[0].id);
              setIsModalOpen(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Submit Lost / Found Report
        </button>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-xl border">
        <button
          onClick={() => setReportType('LOST')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            reportType === 'LOST' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lost Items Reports
        </button>
        <button
          onClick={() => setReportType('FOUND')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            reportType === 'FOUND' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Found Belongings Reports
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search report titles, descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium text-gray-700"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Location (Library, Cafeteria...)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-60 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 font-medium">
          No active {reportType.toLowerCase()} reports matching specified criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* Create Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Create Lost or Found Report</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{createError}</div>}

            <form onSubmit={handleCreateReportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Report Type *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="LOST">I LOST something</option>
                    <option value="FOUND">I FOUND something</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony Noise Canceling Headphones in Black Case"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Campus Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Library 2nd Floor"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date Event *</label>
                  <input
                    type="date"
                    required
                    value={newDateEvent}
                    onChange={(e) => setNewDateEvent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Approximate Time (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 4:30 PM"
                  value={newApproxTime}
                  onChange={(e) => setNewApproxTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Full Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide complete circumstances, desk numbers, or where item is kept..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {newType === 'LOST' ? 'Distinguishing Attributes (Secret/Specific details)' : 'Visible Attributes'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Octocat sticker, scratch on left hinge..."
                  value={newType === 'LOST' ? newDistinguishing : newVisible}
                  onChange={(e) => newType === 'LOST' ? setNewDistinguishing(e.target.value) : setNewVisible(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Photo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
