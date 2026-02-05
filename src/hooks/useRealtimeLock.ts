import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface LockState {
  isLocked: boolean;
  lockedBy: string | null;
  status: string | null;
}

interface ObservacionRow {
  obs_id: number;
  obs_estatus: string;
  obs_responsable: string | null;
  [key: string]: unknown;
}

/**
 * Hook to detect if a request is locked by another user via Supabase Realtime.
 * 
 * @param requestId - The ID of the request to monitor
 * @param currentUserInitials - The initials of the current user
 * @param initialStatus - The initial status of the request
 * @param initialResponsible - The initial responsible user
 * @returns LockState object with isLocked, lockedBy, and current status
 */
export function useRealtimeLock(
  requestId: number | null,
  currentUserInitials: string | null,
  initialStatus?: string,
  initialResponsible?: string
): LockState {
  const [lockState, setLockState] = useState<LockState>(() => {
    // Initialize based on initial values
    const isReviewing = initialStatus === 'EN REVISIÓN';
    const isOtherUser = initialResponsible && currentUserInitials && 
                        initialResponsible !== currentUserInitials;
    
    return {
      isLocked: isReviewing && !!isOtherUser,
      lockedBy: isReviewing && isOtherUser ? initialResponsible : null,
      status: initialStatus || null,
    };
  });

  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback((
    payload: RealtimePostgresChangesPayload<ObservacionRow>
  ) => {
    // Only handle UPDATE events for our specific request
    if (payload.eventType !== 'UPDATE') return;
    
    const newRow = payload.new as ObservacionRow;
    if (!newRow || newRow.obs_id !== requestId) return;

    const newStatus = newRow.obs_estatus;
    const newResponsible = newRow.obs_responsable;

    // Check if it's locked by another user
    const isReviewing = newStatus === 'EN REVISIÓN';
    const isOtherUser = newResponsible && currentUserInitials && 
                        newResponsible !== currentUserInitials;

    setLockState({
      isLocked: isReviewing && !!isOtherUser,
      lockedBy: isReviewing && isOtherUser ? newResponsible : null,
      status: newStatus,
    });
  }, [requestId, currentUserInitials]);

  useEffect(() => {
    if (!requestId) return;

    // Create a unique channel name for this request
    const channelName = `observacion-lock-${requestId}`;

    // Subscribe to changes on the observacion table for this specific row
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'observacion',
          filter: `obs_id=eq.${requestId}`,
        },
        handleChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: Subscribed to lock changes for request ${requestId}`);
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or when requestId changes
    return () => {
      if (channelRef.current) {
        console.log(`Realtime: Unsubscribing from lock changes for request ${requestId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [requestId, handleChange]);

  return lockState;
}

/**
 * Hook to monitor multiple requests for lock status (used in StudentRequestDetailModal).
 * 
 * @param requestIds - Array of request IDs to monitor
 * @param currentUserInitials - The initials of the current user
 * @param initialData - Map of initial data for each request
 * @returns Map of request ID to LockState
 */
export function useRealtimeLockMultiple(
  requestIds: number[],
  currentUserInitials: string | null,
  initialData?: Map<number, { status: string; responsible: string }>
): Map<number, LockState> {
  const [lockStates, setLockStates] = useState<Map<number, LockState>>(() => {
    const initial = new Map<number, LockState>();
    requestIds.forEach(id => {
      const data = initialData?.get(id);
      const isReviewing = data?.status === 'EN REVISIÓN';
      const isOtherUser = data?.responsible && currentUserInitials && 
                          data.responsible !== currentUserInitials;
      
      initial.set(id, {
        isLocked: isReviewing && !!isOtherUser,
        lockedBy: isReviewing && isOtherUser ? data.responsible : null,
        status: data?.status || null,
      });
    });
    return initial;
  });

  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback((
    payload: RealtimePostgresChangesPayload<ObservacionRow>
  ) => {
    if (payload.eventType !== 'UPDATE') return;
    
    const newRow = payload.new as ObservacionRow;
    if (!newRow || !requestIds.includes(newRow.obs_id)) return;

    const newStatus = newRow.obs_estatus;
    const newResponsible = newRow.obs_responsable;

    const isReviewing = newStatus === 'EN REVISIÓN';
    const isOtherUser = newResponsible && currentUserInitials && 
                        newResponsible !== currentUserInitials;

    setLockStates(prev => {
      const updated = new Map(prev);
      updated.set(newRow.obs_id, {
        isLocked: isReviewing && !!isOtherUser,
        lockedBy: isReviewing && isOtherUser ? newResponsible : null,
        status: newStatus,
      });
      return updated;
    });
  }, [requestIds, currentUserInitials]);

  useEffect(() => {
    if (requestIds.length === 0) return;

    // Subscribe to all changes on observacion table
    // We filter client-side since Supabase doesn't support IN filters in realtime
    const channelName = `observacion-lock-batch-${requestIds.join('-').substring(0, 50)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'observacion',
        },
        handleChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: Subscribed to batch lock changes for ${requestIds.length} requests`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`Realtime: Unsubscribing from batch lock changes`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [requestIds.join(','), handleChange]);

  return lockStates;
}

