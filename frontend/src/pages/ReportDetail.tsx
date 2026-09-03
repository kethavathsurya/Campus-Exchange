import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Sparkles, ShieldCheck, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { LostFoundReport, MatchScoreResult, Claim } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { MatchBreakdownCard } from '../components/MatchBreakdownCard';

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, openAuthModal } = useAuth();

  const [report, setReport] = useState<LostFoundReport | null>(null);
  const [matches, setMatches] = useState<MatchScoreResult[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Claim Modal
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimExplanation, setClaimExplanation] = useState('');
  const [claimQuestion, setClaimQuestion] = useState('');
  const [claimAnswer, setClaimAnswer] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const fetchDetail = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getReport(id),
      api.getReportMatches(id),
      user ? api.getReportClaims(id).catch(() => ({ claims: [] })) : Promise.resolve({ claims: [] }),
    ])
      .then(([repRes, matchRes, claimRes]) => {
        setReport(repRes.report);
        setMatches(matchRes.matches);
        setClaims(claimRes.claims);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id, user]);

  if (loading) return <div className="max-w-4xl mx-auto p-12 text-center text-gray-500">Loading report details...</div>;
  if (!report) return <div className="max-w-4xl mx-auto p-12 text-center text-red-600 font-semibold">Report not found</div>;

  const isReporter = user?.id === report.reporterId;
  const userClaim = claims.find(c => c.claimantId === user?.id);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuthModal(); return; }
    try {
      setSubmittingClaim(true);
      await api.createClaim(report.id, {
        explanation: claimExplanation,
        verificationQuestion: claimQuestion || undefined,
        verificationAnswer: claimAnswer || undefined,
      });
      setClaimModalOpen(false);
      alert('Claim submitted! The report owner has been notified.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleUpdateClaimStatus = async (claimId: string, status: string) => {
    try {
      await api.updateClaimStatus(claimId, status);
      alert(`Claim status updated to ${status}. Case resolution handled.`);
      fetchDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link to="/lost-and-found" className="hover:underline">Lost & Found</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-md">{report.title}</span>
      </div>

      {/* Main Report Header & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge type={report.reportType} />
                  <Badge type={report.status} />
                  <span className="text-xs text-gray-500 font-medium">{report.category?.name}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              </div>
            </div>

            {report.images && report.images.length > 0 && (
              <div className="aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden">
                <img src={report.images[0].url} alt={report.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="space-y-0.5">
                <span className="text-gray-400 font-medium block">Campus Location</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {report.location}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-gray-400 font-medium block">Event Date</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {new Date(report.dateEvent).toLocaleDateString()}
                </span>
              </div>
              {report.approximateTime && (
                <div className="space-y-0.5">
                  <span className="text-gray-400 font-medium block">Approx. Time</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {report.approximateTime}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-gray-900 text-sm">Circumstances & Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{report.description}</p>
            </div>

            {(report.distinguishingAttributes || report.visibleAttributes) && (
              <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl space-y-1">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">Item Attributes</span>
                <p className="text-xs text-blue-800">
                  {report.distinguishingAttributes || report.visibleAttributes}
                </p>
              </div>
            )}
          </div>

          {/* Explainable Matching Engine Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Explainable Matching Matches</h3>
                <p className="text-xs text-gray-500">
                  Calculated using transparent scoring: Category (30pts), Location (25pts), Date (20pts), Keywords (15pts), Attributes (10pts).
                </p>
              </div>
            </div>

            {matches.length === 0 ? (
              <div className="p-6 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                No potential matching {report.reportType === 'LOST' ? 'FOUND' : 'LOST'} reports scored above threshold at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((m) => (
                  <MatchBreakdownCard key={m.report.id} matchResult={m} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Reporter Profile, Claim Action & Owner Panel */}
        <div className="space-y-6">
          
          {/* Reporter Profile */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Reporter</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                {report.reporter?.name.charAt(0)}
              </div>
              <div>
                <span className="font-semibold text-gray-900 text-sm block">{report.reporter?.name}</span>
                {report.reporter?.isVerified && <Badge type="VERIFIED" />}
                {report.reporter?.department && <p className="text-xs text-gray-500 mt-0.5">{report.reporter.department}</p>}
              </div>
            </div>

            {/* Claim Action for non-reporters */}
            {!isReporter && report.reportType === 'FOUND' && report.status !== 'RESOLVED' && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                {userClaim ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-amber-900 block">Claim Submitted</span>
                    <p className="text-amber-800">Status: <strong>{userClaim.status}</strong></p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) openAuthModal();
                      else setClaimModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Ownership Claim
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Owner Claim Review Panel */}
          {isReporter && claims.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm">Submitted Claims ({claims.length})</h3>
              
              <div className="space-y-3">
                {claims.map((c) => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{c.claimant?.name}</span>
                      <Badge type={c.status} />
                    </div>
                    
                    <p className="text-gray-700">{c.explanation}</p>

                    {c.verificationAnswer && (
                      <div className="bg-white p-2 rounded border border-gray-200 text-[11px] space-y-0.5">
                        <span className="font-semibold text-gray-500 block">Verification Q&A:</span>
                        <p className="text-gray-800">{c.verificationAnswer}</p>
                      </div>
                    )}

                    {c.status === 'PENDING' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateClaimStatus(c.id, 'ACCEPTED')}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px]"
                        >
                          Accept Claim
                        </button>
                        <button
                          onClick={() => handleUpdateClaimStatus(c.id, 'REJECTED')}
                          className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded text-[11px]"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Claim Submission Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Submit Ownership Claim</h3>
            <p className="text-xs text-gray-500">Provide proof of ownership for the finder to review.</p>

            <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Explanation of Ownership *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain when and where you lost this item, contents inside..."
                  value={claimExplanation}
                  onChange={(e) => setClaimExplanation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Verification Answer (Secret Details)</label>
                <input
                  type="text"
                  placeholder="e.g. Octocat sticker on the right ear cup..."
                  value={claimAnswer}
                  onChange={(e) => setClaimAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-sm"
                >
                  {submittingClaim ? 'Submitting...' : 'Send Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
