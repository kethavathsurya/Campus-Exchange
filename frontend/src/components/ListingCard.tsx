import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bookmark } from 'lucide-react';
import { Listing } from '../types';
import { Badge } from './Badge';

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  onToggleSave?: (id: string, e: React.MouseEvent) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, isSaved = false, onToggleSave }) => {
  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0].url
    : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative">
      
      {/* Image thumbnail & type badge */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge type={listing.listingType} />
          {listing.status !== 'ACTIVE' && <Badge type={listing.status} />}
        </div>

        {onToggleSave && (
          <button
            onClick={(e) => onToggleSave(listing.id, e)}
            title={isSaved ? 'Remove from saved' : 'Save listing'}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition ${
              isSaved
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-medium text-gray-600 truncate">{listing.category?.name || 'General'}</span>
            <span>{listing.condition.replace('_', ' ')}</span>
          </div>

          <Link to={`/listings/${listing.id}`}>
            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition group-hover:text-blue-600 text-base leading-snug">
              {listing.title}
            </h3>
          </Link>

          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
            {listing.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            {listing.listingType === 'SELL' ? (
              <span className="text-lg font-bold text-gray-900">${listing.price?.toFixed(2)}</span>
            ) : listing.listingType === 'GIVE_AWAY' ? (
              <span className="text-sm font-bold text-emerald-600">FREE</span>
            ) : (
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                {listing.listingType.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center text-xs text-gray-500 gap-1 truncate max-w-[120px]">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
