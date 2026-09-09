import React, { useState, useEffect } from 'react';
import { 
    Settings, MapPin, User, Calendar, Smartphone, 
    Lock, ShieldCheck, CheckCircle2, Edit3, Trash2, Award, LogOut, Camera
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, signOut } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import * as OTPAuth from 'otpauth';

import { primaryDb as db, primaryAuth as auth } from "../../firebase";

const BSTPProfileTab = ({ profile, user }) => {
    const appId = "dualtech-ojt-portal";
    // States
    const themeKey = user?.uid ? `app-theme-${user.uid}` : 'app-theme';
    const [theme, setTheme] = useState(() => localStorage.getItem(themeKey) || 'system');
    const [pinData, setPinData] = useState({ newPin: '', confirmPin: '' });
    const [isUpdatingPin, setIsUpdatingPin] = useState(false);
    const [totpSetupUri, setTotpSetupUri] = useState('');
    const [tempSecret, setTempSecret] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [updatingPwd, setUpdatingPwd] = useState(false);
    const [isSettingUpBio, setIsSettingUpBio] = useState(false);

    // Apply theme changes to document
    useEffect(() => {
        const applyTheme = () => {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
                localStorage.setItem(themeKey, 'dark');
            } else if (theme === 'light') {
                document.documentElement.classList.remove('dark');
                localStorage.setItem(themeKey, 'light');
            } else {
                localStorage.setItem(themeKey, 'system');
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        };
        applyTheme();
        // Listen for system theme changes when in 'system' mode
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => { if (theme === 'system') applyTheme(); };
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, [theme, themeKey]);

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState(profile?.profilePhotoUrl || '');
    const PHOTO_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbyn2XemnRldRHyALi8ufuvQtRQzG5j10qMziVQ4YvqEynvr4NhOkuWxPxTCooNndWo-WA/exec";

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return alert("Please select an image file.");
        if (file.size > 5 * 1024 * 1024) return alert("Image must be under 5MB.");
        
        setUploadingPhoto(true);
        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            const resp = await fetch(PHOTO_UPLOAD_URL, {
                method: 'POST',
                body: JSON.stringify({
                    fileName: `profile_${user.uid}_${Date.now()}.${file.name.split('.').pop()}`,
                    fileContent: base64,
                    mimeType: file.type
                })
            });
            const data = await resp.json();
            if (data.status === 'success') {
                setProfilePhotoUrl(data.url);
                // Save URL to Firestore profile
                const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
                await updateDoc(profileRef, { profilePhotoUrl: data.url });
                try {
                    const traineePublicRef = doc(db, 'artifacts', appId, 'public', 'data', 'trainees', profile.traineeDocId || profile.id || profile.studentId || user.uid);
                    await updateDoc(traineePublicRef, { profilePhotoUrl: data.url });
                } catch (e) {
                    console.error("Failed to sync photo to public trainees record", e);
                }
                alert("Profile photo updated!");
            } else {
                alert("Upload failed: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Photo upload error:", err);
            alert("Failed to upload photo. Please try again.");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!window.confirm("Remove your profile photo?")) return;
        try {
            const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            await updateDoc(profileRef, { profilePhotoUrl: '' });
            try {
                const traineePublicRef = doc(db, 'artifacts', appId, 'public', 'data', 'trainees', profile.traineeDocId || profile.id || profile.studentId || user.uid);
                await updateDoc(traineePublicRef, { profilePhotoUrl: '' });
            } catch (e) {
                console.error("Failed to remove photo from public trainees record", e);
            }
            setProfilePhotoUrl('');
            alert("Profile photo removed.");
        } catch (err) {
            console.error("Error removing photo:", err);
        }
    };


    const handleUpdatePin = async (e) => {
        e.preventDefault();

        // Check if pins match
        if (pinData.newPin !== pinData.confirmPin) {
            return alert("New PINs do not match.");
        }

        // Validation for exactly 4 digits
        if (pinData.newPin.length !== 4) {
            return alert("PIN must be exactly 4 digits.");
        }

        setIsUpdatingPin(true);
        try {
            // 1. Update the PIN in Firebase using the CORRECT 'fallbackPin' key
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            await updateDoc(userRef, {
                fallbackPin: pinData.newPin
            });

            // 2. Update local state memory immediately so the clock-in tab recognizes it
            if (profile) {
                profile.fallbackPin = pinData.newPin;
            }

            alert("4-Digit PIN successfully updated!");
            setPinData({ newPin: '', confirmPin: '' }); // Clear the form
        } catch (error) {
            console.error("Error updating PIN:", error);
            alert("Failed to update PIN. Please try again.");
        }
        setIsUpdatingPin(false);
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) return alert("Password must be at least 6 characters.");
        setUpdatingPwd(true);
        try {
            await updatePassword(user, newPassword);
            alert("Password updated successfully!");
            setNewPassword('');
        } catch (err) { 
            alert("Failed to update password. You may need to log out and log back in first."); 
        } finally { 
            setUpdatingPwd(false); 
        }
    };

    const handleBiometricSetup = async () => {
        if (!window.PublicKeyCredential) {
            alert("Biometrics not supported on this browser or device.");
            return;
        }

        setIsSettingUpBio(true);
        try {
            const cred = await navigator.credentials.create({
                publicKey: {
                    challenge: window.crypto.getRandomValues(new Uint8Array(32)),
                    rp: { name: "Dualtech Portal" },
                    user: {
                        id: window.crypto.getRandomValues(new Uint8Array(16)),
                        name: profile.email.toLowerCase(),
                        displayName: profile.given || "Trainee"
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000
                }
            });

            const bioId = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));

            // Save to local storage for device-level login checks
            localStorage.setItem(`bio_${profile.email.toLowerCase()}`, bioId);

            // Save credential ID to Firestore profile
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            await updateDoc(userRef, { biometricCredentialId: bioId });

            // Instantly update local profile state so the UI reflects the change
            if (profile) {
                profile.biometricCredentialId = bioId;
            }

            alert("Biometric registered successfully!");
        } catch (error) {
            console.error("Biometric setup error:", error);
            alert("Biometric setup failed or was cancelled.");
        }
        setIsSettingUpBio(false);
    };

    const handleSetupGoogleAuth = () => {
        const secret = new OTPAuth.Secret({ size: 20 });
        const totp = new OTPAuth.TOTP({
            issuer: profile.companyName || profile.company || "Dualtech",
            label: profile.email || "Trainee",
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: secret
        });
        setTempSecret(secret.base32);
        setTotpSetupUri(totp.toString());
    };

    const confirmSetupGoogleAuth = async (enteredCode) => {
        if (!enteredCode) return;
        const totp = new OTPAuth.TOTP({
            algorithm: "SHA1", digits: 6, period: 30,
            secret: OTPAuth.Secret.fromBase32(tempSecret)
        });

        if (totp.validate({ token: enteredCode, window: 1 }) !== null) {
            const currentDevice = navigator.userAgent;
            const updatedTrustedDevices = [...(profile.trustedDevices || []), currentDevice];

            // 1. Update Database with BOTH the Secret Key AND the newly trusted device
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
                totpSecret: tempSecret,
                trustedDevices: updatedTrustedDevices
            });

            // 2. Instantly update local memory so no refresh is needed
            profile.totpSecret = tempSecret;
            profile.trustedDevices = updatedTrustedDevices;

            alert("Google Authenticator linked! This device is now permanently recognized.");
            setTotpSetupUri('');

        } else {
            alert("Invalid code. Please check your Google Authenticator app and try again.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Profile & Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your account information.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-blue-200" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-2xl">
                            {profile?.given?.charAt(0) || '?'}
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{profile?.given} {profile?.family}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.studentId}</p>
                    </div>
                </div>
                <div className="space-y-5">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Trainee Level</p>
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Award size={16} className="text-blue-500" /> BSTP
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Section</p>
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" />{profile?.section || profile?.Section || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Adviser</p>
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <User size={16} className="text-blue-500" />{profile?.adviser || profile?.Adviser || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Proctor</p>
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-blue-500" />{profile?.proctor || profile?.Proctor || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Trusted Devices</p>
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs break-all">
                            <Smartphone size={16} className="text-blue-500 shrink-0" />{profile?.trustedDevices?.length || 1} Device(s) Authorized
                        </p>
                    </div>
                </div>
            </div>

            {/* APP THEME SETTINGS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Settings size={18} /> App Theme Appearance
                </h3>
                <div className="flex gap-3">
                    {['light', 'dark', 'system'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold capitalize transition-all border ${theme === t
                                    ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* PROFILE PHOTO */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <User size={18} /> Profile Photo
                </h3>
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        {profilePhotoUrl ? (
                            <img src={profilePhotoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 dark:border-blue-800 shadow-lg" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-3xl border-4 border-blue-200 dark:border-blue-800 shadow-lg">
                                {profile?.given?.charAt(0) || '?'}
                            </div>
                        )}
                        {uploadingPhoto && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                            <Edit3 size={14} />
                            {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        </label>
                        {profilePhotoUrl && (
                            <button onClick={handleRemovePhoto} className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors">
                                <Trash2 size={12} /> Remove Photo
                            </button>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                </div>
            </div>


            {/* UPDATE 4-DIGIT PIN FORM */}
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                    Update 4-Digit Clock-In PIN
                </h3>

                <form onSubmit={handleUpdatePin} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">New PIN</label>
                            <input
                                type="password"
                                maxLength="4"
                                pattern="\d{4}"
                                inputMode="numeric"
                                placeholder="0000"
                                value={pinData.newPin}
                                onChange={e => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '') })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-center tracking-[0.5em] text-lg font-black"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Confirm New PIN</label>
                            <input
                                type="password"
                                maxLength="4"
                                pattern="\d{4}"
                                inputMode="numeric"
                                placeholder="0000"
                                value={pinData.confirmPin}
                                onChange={e => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '') })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-center tracking-[0.5em] text-lg font-black"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isUpdatingPin}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                        {isUpdatingPin ? 'Updating...' : 'Save New PIN'}
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><Lock size={18} /> Security Settings</h3>
                <form onSubmit={handlePasswordUpdate}>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Update Password</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password (min 6 chars)" className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" required minLength="6" />
                        <button disabled={updatingPwd} className="bg-slate-800 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-900 disabled:opacity-50">Update</button>
                    </div>
                </form>
            </div>

            {/* BIOMETRIC SETUP */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <ShieldCheck className="text-blue-500" /> Biometric Authentication
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Set up fingerprint or face recognition for quick, 1-tap clock-ins on this device.</p>

                {profile?.biometricCredentialId ? (
                    <div className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 p-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-not-allowed">
                        <CheckCircle2 size={20} className="text-blue-500" /> Biometric Already Configured
                    </div>
                ) : (
                    <button
                        onClick={handleBiometricSetup}
                        disabled={isSettingUpBio}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {isSettingUpBio ? 'Setting up...' : 'Register Biometric Now'}
                    </button>
                )}
            </div>

            {/* GOOGLE AUTHENTICATOR SETUP */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><ShieldCheck className="text-blue-500" /> Google Authenticator (2FA)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Link Google Authenticator so you can verify yourself when clocking in from a new phone, bypassing the need for HR approval.</p>

                {profile?.totpSecret ? (
                    <div className="bg-blue-50 text-blue-700 p-4 rounded-xl font-bold flex items-center gap-2">
                        <CheckCircle2 size={20} /> Google Authenticator is Active!
                    </div>
                ) : !totpSetupUri ? (
                    <button onClick={handleSetupGoogleAuth} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors">
                        Setup Google Authenticator
                    </button>
                ) : (
                    <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center text-center">
                        <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">1. Scan this QR code in the Google Authenticator App</p>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm mb-4 border border-slate-100 dark:border-slate-800">
                            <QRCodeSVG value={totpSetupUri} size={200} />
                        </div>

                        {/* MANUAL ENTRY FALLBACK */}
                        <div className="mb-6 w-full max-w-sm">
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-slate-300"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or enter manually</span>
                                <div className="flex-grow border-t border-slate-300"></div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mt-2 flex flex-col items-center">
                                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">Account: Dualtech ({profile?.email})</span>
                                <span className="font-mono font-bold text-blue-600 tracking-wider break-all text-center select-all cursor-pointer">
                                    {tempSecret}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1 mt-2">Select "Enter a setup key" in your app</span>
                            </div>
                        </div>

                        <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">2. Enter the 6-digit code to verify</p>
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="000000"
                            className="w-40 px-4 py-3 text-center text-2xl tracking-widest border border-slate-300 rounded-xl outline-none focus:border-blue-500 mb-4 font-mono shadow-inner bg-white dark:bg-slate-900"
                            id="totpVerifyInput"
                        />
                        <button onClick={() => confirmSetupGoogleAuth(document.getElementById('totpVerifyInput').value)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-colors">
                            Verify & Link App
                        </button>
                    </div>
                )}
            </div>

            {/* DATA PRIVACY RIGHTS SECTION */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" size={20} /> Data Privacy Rights
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Under the Data Privacy Act of 2012, you have the right to access, correct, or request the deletion of your personal data stored in our system.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            window.location.href = `mailto:dpo@dualtech.edu.ph?subject=Data Update Request - ${profile?.studentId}&body=Hi DPO,%0D%0A%0D%0AI would like to request an update/correction to my personal records.`;
                        }}
                        className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                    >
                        <Edit3 size={16} /> Request Data Update
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to request account deletion? HR will review this request within 30 days.")) {
                                window.location.href = `mailto:dpo@dualtech.edu.ph?subject=Data Deletion Request - ${profile?.studentId}&body=Hi DPO,%0D%0A%0D%0AI am requesting the complete deletion of my personal data from the Trainee Portal.`;
                            }
                        }}
                        className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                    >
                        <Trash2 size={16} /> Request Data Deletion
                    </button>
                </div>
            </div>


            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6 mb-8 block md:hidden">
                <button
                    onClick={async () => {
                        try {
                            await signOut(auth);
                        } catch (e) {
                            console.error(e);
                        }
                    }}
                    className="w-full flex justify-center items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-4 rounded-xl transition-colors"
                >
                    <LogOut size={20} /> Sign Out
                </button>
            </div>
        </div>
    );
};

export default BSTPProfileTab;
