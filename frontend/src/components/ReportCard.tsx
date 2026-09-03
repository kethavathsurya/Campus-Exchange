import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { LostFoundReport } from '../types';
import { Badge } from './Badge';

interface ReportCardProps {
  report: LostFoundReport;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const imageUrl = report.images && report.images.length > 0
    ? report.images[0].url
    : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

  const formattedDate = new Date(report.dateEvent).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={report.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge type={report.reportType} />
          {report.status !== 'LOST' && report.status !== 'FOUND' && <Badge type={report.status} />}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-medium text-gray-600 truncate">{report.category?.name || 'General'}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>

          <Link to={`/reports/${report.id}`}>
            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition text-base leading-snug">
              {report.title}
            </h3>
          </Link>

          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
            {report.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1 truncate max-w-[150px]">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{report.location}</span>
          </div>

          {report.approximateTime && (
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{report.approximateTime}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
