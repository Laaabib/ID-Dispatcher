import { useEffect, useRef, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export function useAdminNotifications() {
  const { role } = useAuth();
  const isInitialLoadId = useRef(true);
  const isInitialLoadNametag = useRef(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!role || !['admin', 'admin_approver', 'it_approver'].includes(role)) return;

    let idCount = 0;
    let nametagCount = 0;

    const updateCount = () => {
      setUnreadCount(idCount + nametagCount);
    };

    // Listen for new ID Card requests
    const qId = query(collection(db, 'applications'), where('status', '==', 'Pending'));
    const unsubId = onSnapshot(qId, (snapshot) => {
      idCount = snapshot.docs.length;
      updateCount();
      
      if (isInitialLoadId.current) {
        isInitialLoadId.current = false;
        return;
      }
      
      const hasNew = snapshot.docChanges().some(change => change.type === 'added');
      if (hasNew) {
        playNotificationSound();
        toast.info("New ID Card Application Submitted", {
          description: "A new ID card request requires your attention.",
          duration: 5000,
        });
      }
    }, (error) => {
      console.error("Error fetching ID applications:", error);
    });

    // Listen for new Nametag requests
    const qNametag = query(collection(db, 'nametags'), where('status', '==', 'Pending'));
    const unsubNametag = onSnapshot(qNametag, (snapshot) => {
      nametagCount = snapshot.docs.length;
      updateCount();
      
      if (isInitialLoadNametag.current) {
        isInitialLoadNametag.current = false;
        return;
      }
      
      const hasNew = snapshot.docChanges().some(change => change.type === 'added');
      if (hasNew) {
        playNotificationSound();
        toast.info("New Nametag Application Submitted", {
          description: "A new nametag request requires your attention.",
          duration: 5000,
        });
      }
    }, (error) => {
      console.error("Error fetching nametags:", error);
    });

    return () => {
      unsubId();
      unsubNametag();
    };
  }, [role]);

  return { unreadCount };
}
