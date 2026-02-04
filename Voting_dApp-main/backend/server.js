import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// In-Memory OTP Store (Phone -> OTP)
// Note: In production, use Redis or Database with expiration
const otpStore = {};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Env Variables
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

// --- ENDPOINTS ---

app.post("/send-otp", async (req, res) => {
    const { phone } = req.body; // e.g., "7695963321" (Fast2SMS handles country code usually, or valid 10 digit) or "+91..."

    if (!phone) {
        return res.status(400).json({ error: "Phone number required" });
    }

    // Clean phone number for Fast2SMS (usually expects 10 digits for India)
    // If it comes with +91, remove it? Fast2SMS documentation says 'numbers' parameter. 
    // Let's assume input is cleaned or we clean it to 10 digits for India.
    // However, if we support international, we need logic. Fast2SMS is primarily India.
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const otp = generateOTP();
    otpStore[cleanPhone] = otp;
    console.log(`Generated OTP for ${cleanPhone}: ${otp}`);

    // If API Key is missing, run in DEMO mode only
    if (!FAST2SMS_API_KEY) {
        return res.json({
            success: true,
            message: "Fast2SMS Key Missing. Demo Mode.",
            otp: otp,
            note: "Add FAST2SMS_API_KEY to .env for real SMS"
        });
    }

    try {
        const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            {
                route: "otp",
                variables_values: otp.toString(),
                numbers: cleanPhone,
            },
            {
                headers: {
                    "authorization": FAST2SMS_API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Fast2SMS Response:", response.data);
        res.json({ success: true, message: "OTP Sent via Fast2SMS" });

    } catch (error) {
        console.error("Fast2SMS Error:", error.response ? error.response.data : error.message);
        // Fallback to sending OTP in response for testing if SMS fails
        res.status(500).json({
            error: "Failed to send SMS",
            otp: otp, // DEV ONLY: allowing user to proceed if SMS fails
            details: error.message
        });
    }
});

app.post("/verify-otp", (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ error: "Phone and OTP required" });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const storedOtp = otpStore[cleanPhone];

    if (storedOtp == otp) { // Allow string/number comparison
        delete otpStore[cleanPhone]; // One-time use
        res.json({ success: true, message: "OTP Verified Successfully" });
    } else {
        res.status(400).json({ error: "Invalid OTP" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
