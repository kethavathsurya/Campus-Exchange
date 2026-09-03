import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Bookmark, MessageSquare, Bell, User, ShieldAlert, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      api.getConversations().then(res => {
        const totalUnread = res.conversations.reduce((acc, c) => acc + c.unreadCount, 0);
        setUnreadMessages(totalUnread);
      }).catch(() => {});

      api.getNotifications().then(res => {
        setUnreadNotifications(res.unreadCount);
      }).catch(() => {});
    }
  }, [user, location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Campus Indicator */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:bg-blue-700 transition">
                CE
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-lg leading-tight">Campus Exchange</span>
                <span className="text-xs text-gray-500 font-medium">Marketplace & Lost-Found</span>
              </div>
            </Link>

            {user?.isVerified && (
              <div className="hidden lg:block ml-2">
                <Badge type="VERIFIED" />
              </div>
            )}
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search listings, books, cycles, lost items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </form>

          {/* Desktop Nav Actions */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/marketplace"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/marketplace') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Marketplace
            </Link>

            <Link
              to="/lost-and-found"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/lost-and-found') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Lost & Found
            </Link>

            {user ? (
              <>
                <Link
                  to="/saved"
                  title="Saved Listings"
                  className={`p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50 relative transition ${
                    isActive('/saved') ? 'text-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                </Link>

                <Link
                  to="/messages"
                  title="Messages"
                  className={`p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50 relative transition ${
                    isActive('/messages') ? 'text-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </Link>

                <Link
                  to="/notifications"
                  title="Notifications"
                  className={`p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50 relative transition ${
                    isActive('/notifications') ? 'text-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin/moderation"
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Moderation
                  </Link>
                )}

                <div className="h-5 w-px bg-gray-200 mx-1" />

                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-gray-100 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-800 max-w-[100px] truncate">{user.name}</span>
                </Link>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={openAuthModal}
                className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Campus Login
              </button>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </form>

          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Marketplace
          </Link>

          <Link
            to="/lost-and-found"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Lost & Found
          </Link>

          {user ? (
            <>
              <Link
                to="/saved"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Saved Items
              </Link>
              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Messages ({unreadMessages})
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Notifications ({unreadNotifications})
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Profile ({user.name})
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin/moderation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 bg-amber-50"
                >
                  Admin Moderation
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                openAuthModal();
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg"
            >
              Campus Login / Register
            </button>
          )}
        </div>
      )}
    </header>
  );
};
