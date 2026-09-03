import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Calendar, Bookmark, MessageSquare, ShieldCheck, Tag, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Listing } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reservation modal
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [reserveMessage, setReserveMessage] = useState('');

  // Flag Report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'SPAM' | 'SUSPICIOUS' | 'INAPPROPRIATE' | 'MISLEADING' | 'ABUSIVE'>('SPAM');
  const [reportDetails, setReportDetails] = useState('');

  const fetchDetail = () => {
    if (!id) return;
    setLoading(true);
    api.getListing(id)
      .then((res) => {
        setListing(res.listing);
        setIsSaved(res.isSaved);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto p-12 text-center text-gray-500">Loading listing details...</div>;
  if (error || !listing) return <div className="max-w-4xl mx-auto p-12 text-center text-red-600 font-semibold">{error || 'Listing not found'}</div>;

  const isSeller = user?.id === listing.sellerId;
  const mainImage = listing.images?.[activeImageIdx]?.url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

  const handleToggleSave = async () => {
    if (!user) { openAuthModal(); return; }
    try {
      if (isSaved) {
        setIsSaved(false);
        await api.unsaveListing(listing.id);
      } else {
        setIsSaved(true);
        await api.saveListing(listing.id);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartChat = async () => {
    if (!user) { openAuthModal(); return; }
    try {
      setActionLoading(true);
      const res = await api.createConversation(listing.sellerId, listing.id);
      navigate(`/messages?conversationId=${res.conversation.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuthModal(); return; }
    try {
      setActionLoading(true);
      await api.reserveListing(listing.id, reserveMessage);
      setReserveModalOpen(false);
      alert('Reservation request submitted to seller!');
      fetchDetail();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptReservation = async (reservationId?: string) => {
    try {
      setActionLoading(true);
      await api.acceptReservation(listing.id, reservationId);
      alert('Reservation accepted!');
      fetchDetail();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseListing = async (finalStatus: string = 'SOLD') => {
    try {
      setActionLoading(true);
      await api.closeListing(listing.id, finalStatus);
      alert(`Listing marked as ${finalStatus}!`);
      fetchDetail();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuthModal(); return; }
    try {
      await api.reportContent({
        contentType: 'LISTING',
        targetId: listing.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportModalOpen(false);
      alert('Report submitted for campus moderation review.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link to="/marketplace" className="hover:underline">Marketplace</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-md">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Gallery & Main Image */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden relative">
              <img src={mainImage} alt={listing.title} className="w-full h-full object-contain" />
              
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge type={listing.listingType} />
                <Badge type={listing.status} />
              </div>
            </div>

            {/* Thumbnails */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                {listing.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                      activeImageIdx === idx ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-lg">Item Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>
        </div>

        {/* Right: Price, Status, Seller & Actions */}
        <div className="space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{listing.title}</h1>
              <button
                onClick={handleToggleSave}
                title={isSaved ? 'Unsave' : 'Save'}
                className={`p-2 rounded-full border transition shrink-0 ${
                  isSaved ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Bookmark className="w-5 h-5 fill-current" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                {listing.listingType === 'SELL' ? (
                  <span className="text-3xl font-extrabold text-gray-900">${listing.price?.toFixed(2)}</span>
                ) : listing.listingType === 'GIVE_AWAY' ? (
                  <span className="text-2xl font-bold text-emerald-600">FREE GIVEAWAY</span>
                ) : (
                  <span className="text-lg font-bold text-purple-700">{listing.listingType.replace('_', ' ')}</span>
                )}
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                Condition: {listing.condition.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Pickup Location: <strong className="text-gray-900">{listing.location}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Category: <strong className="text-gray-900">{listing.category?.name}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Posted: {new Date(listing.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Seller Profile</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {listing.seller?.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 text-sm">{listing.seller?.name}</span>
                  </div>
                  {listing.seller?.isVerified && <Badge type="VERIFIED" />}
                  {listing.seller?.department && (
                    <p className="text-xs text-gray-500 mt-0.5">{listing.seller.department}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {!isSeller ? (
                <>
                  <button
                    onClick={handleStartChat}
                    disabled={actionLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4" /> Message Seller
                  </button>

                  {listing.status === 'ACTIVE' && (
                    <button
                      onClick={() => setReserveModalOpen(true)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Clock className="w-4 h-4" /> Request Item Reservation
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-blue-900 block">Seller Dashboard Management</span>
                  
                  {listing.status === 'ACTIVE' && listing.reservations && listing.reservations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-700 font-medium">Pending Reservation Requests:</p>
                      {listing.reservations.filter(r => r.status === 'PENDING').map(r => (
                        <div key={r.id} className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold">{r.buyer.name}</span>
                            <p className="text-[11px] text-gray-500 truncate max-w-[150px]">{r.message}</p>
                          </div>
                          <button
                            onClick={() => handleAcceptReservation(r.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded font-semibold text-[11px]"
                          >
                            Accept
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {listing.status === 'RESERVED' && (
                    <button
                      onClick={() => handleCloseListing('SOLD')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                    >
                      Mark as SOLD / Handed Over
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setReportModalOpen(true)}
                className="w-full py-2 text-xs font-medium text-gray-500 hover:text-red-600 flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Report Inappropriate Listing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Request Modal */}
      {reserveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Request Item Reservation</h3>
            <p className="text-xs text-gray-500">Submit a reservation hold request to the seller.</p>
            
            <form onSubmit={handleRequestReservation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Message to Seller</label>
                <textarea
                  rows={3}
                  placeholder="Hi! I am interested in buying this item. When can we meet?"
                  value={reserveMessage}
                  onChange={(e) => setReserveMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReserveModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Reservation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Moderation Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Report Listing</h3>
            
            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="SPAM">Spam or Duplicate</option>
                  <option value="SUSPICIOUS">Suspicious / Scam</option>
                  <option value="INAPPROPRIATE">Inappropriate Content</option>
                  <option value="MISLEADING">Misleading Information</option>
                  <option value="ABUSIVE">Abusive Behavior</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Details (Optional)</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold"
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
