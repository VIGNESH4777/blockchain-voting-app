import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import homeBg from '../assets/home-bg.png';
import eciLogo from '../assets/eci-logo.png';
import * as faceapi from 'face-api.js'; // Import face-api.js

// Utility to log fraud
const logSecurityEvent = (type, detail, severity = 'Medium') => {
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.unshift({
        id: Date.now(),
        type,
        detail,
        severity,
        timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('security_logs', JSON.stringify(logs));
};

const LoginPage = () => {
    const { connectWallet, account } = useWeb3();
    const navigate = useNavigate();

    // UI State
    const [role, setRole] = useState(null); // null | 'voter' | 'admin'
    const [isRegistering, setIsRegistering] = useState(false);

    // Form State - Voter Login
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);

    // --- NEW: Face Verification State ---
    const [showFaceVerification, setShowFaceVerification] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(''); // 'scanning', 'success', 'failed'
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    // ------------------------------------

    // Form State - Voter Registration
    const [regFirstName, setRegFirstName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [regDob, setRegDob] = useState('');
    const [regAadhar, setRegAadhar] = useState('');
    const [regMobile, setRegMobile] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [generatedDvid, setGeneratedDvid] = useState('');
    const [fetchedWalletAddress, setFetchedWalletAddress] = useState('');

    // DigiLocker State
    const [digiVoterId, setDigiVoterId] = useState('');
    const [digiMobile, setDigiMobile] = useState('');
    const [digiOtp, setDigiOtp] = useState('');
    const [showDigiOtp, setShowDigiOtp] = useState(false);
    const [isDigiVerified, setIsDigiVerified] = useState(false);

    // Security State
    const [failedAttempts, setFailedAttempts] = useState(0);

    // Hardcoded logic
    const TARGET_MOBILE = '+91 7695963321';
    const TARGET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const ADMIN_PASSWORD = 'admin';

    // Form State - Admin
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminOtp, setAdminOtp] = useState('');
    const [showAdminOtp, setShowAdminOtp] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect logic
    useEffect(() => {
        if (account && role === 'voter') navigate('/');
        if (role === 'admin' && localStorage.getItem('adminToken')) navigate('/admin');
    }, [account, role, navigate]);

    // --- FACE API: Load Models ---
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                console.log("FaceAPI Models Loaded");
            } catch (err) {
                console.error("Failed to load models:", err);
            }
        };
        loadModels();
    }, []);

    // --- FACE API: Start Webcam ---
    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Error accessing webcam:", err);
            setError("Could not access webcam for verification.");
            setShowFaceVerification(false);
        }
    };

    // --- FACE API: Stop Webcam ---
    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Clean up webcam on unmount
    useEffect(() => {
        return () => stopWebcam();
    }, []);

    // --- FACE API: Verify Logic ---
    const performFaceVerification = async () => {
        if (!videoRef.current) return;
        setVerificationStatus('scanning');
        setError('');

        try {
            // 1. Detect Face in Webcam
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 })).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setError("No face detected. Please position yourself clearly.");
                setVerificationStatus('failed');
                return;
            }

            // 2. Load Reference Image
            // Note: Since we saved it as '1.jpg' under '7695963321' folder
            // Clean mobile number (remove spaces, +91 if stored that way in folder)
            // Our folder is '7695963321', but input might be '+91 ...'
            const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
            // Warning: If folder name differs, this 404s. Ensure folder is exactly the 10 digit number.

            const imgUrl = `/labeled_images/${cleanMobile}/1.jpg`;

            // Fetch verify existence first might be safer, but library throws if not found
            // We use standard HTMLImageElement for faceapi
            const img = await faceapi.fetchImage(imgUrl);
            const refDetection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 })).withFaceLandmarks().withFaceDescriptor();

            if (!refDetection) {
                setError("Could not find face in reference photo.");
                setVerificationStatus('failed');
                return;
            }

            // 3. Compare
            const distance = faceapi.euclideanDistance(detection.descriptor, refDetection.descriptor);
            console.log("Face Match Distance:", distance);

            // Threshold typically 0.6
            if (distance < 0.6) {
                setVerificationStatus('success');
                setTimeout(() => {
                    stopWebcam();
                    setShowFaceVerification(false);
                    // PROCEED TO OTP
                    proceedToOtp();
                }, 1500);
            } else {
                setVerificationStatus('failed');
                setError("Face verification failed. Not a match.");
            }

        } catch (err) {
            console.error(err);
            setError("Verification error. Model loading or Image missing.");
            setVerificationStatus('failed');
        }
    };

    const proceedToOtp = async () => {
        // Request OTP
        setLoading(true);
        const inputMobile = mobileNumber.trim();
        try {
            const response = await fetch('http://localhost:5000/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: inputMobile })
            });
            const data = await response.json();

            if (data.success || data.otp) {
                setShowOtpInput(true);
                alert(`OTP sent to ${inputMobile}`);
                if (data.otp) alert(`Demo OTP: ${data.otp}`);
            } else {
                setError(data.error || 'Failed to send OTP.');
            }
        } catch (err) {
            setError('Backend connection failed. Is server running?');
        } finally {
            setLoading(false);
        }
    };


    // --- DIGILOCKER HANDLERS ---
    const handleDigiSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!digiVoterId || !digiMobile) {
            setError('Please enter Voter ID and Mobile Number.');
            return;
        }
        setLoading(true);
        // Simulate Backend Call
        setTimeout(() => {
            setLoading(false);
            setShowDigiOtp(true);
            alert('DigiLocker OTP Sent: 123456');
        }, 1500);
    };

    const handleDigiVerify = async (e) => {
        e.preventDefault();
        setError('');
        if (digiOtp !== '123456') { // Mock OTP
            setError('Invalid OTP. Try 123456');
            return;
        }

        setLoading(true);
        // Simulate Fetching Data
        setTimeout(() => {
            setLoading(false);
            setIsDigiVerified(true);

            // Auto-fill Data (Mock Logic)
            if (digiMobile === '6374798801') {
                // Specific Demo User
                setRegFirstName('Swetha');
                setRegLastName('S');
                setRegDob('2005-12-20');
                setRegAadhar('999988887777');
                setFetchedWalletAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
            } else if (digiMobile === '9043282427') {
                // Specific Demo User
                setRegFirstName('sharan babu');
                setRegLastName('A');
                setRegDob('2005-08-25');
                setRegAadhar('888855556666');
                setFetchedWalletAddress('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
            } else {
                // Default Demo User
                setRegFirstName('Vignesh');
                setRegLastName('D.S.');
                setRegDob('2000-01-01');
                setRegAadhar('123456789012');
                setFetchedWalletAddress(''); // Use default/connected logic
            }

            setRegMobile(digiMobile); // Use verified mobile

            // Generate DVID (Simple Hash Simulation)
            const dvid = 'DVID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            setGeneratedDvid(dvid);

            setError('');
        }, 1500);
    };

    // --- VOTER LOGIN HANDLERS ---
    const handleVoterLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Step 1: Validate Mobile and Password
        if (!showOtpInput) {
            if (!mobileNumber || !password) {
                setError('Please enter Mobile Number and Password.');
                return;
            }

            const inputMobile = mobileNumber.trim();

            // 1. Check Hardcoded User
            let isValid = false;
            let isHardcoded = false;

            if ((inputMobile === TARGET_MOBILE || inputMobile === '7695963321') && password === ADMIN_PASSWORD) {
                isValid = true;
                isHardcoded = true;
            }
            // 2. Check Registered Users (LocalStorage)
            else {
                const storedUser = JSON.parse(localStorage.getItem(`user_${inputMobile}`));
                if (storedUser && storedUser.password === password) {
                    isValid = true;
                }
            }

            if (isValid) {
                // Success - Reset failure count
                setFailedAttempts(0);
                // Save current user for Profile
                localStorage.setItem('currentUserMobile', inputMobile);

                // *** FACE VERIFICATION CHECK ***
                // Enforce face verification for specific target mobiles
                const targetMobiles = ['7695963321', '6374798801', '9043282427'];
                const cleanInput = inputMobile.replace(/\D/g, '').slice(-10);

                if (targetMobiles.includes(cleanInput)) {
                    if (!modelsLoaded) {
                        setError("Face models loading... please wait.");
                        return;
                    }
                    setShowFaceVerification(true);
                    startWebcam();
                    return; // Stop here, wait for verification
                }

                // If not the target user, proceed directly to OTP (skip face)
                proceedToOtp();

            } else {
                // Failure - Increment count and Log Fraud
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                if (newAttempts >= 3) {
                    logSecurityEvent('Suspicious Login', `Multiple failed attempts for Mobile: ${inputMobile}`, 'High');
                    setError('Multiple failed attempts detected! Admin notified.');
                } else {
                    setError('Invalid Credentials.');
                }
            }

        } else {
            // Step 2: Verify OTP
            if (!otp) {
                setError('Please enter OTP.');
                return;
            }
            setLoading(true);
            try {
                const response = await fetch('http://localhost:5000/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: mobileNumber, otp: otp })
                });
                const data = await response.json();

                if (data.success) {
                    await connectWallet();
                    // Note: If using registered user, we might not force the hardcoded address 
                    // OR we might map them to a dummy one if they don't have one connected.
                    // The requirement only specified the hardcoded flow mapping. 
                    // For general users, it uses whatever is in MetaMask.
                } else {
                    setError(data.error || 'Invalid OTP.');
                    logSecurityEvent('Invalid OTP', `Wrong OTP entered for ${mobileNumber}`, 'Medium');
                }
            } catch (err) {
                setError('Verification failed.');
            } finally {
                setLoading(false);
            }
        }
    };

    // --- REGISTRATION HANDLER ---
    const handleRegister = (e) => {
        e.preventDefault();
        setError('');

        if (!regFirstName || !regLastName || !regDob || !regAadhar || !regMobile || !regPassword || !regConfirmPassword) {
            setError('All fields are required.');
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (regAadhar.length !== 12) {
            setError('Aadhar Number must be 12 digits.');
            return;
        }

        // Check if already exists
        if (localStorage.getItem(`user_${regMobile}`)) {
            setError('User already registered with this mobile number.');
            return;
        }

        // Save
        const newUser = {
            firstName: regFirstName,
            lastName: regLastName,
            dob: regDob,
            aadhar: regAadhar,
            mobile: regMobile,
            password: regPassword,
            walletAddress: fetchedWalletAddress || account || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Save connected wallet or default
            registeredAt: new Date().toISOString()
        };

        localStorage.setItem(`user_${regMobile}`, JSON.stringify(newUser));

        alert('Registration Successful! Please Login.');
        setIsRegistering(false);
        // Clear fields
        setRegFirstName(''); setRegLastName(''); setRegDob(''); setRegAadhar(''); setRegMobile(''); setRegPassword(''); setRegConfirmPassword('');
    };

    // --- ADMIN HANDLERS ---
    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError('');

        const ADMIN_EMAIL = 'electionofindia.gov@gmail.com';
        const ADMIN_PASS = '1234';

        if (!showAdminOtp) {
            if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASS) {
                setLoading(true);
                try {
                    const response = await fetch('http://localhost:5000/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: 'admin' })
                    });
                    const data = await response.json();
                    if (data.success || data.otp) {
                        setShowAdminOtp(true);
                        alert(`Admin OTP sent! Demo OTP: ${data.otp}`);
                    } else {
                        setError(data.error || 'Failed to send OTP.');
                    }
                } catch (err) {
                    setError('Backend connection failed. Is server running?');
                } finally {
                    setLoading(false);
                }
            } else {
                setError('Invalid Administrator Credentials');
                logSecurityEvent('Unauthorized Admin Access', `Failed admin login: ${adminEmail}`, 'High');
            }
        } else {
            if (!adminOtp) {
                setError('Please enter OTP.');
                return;
            }
            setLoading(true);
            try {
                const response = await fetch('http://localhost:5000/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: 'admin', otp: adminOtp })
                });
                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('adminToken', 'true');
                    navigate('/admin');
                } else {
                    setError(data.error || 'Invalid OTP.');
                }
            } catch (err) {
                setError('Verification failed.');
            } finally {
                setLoading(false);
            }
        }
    };

    // --- RENDER ---
    return (
        <div style={{
            backgroundImage: `url(${homeBg})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            overflowY: 'auto'
        }}>
            {/* FACE VERIFICATION MODAL OVERLAY */}
            {showFaceVerification && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{ marginBottom: '15px' }}>Face Verification Required</h2>
                        <div style={{
                            width: '100%',
                            height: '300px',
                            background: '#000',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        {verificationStatus === 'scanning' && <p style={{ color: 'blue' }}>Scanning...</p>}
                        {verificationStatus === 'success' && <p style={{ color: 'green', fontWeight: 'bold' }}>Verified! Redirecting...</p>}
                        {verificationStatus === 'failed' && <p style={{ color: 'red', fontWeight: 'bold' }}>Verification Failed.</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={performFaceVerification}
                                className="button"
                                style={{ padding: '10px 20px' }}
                                disabled={verificationStatus === 'scanning' || verificationStatus === 'success'}
                            >
                                Verify Face
                            </button>
                            <button
                                onClick={() => { setShowFaceVerification(false); stopWebcam(); setLoading(false); }}
                                className="button"
                                style={{ padding: '10px 20px', background: '#DC2626' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '3rem',
                borderRadius: '20px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                textAlign: 'center',
                maxWidth: '450px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: role === 'admin' ? '2px solid #DC2626' : 'none'
            }}>
                <img src={eciLogo} alt="ECI Logo" style={{ height: '80px', marginBottom: '1.5rem' }} />

                <h1 style={{
                    color: role === 'admin' ? '#DC2626' : '#111827',
                    marginBottom: '0.5rem',
                    fontSize: '2rem',
                    fontWeight: '800'
                }}>One Nation One Election</h1>

                {/* ROLE SELECTION */}
                {!role && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            onClick={() => {
                                setRole('voter');
                                localStorage.removeItem('adminToken');
                            }}
                            className="button"
                            style={{ padding: '15px', fontSize: '1.1rem', cursor: 'pointer' }}
                        >
                            Voter Login
                        </button>
                        <button
                            onClick={() => setRole('admin')}
                            className="button"
                            style={{
                                padding: '15px',
                                fontSize: '1.1rem',
                                cursor: 'pointer',
                                backgroundColor: '#4B5563',
                                border: 'none'
                            }}
                        >
                            Administrator Login
                        </button>
                    </div>
                )}

                {role === 'voter' && (
                    <>
                        <h2 style={{ color: '#4B5563', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                            {isRegistering ? 'Voter Registration' : 'Voter Login'}
                        </h2>

                        {!isRegistering ? (
                            // LOGIN FORM
                            <form onSubmit={handleVoterLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {!showOtpInput ? (
                                    <>
                                        <input
                                            type="text" placeholder="Mobile Number"
                                            value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                        />
                                        <input
                                            type="password" placeholder="Password"
                                            value={password} onChange={(e) => setPassword(e.target.value)}
                                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                        />
                                    </>
                                ) : (
                                    <input
                                        type="text" placeholder="Enter OTP"
                                        value={otp} onChange={(e) => setOtp(e.target.value)}
                                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                    />
                                )}

                                {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

                                <button type="submit" className="button" disabled={loading} style={{ marginTop: '0.5rem', cursor: 'pointer', padding: '12px' }}>
                                    {loading ? 'Processing...' : (showOtpInput ? 'Verify & Login' : 'Get OTP')}
                                </button>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '1rem' }}>
                                    <span onClick={() => setIsRegistering(true)} style={{ color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}>
                                        Don't have an account? Sign Up
                                    </span>
                                    <span onClick={() => { setRole(null); setError(''); setShowOtpInput(false); setMobileNumber(''); }} style={{ color: '#6B7280', cursor: 'pointer' }}>
                                        Back
                                    </span>
                                </div>
                            </form>
                        ) : (
                            // REGISTRATION FLOW
                            <>
                                {!isDigiVerified ? (
                                    // STEP 1: DIGILOCKER VERIFICATION
                                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '8px', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: '0.9rem', marginBottom: '10px' }}>
                                            <strong>ℹ️ DigiLocker Verification Required</strong><br />
                                            Please verify your identity to proceed.
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Voter ID Number (EPIC)"
                                            value={digiVoterId}
                                            onChange={(e) => setDigiVoterId(e.target.value)}
                                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Mobile Number (Aadhaar Linked)"
                                            value={digiMobile}
                                            onChange={(e) => setDigiMobile(e.target.value)}
                                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                                        />

                                        {showDigiOtp && (
                                            <input
                                                type="text"
                                                placeholder="Enter OTP"
                                                value={digiOtp}
                                                onChange={(e) => setDigiOtp(e.target.value)}
                                                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', borderColor: '#2563EB' }}
                                            />
                                        )}

                                        {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

                                        {!showDigiOtp ? (
                                            <button
                                                onClick={handleDigiSendOtp}
                                                className="button"
                                                disabled={loading}
                                                style={{ marginTop: '0.5rem', cursor: 'pointer', padding: '12px', background: '#2563EB' }}
                                            >
                                                {loading ? 'Sending...' : 'Send OTP'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleDigiVerify}
                                                className="button"
                                                disabled={loading}
                                                style={{ marginTop: '0.5rem', cursor: 'pointer', padding: '12px', background: '#059669' }}
                                            >
                                                {loading ? 'Verifying...' : 'Verify & Fetch Data'}
                                            </button>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                            <span onClick={() => { setIsRegistering(false); setError(''); }} style={{ color: '#6B7280', cursor: 'pointer' }}>
                                                Cancel
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    // STEP 2: COMPLETE REGISTRATION (Pre-filled)
                                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left' }}>
                                        <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '8px', border: '1px solid #A7F3D0', color: '#065F46', fontSize: '0.9rem' }}>
                                            <strong>✅ Verified via DigiLocker</strong><br />
                                            Details have been fetched automatically.
                                        </div>

                                        {/* Display Profile Photo if available */}
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                            <img
                                                src={`/labeled_images/${regMobile}/1.jpg`}
                                                alt="Profile"
                                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #E5E7EB' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>

                                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '-5px' }}>Full Name (Verified)</label>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <input type="text" placeholder="First Name" value={regFirstName} readOnly style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F3F4F6' }} />
                                            <input type="text" placeholder="Last Name" value={regLastName} readOnly style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F3F4F6' }} />
                                        </div>

                                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '-5px' }}>Date of Birth (Verified)</label>
                                        <input type="date" value={regDob} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F3F4F6' }} />

                                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '-5px' }}>Aadhar Number (Verified)</label>
                                        <input type="text" value={regAadhar} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F3F4F6' }} />

                                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '-5px' }}>Digital Voter ID (DVID)</label>
                                        <input type="text" value={generatedDvid} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F3F4F6', fontFamily: 'monospace' }} />

                                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '-5px' }}>Mobile Number</label>
                                        <input type="text" value={regMobile} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F3F4F6' }} />

                                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '-5px' }}>Wallet Address (Connected)</label>
                                        <input type="text" value={fetchedWalletAddress || account || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F3F4F6', fontSize: '0.8rem', color: '#065F46' }} />

                                        <hr style={{ border: '0', borderTop: '1px solid #E5E7EB', margin: '5px 0' }} />
                                        <p style={{ fontSize: '0.9rem', color: '#374151', margin: '0' }}>Set Your Password</p>

                                        <input type="password" placeholder="Password" value={regPassword} onChange={e => setRegPassword(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
                                        <input type="password" placeholder="Confirm Password" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />

                                        {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

                                        <button type="submit" className="button" style={{ marginTop: '0.5rem', cursor: 'pointer', padding: '12px' }}>
                                            Finalize Registration
                                        </button>

                                        <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                            <span onClick={() => { setIsRegistering(false); setIsDigiVerified(false); }} style={{ color: '#6B7280', cursor: 'pointer' }}>
                                                Cancel
                                            </span>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ADMIN FORM */}
                {role === 'admin' && (
                    <>
                        <p style={{ color: '#4B5563', marginBottom: '2rem' }}>Restricted Access.</p>
                        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {!showAdminOtp ? (
                                <>
                                    <input type="email" placeholder="Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                                    <input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                                </>
                            ) : (
                                <input type="text" placeholder="Enter OTP" value={adminOtp} onChange={(e) => setAdminOtp(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                            )}
                            {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
                            <button type="submit" className="button" disabled={loading} style={{ marginTop: '0.5rem', cursor: 'pointer', padding: '12px', backgroundColor: '#DC2626', color: 'white', border: 'none' }}>
                                {loading ? 'Processing...' : (showAdminOtp ? 'Verify & Login' : 'Get OTP')}
                            </button>
                            <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.9rem', marginTop: '1rem' }}><span onClick={() => { setRole(null); setError(''); setShowAdminOtp(false); setAdminEmail(''); setAdminPassword(''); setAdminOtp(''); }} style={{ color: '#6B7280', cursor: 'pointer' }}>Back</span></div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
