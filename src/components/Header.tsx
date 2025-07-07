'use client';

import React, { useState } from 'react';
import { Plus, Zap, LogOut, User } from 'lucide-react';
import NavigationTabs from './NavigationTabs';
import AddClothesForm from './AddClothesForm';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const [showAddClothesForm, setShowAddClothesForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading, showTimeoutWarning, extendSession, signOut } = useAuth();

  return (
    <>
      <header className="bg-white py-8">
        <div className="flex items-center justify-between h-full">
          <div>
            <h1 className="text-7xl font-bold">My Closet</h1>
            <p className="text-base font-normal">Elevate your closet with AI</p>
          </div>
          
          {/* Right: Buttons */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            ) : user ? (
              <>
                {/* Add Clothes Button */}
            <button
                  onClick={() => setShowAddClothesForm(true)}
              className="flex items-center gap-2 h-10 px-5 rounded-lg border border-[var(--bg-positive-hover)] bg-[var(--bg-positive-default)] hover:bg-[var(--bg-positive-hover)] transition-colors min-w-[142px]"
            >
              <Plus size={16} strokeWidth={1.6} className="text-[var(--bg-positive-tertiary)]" />
                  <span className="text-[var(--bg-positive-tertiary)] font-medium">Add Clothes</span>
            </button>
                
                {/* AI Assistant Button */}
            <button
              className="flex items-center gap-2 h-10 px-5 rounded-lg border border-[var(--bg-positive-hover)] bg-[var(--bg-positive-secondary)] hover:bg-[var(--bg-positive-default)] transition-colors min-w-[138px]"
            >
              <Zap size={16} strokeWidth={1.6} className="text-[var(--bg-positive-hover)]" />
                  <span className="text-[var(--bg-positive-hover)] font-medium">AI Assistant</span>
                </button>

                {/* User Profile & Logout */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button 
                    onClick={signOut}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={18} strokeWidth={2} className="text-gray-600" />
            </button>
                </div>
              </>
            ) : (
              /* Login Button */
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 h-10 px-5 rounded-lg border border-[var(--bg-positive-hover)] bg-[var(--bg-positive-default)] hover:bg-[var(--bg-positive-hover)] transition-colors min-w-[120px]"
              >
                <User size={16} strokeWidth={1.6} className="text-[var(--bg-positive-tertiary)]" />
                <span className="text-[var(--bg-positive-tertiary)] font-medium">Sign In</span>
            </button>
            )}
          </div>
        </div>
      </header>
      <NavigationTabs />
      
      {/* Add Clothes Form Sidebar */}
      {user && (
        <AddClothesForm 
          isOpen={showAddClothesForm}
          onClose={() => setShowAddClothesForm(false)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Session Timeout Warning Modal */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Expiring Soon</h3>
              <p className="text-gray-600 mb-6">
                You'll be automatically logged out in 5 minutes due to inactivity. 
                Would you like to stay logged in?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={extendSession}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Stay Logged In
                </button>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Log Out Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header; 