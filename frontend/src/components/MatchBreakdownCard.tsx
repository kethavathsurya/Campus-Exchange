import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { MatchScoreResult } from '../types';
import { Badge } from './Badge';

interface MatchBreakdownCardProps {
  matchResult: MatchScoreResult;
}

export const MatchBreakdownCard: React.FC<MatchBreakdownCardProps> = ({ matchResult }) => {
  const { report, score, factors, details } = matchResult;

  const scoreColor = score >= 70
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : score >= 40
    ? 'text-blue-700 bg-blue-50 border-blue-200'
    : 'text-amber-700 bg-amber-50 border-amber-200';

  const barColor = score >= 70
    ? 'bg-emerald-500'
    : score >= 40
    ? 'bg-blue-500'
    : 'bg-amber-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow transition space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge type={report.reportType} />
            <span className="text-xs text-gray-500">{report.category?.name}</span>
          </div>
          <Link to={`/reports/${report.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition">
            {report.title}
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              {report.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              {new Date(report.dateEvent).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Score Pill */}
        <div className={`px-3 py-1.5 rounded-lg border text-center font-bold ${scoreColor}`}>
          <div className="text-lg leading-none">{score}</div>
          <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Score</div>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>

      {/* Matching Factors Breakdown */}
      <div className="grid grid-cols-5 gap-1 text-[11px] text-center bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium">
        <div>
          <div className="text-gray-400">Category</div>
          <div className="font-bold text-gray-700">{factors.categoryMatch}/30</div>
        </div>
        <div>
          <div className="text-gray-400">Location</div>
          <div className="font-bold text-gray-700">{factors.locationSimilarity}/25</div>
        </div>
        <div>
          <div className="text-gray-400">Date</div>
          <div className="font-bold text-gray-700">{factors.dateSimilarity}/20</div>
        </div>
        <div>
          <div className="text-gray-400">Keywords</div>
          <div className="font-bold text-gray-700">{factors.keywordOverlap}/15</div>
        </div>
        <div>
          <div className="text-gray-400">Attributes</div>
          <div className="font-bold text-gray-700">{factors.attributeOverlap}/10</div>
        </div>
      </div>

      {/* Bullet factors */}
      <div className="space-y-1 pt-1">
        {details.map((detail, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
            <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
            <span>{detail}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <Link
          to={`/reports/${report.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Inspect Report Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
