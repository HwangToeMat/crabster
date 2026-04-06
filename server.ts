import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin with specific database ID if available
let db: FirebaseFirestore.Firestore;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const appAdmin = getApps().length === 0 ? initializeApp() : getApps()[0];
  db = getFirestore(appAdmin, config.firestoreDatabaseId);
} catch (e) {
  console.error("Failed to initialize Firestore Admin with specific DB:", e);
  const appAdmin = getApps().length === 0 ? initializeApp() : getApps()[0];
  db = getFirestore(appAdmin);
}

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(cors());

  // Toss Payments Confirm Endpoint
  app.post("/api/toss/confirm", async (req, res) => {
    const { paymentKey, orderId, amount, userId, planId, crbAmount } = req.body;
    const secretKey = process.env.TOSS_SECRET_KEY || "";

    if (!paymentKey || !orderId || !amount || !userId || !crbAmount) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
    }

    try {
      const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");
      const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          Authorization: `Basic ${encryptedSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Toss Payment Confirm Error:", data);
        res.status(response.status).json(data);
        return;
      }

      await db.runTransaction(async (transaction) => {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await transaction.get(userRef);

        let currentBalance = 0;
        if (userDoc.exists) {
          currentBalance = userDoc.data()?.tokenBalance || 0;
        }

        transaction.set(userRef, {
          tokenBalance: currentBalance + crbAmount,
        }, { merge: true });

        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
          userId,
          type: "purchase",
          crbAmount,
          krwAmount: amount,
          description: `CRB 충전 (${planId || '커스텀'})`,
          tossOrderId: orderId,
          tossPaymentKey: paymentKey,
          status: "completed",
          createdAt: FieldValue.serverTimestamp()
        });
      });

      console.log(`Successfully processed Toss payment for user ${userId}: +${crbAmount} CRB`);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Error confirming Toss payment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to generate OG tags
  const getOgTags = async (serviceId?: string) => {
    let title = "CrabSter - AI 웹 서비스 메이커";
    let description = "미친 아이디어를 현실로. AI가 만들어주는 나만의 웹 서비스";
    let imageUrl = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=1200&auto=format&fit=crop"; // Default fallback image

    if (serviceId && db) {
      try {
        const docSnap = await db.collection("services").doc(serviceId).get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data) {
            title = `${data.title} - CrabSter`;
            description = data.description || description;
            imageUrl = data.thumbnailUrl || imageUrl;
          }
        }
      } catch (e) {
        console.error("Error fetching service for OG tags:", e);
      }
    }

    return `
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
    `;
  };

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        
        const serviceId = req.query.serviceId as string;
        const ogTags = await getOgTags(serviceId);
        
        template = template.replace("</head>", `${ogTags}\n</head>`);
        
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
    
    app.get("*", async (req, res) => {
      try {
        let template = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
        
        const serviceId = req.query.serviceId as string;
        const ogTags = await getOgTags(serviceId);
        
        template = template.replace("</head>", `${ogTags}\n</head>`);
        
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        console.error("Error serving production HTML:", e);
        res.status(500).send("Internal Server Error");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
