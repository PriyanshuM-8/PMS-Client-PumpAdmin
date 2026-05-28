import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import petrolPump from "/Images/gas-station.png";

const inputCls =
  "w-full bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition";

export default function Login() {
  const { login } = useAuth();

  // steps: "login" | "otp" | "forgot" | "forgot-otp" | "new-password"
  const [step, setStep] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [testOtp, setTestOtp] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return setError("Email and password are required");
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login/pump", { email: email.trim(), password });
      if (data.devOtp) setTestOtp(data.devOtp);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return setError("Enter valid 6-digit OTP");
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", {
        identifier: email.trim(),
        otp,
        method: "email",
        requestedRole: "pumpAdmin",
      });
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSendOtp = async () => {
    if (!forgotEmail) return setError("Enter your registered email");
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: forgotEmail.trim() });
      if (data.devOtp) setTestOtp(data.devOtp);
      setStep("forgot-otp");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (forgotOtp.length !== 6) return setError("Enter valid 6-digit OTP");
    if (!newPassword || newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: forgotEmail.trim(),
        otp: forgotOtp,
        newPassword,
      });
      setSuccess("Password reset successfully! Please login.");
      setStep("login");
      setForgotEmail("");
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForgot = () => {
    setStep("login");
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-xl shadow-orange-200 mx-auto mb-3">
            <img src={petrolPump} alt="petrol" className="h-10 w-10" />
          </div>
          <h1 className="text-gray-900 font-black text-xl">PumpAdmin</h1>
          <p className="text-gray-400 text-xs mt-1">Petrol Pump Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* ── Login Step ── */}
          {step === "login" && (
            <div className="space-y-3">
              {success && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                  <p className="text-green-600 text-xs font-semibold">{success}</p>
                </div>
              )}
              <div>
                <label className="text-gray-600 text-xs font-semibold mb-1 block">Email</label>
                <input
                  type="email" value={email} placeholder="admin@pump.com"
                  className={inputCls}
                  onChange={(e) => { setEmail(e.target.value); setError(""); setSuccess(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold mb-1 block">Password</label>
                <input
                  type="password" value={password} placeholder="••••••••"
                  className={inputCls}
                  onChange={(e) => { setPassword(e.target.value); setError(""); setSuccess(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <p className="text-red-500 text-xs font-semibold">{error}</p>
                </div>
              )}

              <button type="button" onClick={handleLogin} disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-200/60 disabled:opacity-60 mt-1">
                {loading ? "Sending OTP..." : "Login"}
              </button>

              <button type="button" onClick={() => { setStep("forgot"); setError(""); setSuccess(""); }}
                className="w-full text-orange-500 text-xs font-semibold py-1 hover:underline">
                Forgot Password?
              </button>
            </div>
          )}

          {/* ── OTP Step (Login) ── */}
          {step === "otp" && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                <p className="text-green-600 text-xs font-semibold">OTP sent to {email}</p>
                <p className="text-green-500 text-[10px] mt-0.5">Valid for 10 minutes</p>
              </div>
              
              {testOtp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <i className="ri-flask-line text-yellow-600"></i>
                    <p className="text-yellow-700 text-xs font-bold">Test OTP</p>
                  </div>
                  <p className="text-yellow-900 text-lg font-black mt-2 tracking-[0.3em]">{testOtp}</p>
                  <p className="text-yellow-600/70 text-[10px] mt-1 font-medium leading-tight">Use this OTP to login directly<br/>(Render free tier blocks emails)</p>
                </div>
              )}

              <div>
                <label className="text-gray-600 text-xs font-semibold mb-1 block">Enter OTP</label>
                <input
                  value={otp} maxLength={6} placeholder="6-digit OTP"
                  className={`${inputCls} text-center tracking-[0.4em] text-sm font-bold`}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <p className="text-red-500 text-xs font-semibold">{error}</p>
                </div>
              )}
              <button type="button" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-200/60 disabled:opacity-60">
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button type="button" onClick={() => { setStep("login"); setOtp(""); setError(""); }}
                className="w-full text-gray-400 text-xs py-1">
                ← Back to Login
              </button>
            </div>
          )}

          {/* ── Forgot Password — Enter Email ── */}
          {step === "forgot" && (
            <div className="space-y-3">
              <p className="text-gray-700 text-xs font-bold">Reset Password</p>
              <p className="text-gray-400 text-[10px]">Enter your registered email to receive an OTP</p>
              <div>
                <label className="text-gray-600 text-xs font-semibold mb-1 block">Email</label>
                <input
                  type="email" value={forgotEmail} placeholder="admin@pump.com"
                  className={inputCls}
                  onChange={(e) => { setForgotEmail(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleForgotSendOtp()}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <p className="text-red-500 text-xs font-semibold">{error}</p>
                </div>
              )}
              <button type="button" onClick={handleForgotSendOtp} disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-200/60 disabled:opacity-60">
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
              <button type="button" onClick={resetForgot}
                className="w-full text-gray-400 text-xs py-1">
                ← Back to Login
              </button>
            </div>
          )}

          {/* ── Forgot Password — OTP + New Password ── */}
          {step === "forgot-otp" && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                <p className="text-green-600 text-xs font-semibold">OTP sent to {forgotEmail}</p>
                <p className="text-green-500 text-[10px] mt-0.5">Valid for 10 minutes</p>
              </div>

              {testOtp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <i className="ri-flask-line text-yellow-600"></i>
                    <p className="text-yellow-700 text-xs font-bold">Test OTP</p>
                  </div>
                  <p className="text-yellow-900 text-lg font-black mt-2 tracking-[0.3em]">{testOtp}</p>
                  <p className="text-yellow-600/70 text-[10px] mt-1 font-medium leading-tight">Use this OTP to reset directly<br/>(Render free tier blocks emails)</p>
                </div>
              )}

              <div>
                <label className="text-gray-600 text-xs font-semibold mb-1 block">Enter OTP</label>
                <input
                  value={forgotOtp} maxLength={6} placeholder="6-digit OTP"
                  className={`${inputCls} text-center tracking-[0.4em] text-sm font-bold`}
                  onChange={(e) => { setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold mb-1 block">New Password</label>
                <input
                  type="password" value={newPassword} placeholder="Min 6 characters"
                  className={inputCls}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold mb-1 block">Confirm Password</label>
                <input
                  type="password" value={confirmPassword} placeholder="Re-enter password"
                  className={inputCls}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <p className="text-red-500 text-xs font-semibold">{error}</p>
                </div>
              )}
              <button type="button" onClick={handleResetPassword}
                disabled={loading || forgotOtp.length !== 6 || !newPassword || !confirmPassword}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-200/60 disabled:opacity-60">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <button type="button" onClick={resetForgot}
                className="w-full text-gray-400 text-xs py-1">
                ← Back to Login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-4 text-gray-400">
          New pump?{" "}
          <Link to="/register" className="font-bold text-orange-500">Register here</Link>
        </p>
      </div>
    </div>
  );
}
