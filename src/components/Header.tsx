'use client';

import React, { useState } from 'react';
import { Plus, Zap, LogOut, User } from 'lucide-react';
import AddClothesForm from './AddClothesForm';
import AuthModal from './AuthModal';
import AIAssistant from './AIAssistant';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const [showAddClothesForm, setShowAddClothesForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const { user, loading, signOut } = useAuth();

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
              onClick={() => setShowAIAssistant(true)}
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
      
      {/* Add Clothes Form Sidebar */}
      {user && (
        <AddClothesForm 
          isOpen={showAddClothesForm}
          onClose={() => setShowAddClothesForm(false)}
          onAddSuccess={(newItem) => {
            // Close the form
            setShowAddClothesForm(false);
            // Dispatch custom event to notify Clothes component
            window.dispatchEvent(new CustomEvent('clothesAdded', { detail: newItem }));
          }}
        />
      )}

      {/* AI Assistant Sidebar */}
      {user && (
        <AIAssistant 
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default Header; 