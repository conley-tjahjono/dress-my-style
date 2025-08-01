import { useState, useEffect } from 'react';

// 🔐 Custom hook for server-side authentication utilities
export function useServerAuth() {
  const [loading, setLoading] = useState(false);

  // 📡 Fetch session from server-side API
  const getServerSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get session');
      }
      
      console.log('✅ Server session retrieved:', data);
      return data;
    } catch (error) {
      console.error('❌ Error getting server session:', error);
      return { session: null, user: null, error };
    } finally {
      setLoading(false);
    }
  };

  // 🚪 Sign out via server-side API
  const serverSignOut = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign out');
      }
      
      console.log('✅ Server sign out successful:', data);
      return { error: null };
    } catch (error) {
      console.error('❌ Error with server sign out:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // 👤 Fetch user profile from protected API
  const getServerProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected/profile');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get profile');
      }
      
      console.log('✅ Server profile retrieved:', data);
      return data;
    } catch (error) {
      console.error('❌ Error getting server profile:', error);
      return { user: null, profile: null, error };
    } finally {
      setLoading(false);
    }
  };

  // 📝 Update user profile via protected API
  const updateServerProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      console.log('✅ Server profile updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating server profile:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // 👕 Fetch clothes from protected API
  const getServerClothes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected/clothes');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get clothes');
      }
      
      console.log('✅ Server clothes retrieved:', data);
      return data;
    } catch (error) {
      console.error('❌ Error getting server clothes:', error);
      return { clothes: [], count: 0, error };
    } finally {
      setLoading(false);
    }
  };

  // 📝 Add clothing item via protected API
  const addServerClothing = async (clothingData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected/clothes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clothingData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add clothing');
      }
      
      console.log('✅ Server clothing added:', data);
      return data;
    } catch (error) {
      console.error('❌ Error adding server clothing:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // 📝 Update clothing item via protected API
  const updateServerClothing = async (clothingData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected/clothes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clothingData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update clothing');
      }
      
      console.log('✅ Server clothing updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating server clothing:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete clothing item via protected API
  const deleteServerClothing = async (clothingId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/protected/clothes?id=${clothingId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete clothing');
      }
      
      console.log('✅ Server clothing deleted:', data);
      return data;
    } catch (error) {
      console.error('❌ Error deleting server clothing:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getServerSession,
    serverSignOut,
    getServerProfile,
    updateServerProfile,
    getServerClothes,
    addServerClothing,
    updateServerClothing,
    deleteServerClothing
  };
} 