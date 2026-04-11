import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, limit } from "firebase/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for ZKTeco Bridge
  app.post("/api/attendance/log", async (req, res) => {
    const { deviceId, logs } = req.body;
    
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ error: "Invalid logs format" });
    }

    console.log(`Received ${logs.length} logs from device ${deviceId}`);
    
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
        // ZKTeco log usually has: userSn, deviceUserId, recordTime, etc.
        const employeeId = log.deviceUserId;
        const recordTime = new Date(log.recordTime);
        const date = recordTime.toISOString().split('T')[0];
        const time = recordTime.toLocaleTimeString('en-US', { hour12: false });

        // Check if attendance already exists for this employee and date
        const attQuery = query(
          collection(db, "attendance"), 
          where("employeeId", "==", employeeId),
          where("date", "==", date),
          limit(1)
        );
        const attSnap = await getDocs(attQuery);

        if (attSnap.empty) {
          // Create new check-in
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
          // Update check-out if it's later in the day
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
      
      res.json({ status: "success", processed: logs.length });
    } catch (error: any) {
      console.error("Error processing logs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
