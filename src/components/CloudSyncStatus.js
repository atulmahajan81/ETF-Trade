// Cloud Sync Status Component
// Shows the current cloud synchronization status

import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Wifi, WifiOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import cloudDataService from '../services/cloudDataService';

const CloudSyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSync, setLastSync] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const currentUserRaw = localStorage.getItem('etfCurrentUser');
    if (currentUserRaw) {
      const currentUser = JSON.parse(currentUserRaw);
      const userKey = currentUser.uid || currentUser.username;
      setUserId(userKey);
      cloudDataService.setUserId(userKey);
    }

    // Listen for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      // Trigger sync when coming back online
      cloudDataService.syncPendingData().then(() => {
        setSyncStatus('success');
        setLastSync(new Date());
      }).catch(() => {
        setSyncStatus('error');
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check last sync time
    const lastSyncTime = localStorage.getItem('cloud_last_sync');
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    switch (syncStatus) {
      case 'syncing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Cloud className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    if (!userId) {
      return 'Not logged in';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Sync failed';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
    if (!isOnline || !userId) {
      return 'text-gray-500';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return '';
    
    const now = new Date();
    const diff = now - lastSync;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!userId) {
    return null; // Don't show if user is not logged in
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      {lastSync && (
        <span className="text-xs text-gray-400">
          ({formatLastSync()})
        </span>
      )}
    </div>
  );
};

export default CloudSyncStatus;
