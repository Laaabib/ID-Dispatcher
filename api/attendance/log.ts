import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, limit } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// In Vercel, static imports ensure the file is bundled.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let db: any;
  try {
    // Initialize Firebase only if no apps are initialized
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  } catch (e: any) {
    return res.status(500).json({ error: "Could not load firebase config", details: e.message });
  }

  const { deviceId, logs } = req.body;
  
  if (!logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: "Invalid logs format" });
  }

  try {
    // 1. Update device status
    const deviceQuery = query(collection(db, "attendance_devices"), where("ip", "==", deviceId), limit(1));
    const deviceSnap = await getDocs(deviceQuery);
    if (!deviceSnap.empty) {
      const deviceDoc = deviceSnap.docs[0];
      await updateDoc(doc(db, "attendance_devices", deviceDoc.id), {
        status: "Online",
        lastSync: new Date().toISOString()
      });
    }

    // 2. Process each log
    for (const log of logs) {
      const employeeId = log.deviceUserId;
      const recordTime = new Date(log.recordTime);
      const date = recordTime.toISOString().split('T')[0];
      const time = recordTime.toLocaleTimeString('en-US', { hour12: false });

      // Check if attendance already exists
      const attQuery = query(
        collection(db, "attendance"), 
        where("employeeId", "==", employeeId),
        where("date", "==", date),
        limit(1)
      );
      const attSnap = await getDocs(attQuery);

      if (attSnap.empty) {
        await addDoc(collection(db, "attendance"), {
          employeeId,
          date,
          checkInTime: time,
          status: "Present",
          source: "ZKTeco Device",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        const attDoc = attSnap.docs[0];
        const existingData = attDoc.data();
        if (!existingData.checkOutTime || time > existingData.checkOutTime) {
          await updateDoc(doc(db, "attendance", attDoc.id), {
            checkOutTime: time,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    return res.status(200).json({ status: "success", processed: logs.length });
  } catch (error: any) {
    console.error("Error processing logs:", error);
    return res.status(500).json({ error: error.message });
  }
}
