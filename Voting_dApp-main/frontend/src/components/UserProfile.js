import React from 'react';
import qrCode from '../assets/qr-code.jpg';

const UserProfile = ({ mobile, onClose }) => {
    // Hardcoded Data (unchanged logic)
    const TARGET_MOBILE = '+91 7695963321';
    const TARGET_MOBILE_CLEAN = '7695963321';

    let userDetails = {
        name: 'Voter',
        dob: 'Not Available',
        father: 'Not Available',
        mother: 'Not Available',
        mobile: mobile || 'Not Available'
    };

    if (mobile === TARGET_MOBILE || mobile === TARGET_MOBILE_CLEAN) {
        userDetails = {
            name: 'D S VIGNESH',
            dob: '27-05-2006',
            father: 'K C SATHISH KUMAR',
            mother: 'S ANURADHA',
            mobile: '+91 7695963321'
        };
    } else if (mobile === '6374798801') {
        userDetails = {
            name: 'Swetha S',
            dob: '20-12-2005',
            father: 'Suresh K',
            mother: 'Latha S',
            mobile: '+91 6374798801'
        };
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '15px',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'left',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                position: 'relative',
                animation: 'slideIn 0.3s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#6B7280'
                    }}
                >
                    &times;
                </button>

                <h2 style={{
                    borderBottom: '2px solid #2563EB',
                    paddingBottom: '10px',
                    marginBottom: '10px',
                    color: '#1F2937',
                    fontSize: '1.5rem'
                }}>
                    User Profile
                </h2>

                {/* QR CODE SECTION */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <img src={qrCode} alt="Profile QR" style={{ width: '120px', height: '120px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={styles.field}>
                        <label style={styles.label}>Name</label>
                        <div style={styles.value}>{userDetails.name}</div>
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Date of Birth</label>
                        <div style={styles.value}>{userDetails.dob}</div>
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Father's Name</label>
                        <div style={styles.value}>{userDetails.father}</div>
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Mother's Name</label>
                        <div style={styles.value}>{userDetails.mother}</div>
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Mobile Number</label>
                        <div style={styles.value}>{userDetails.mobile}</div>
                    </div>
                </div>

                <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    border: '1px solid #A7F3D0'
                }}>
                    ✅ Verified Details
                </div>
            </div>
            <style>
                {`
                    @keyframes slideIn {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
};

const styles = {
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    label: {
        fontSize: '0.85rem',
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    value: {
        fontSize: '1.1rem',
        color: '#111827',
        fontWeight: '500',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '5px'
    }
};

export default UserProfile;
