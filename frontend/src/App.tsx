import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { ListingDetail } from './pages/ListingDetail';
import { LostAndFound } from './pages/LostAndFound';
import { ReportDetail } from './pages/ReportDetail';
import { SavedListings } from './pages/SavedListings';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { AdminModeration } from './pages/AdminModeration';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/lost-and-found" element={<LostAndFound />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/saved" element={<SavedListings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
        </Routes>
      </main>

      <Footer />
      <AuthModal />
    </div>
  );
};
