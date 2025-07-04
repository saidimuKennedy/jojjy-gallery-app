import { NextApiRequest, NextApiResponse } from "next";

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
} = process.env;

const SAFARICOM_BASE_URL = "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

  const res = await fetch(`${SAFARICOM_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const data = await res.json();

  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ success: false, message: "Phone number and amount are required." });
  }

  const amountToSend = Math.floor(Number(amount));
  if (isNaN(amountToSend) || amountToSend <= 0) {
    return res.status(400).json({ success: false, message: "Invalid amount. Must be a positive number." });
  }

  const formattedPhoneNumber = phone.startsWith("254") ? phone : `254${phone.substring(1)}`;

  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY || !MPESA_CALLBACK_URL) {
    console.error("Missing M-Pesa environment variables. Please check your .env.local file or deployment configuration.");
    return res.status(500).json({
      success: false,
      message: "Server configuration error: M-Pesa credentials not set.",
    });
  }

  try {
    const access_token = await getAccessToken();
    if (!access_token) {
      console.error("Failed to retrieve M-Pesa access token. Check consumer key/secret.");
      return res.status(500).json({ success: false, message: "Failed to get M-Pesa access token." });
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amountToSend,
      PartyA: formattedPhoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhoneNumber,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: "JojjyGallery",
      TransactionDesc: "Art Purchase",
    };

    const stkRes = await fetch(`${SAFARICOM_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await stkRes.json();

    if (!stkRes.ok || data.ResponseCode !== "0") {
      console.error("STK Push API Error Response:", data);
      return res.status(stkRes.status || 400).json({
        success: false,
        message: data.CustomerMessage || data.errorMessage || data.ResponseDescription || "Failed to initiate STK Push with Safaricom.",
        error: data,
      });
    }

    res.status(200).json({ success: true, message: "STK Push initiated successfully.", data: data });

  } catch (error: any) {
    console.error("STK Push handler caught an exception:", error);
    res.status(500).json({ success: false, message: `Internal server error during STK Push: ${error.message}` });
  }
}