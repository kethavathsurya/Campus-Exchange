import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Search, PlusCircle, Bookmark, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Listing, Category } from '../types';
import { api } from '../services/api';
import { ListingCard } from '../components/ListingCard';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

export const Marketplace: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [listingType, setListingType] = useState(searchParams.get('listingType') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Create Listing Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newListingType, setNewListingType] = useState<'SELL' | 'EXCHANGE' | 'GIVE_AWAY' | 'BUY_REQUEST'>('SELL');
  const [newPrice, setNewPrice] = useState('');
  const [newCondition, setNewCondition] = useState<'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'USED'>('GOOD');
  const [newLocation, setNewLocation] = useState('');
  const [newImageUrls, setNewImageUrls] = useState<string[]>(['']);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories)).catch(console.error);

    if (user) {
      api.getSavedListings().then((res) => {
        setSavedIds(new Set(res.savedListings.map(l => l.id)));
      }).catch(console.error);
    }
  }, [user]);

  const fetchListings = () => {
    setLoading(true);
    const params: Record<string, string> = { page: page.toString(), limit: '9', sort };
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    if (listingType) params.listingType = listingType;
    if (condition) params.condition = condition;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    api.getListings(params)
      .then((res) => {
        setListings(res.listings);
        setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, [search, categoryId, listingType, condition, minPrice, maxPrice, sort, page]);

  const handleToggleSave = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    const isSaved = savedIds.has(listingId);
    const nextSet = new Set(savedIds);
    if (isSaved) {
      nextSet.delete(listingId);
      setSavedIds(nextSet);
      await api.unsaveListing(listingId);
    } else {
      nextSet.add(listingId);
      setSavedIds(nextSet);
      await api.saveListing(listingId);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await api.uploadImage(file);
      const updated = [...newImageUrls];
      updated[idx] = url;
      setNewImageUrls(updated);
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    const validImages = newImageUrls.filter(u => u.trim().length > 0);
    if (validImages.length === 0) {
      setCreateError('Please upload or provide at least one image URL');
      return;
    }

    try {
      setCreateError(null);
      await api.createListing({
        title: newTitle,
        description: newDescription,
        categoryId: newCategoryId || categories[0]?.id,
        listingType: newListingType,
        price: newListingType === 'SELL' ? parseFloat(newPrice) : null,
        condition: newCondition,
        location: newLocation,
        images: validImages,
      });

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPrice('');
      setNewLocation('');
      fetchListings();
    } catch (err: any) {
      setCreateError(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Marketplace</h1>
          <p className="text-xs text-gray-500">Buy, sell, exchange, or give away items within verified campus community</p>
        </div>

        <button
          onClick={() => {
            if (!user) openAuthModal();
            else {
              if (!newCategoryId && categories.length > 0) setNewCategoryId(categories[0].id);
              setIsCreateModalOpen(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Create Listing
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" /> Filter Listings
            </span>
            {(search || categoryId || listingType || condition || minPrice || maxPrice) && (
              <button
                onClick={() => {
                  setSearch(''); setCategoryId(''); setListingType(''); setCondition(''); setMinPrice(''); setMaxPrice(''); setPage(1);
                }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Keywords</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Title or description..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Listing Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Listing Type</label>
            <select
              value={listingType}
              onChange={(e) => { setListingType(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="SELL">SELL</option>
              <option value="EXCHANGE">EXCHANGE</option>
              <option value="GIVE_AWAY">GIVE AWAY (FREE)</option>
              <option value="BUY_REQUEST">BUY REQUEST</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => { setCondition(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Any Condition</option>
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="USED">Used</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Price Range ($)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Listings Grid Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Top Sort & Count Bar */}
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-600 font-medium">
              Showing <span className="font-bold text-gray-900">{meta.total}</span> active listings
            </span>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-md px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
              <p className="text-gray-500 font-medium">No marketplace listings found matching your filters.</p>
              <button
                onClick={() => {
                  setSearch(''); setCategoryId(''); setListingType(''); setCondition(''); setMinPrice(''); setMaxPrice('');
                }}
                className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={savedIds.has(listing.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-gray-700 px-3">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Listing Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Create Campus Listing</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{createError}</div>}

            <form onSubmit={handleCreateListingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Algorithms 4th Ed"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Listing Type *</label>
                  <select
                    value={newListingType}
                    onChange={(e) => setNewListingType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="SELL">SELL</option>
                    <option value="EXCHANGE">EXCHANGE</option>
                    <option value="GIVE_AWAY">GIVE AWAY (FREE)</option>
                    <option value="BUY_REQUEST">BUY REQUEST</option>
                  </select>
                </div>
              </div>

              {newListingType === 'SELL' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="45.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Item Condition *</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="NEW">New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="USED">Used</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Campus Pickup Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Science Library, Hostel Block A..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Item Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail condition, included accessories, pickup availability..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              {/* Image Upload / URL */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Listing Image</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 0)}
                      className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingImage && <span className="text-xs text-blue-600 animate-pulse">Uploading image...</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter Image URL (https://...)"
                    value={newImageUrls[0] || ''}
                    onChange={(e) => setNewImageUrls([e.target.value])}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
