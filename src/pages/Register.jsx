import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaGasPump,
  FaCamera,
  FaCheckCircle,
  FaIdCard,
  FaFileAlt,
  FaChevronRight,
  FaChevronLeft,
  FaMapMarkerAlt,
  FaFire,
} from "react-icons/fa";
import { MdMyLocation, MdVerified, MdCheckCircle } from "react-icons/md";
import { IoMdSync } from "react-icons/io";

const inputCls =
  "w-full bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-3 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition text-xs";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    pumpName: "",
    address: "",
    licenseNumber: "",
    lng: "",
    lat: "",
    pumpType: [],
  });
  const [files, setFiles] = useState({
    profileImage: null,
    aadharPhoto: null,
    ownerIdProof: null,
  });
  const [previews, setPreviews] = useState({ profileImage: null });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (field) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFiles((f) => ({ ...f, [field]: file }));
    if (field === "profileImage")
      setPreviews((p) => ({ ...p, profileImage: URL.createObjectURL(file) }));
  };

  const togglePumpType = (type) =>
    setForm((f) => ({
      ...f,
      pumpType: f.pumpType.includes(type)
        ? f.pumpType.filter((t) => t !== type)
        : [...f.pumpType, type],
    }));

  const getLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation not supported");
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setForm((f) => ({ ...f, lat, lng }));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const a = data.address || {};
          const parts = [
            a.road,
            a.neighbourhood || a.suburb,
            a.city || a.town || a.village,
            a.state,
            a.postcode,
          ].filter(Boolean);
          setForm((f) => ({
            ...f,
            lat,
            lng,
            address: parts.join(", ") || data.display_name,
          }));
        } catch {
        } finally {
          setLocLoading(false);
        }
      },
      () => {
        setError("Location access denied");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const validateStep1 = () => {
    if (!form.name || !form.email || !form.password || !form.phone)
      return setError("All fields are required") || false;
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match") || false;
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters") || false;
    if (!/^[6-9]\d{9}$/.test(form.phone))
      return setError("Enter valid 10-digit phone number") || false;
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.pumpName || !form.address || !form.licenseNumber)
      return setError("Pump name, address and license number are required");
    if (!files.aadharPhoto) return setError("Aadhaar photo is required");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("phone", form.phone);
      fd.append("pumpName", form.pumpName);
      fd.append("address", form.address);
      fd.append("licenseNumber", form.licenseNumber);
      if (form.lng) fd.append("lng", form.lng);
      if (form.lat) fd.append("lat", form.lat);
      form.pumpType.forEach((t) => fd.append("pumpType[]", t));
      if (files.profileImage) fd.append("profileImage", files.profileImage);
      if (files.aadharPhoto) fd.append("aadharPhoto", files.aadharPhoto);
      if (files.ownerIdProof) fd.append("ownerIdProof", files.ownerIdProof);
      const res = await fetch("/api/auth/register/pump", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (success)
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <MdVerified className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-gray-900 font-black text-xl mb-2">
            Registration Submitted!
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your pump registration is under review. SuperAdmin will approve your
            account shortly. You'll receive an email once approved.
          </p>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 text-left">
            <p className="text-orange-600 text-xs font-bold mb-2">
              What happens next?
            </p>
            <ul className="text-orange-500 text-xs space-y-1.5">
              {[
                "SuperAdmin reviews your details",
                `Approval email sent to ${form.email}`,
                "Login to start managing your pump",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <FaCheckCircle className="text-orange-400 text-xs flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-200/60 flex items-center justify-center gap-2"
          >
            Go to Login <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-xl shadow-orange-200 mx-auto mb-2">
            <FaGasPump className="text-white text-2xl" />
          </div>
          <h1 className="text-gray-900 font-black text-lg">Register Pump</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Create your pump admin account
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-5">
          {["Owner Details", "Pump Details"].map((label, i) => {
            const isActive = step === i + 1;
            const isDone = step > i + 1;
            return (
              <div key={label} className="flex items-center gap-1.5 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                    isDone
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-gradient-to-tr from-orange-500 to-amber-400 text-white"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? <MdCheckCircle className="text-xs" /> : i + 1}
                </div>
                <p
                  className={`text-[9px] font-bold truncate ${isActive ? "text-orange-500" : isDone ? "text-green-500" : "text-gray-300"}`}
                >
                  {label}
                </p>
                {i < 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full ${isDone ? "bg-green-400" : "bg-gray-100"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          {/* Step 1: Owner Details */}
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-gray-800 font-black text-sm">
                Owner Details
              </h3>

              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-1.5 py-2">
                <button
                  type="button"
                  onClick={() => document.getElementById("profileImg").click()}
                  className="w-16 h-16 rounded-full border-2 border-dashed border-orange-300 overflow-hidden bg-gray-50 flex items-center justify-center hover:border-orange-400 transition"
                >
                  {previews.profileImage ? (
                    <img
                      src={previews.profileImage}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaCamera className="text-orange-300 text-2xl" />
                  )}
                </button>
                <p className="text-gray-400 text-[10px]">
                  Profile Photo (optional)
                </p>
                <input
                  id="profileImg"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile("profileImage")}
                />
              </div>

              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
                className={inputCls}
              />
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
                className={inputCls}
              />
              <input
                name="phone"
                placeholder="Phone Number (10 digits)"
                value={form.phone}
                onChange={handleChange}
                required
                maxLength={10}
                className={inputCls}
              />
              <input
                name="password"
                type="password"
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={handleChange}
                required
                className={inputCls}
              />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className={inputCls}
              />

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-200/60 flex items-center justify-center gap-2"
              >
                Continue <FaChevronRight className="text-xs" />
              </button>
            </div>
          )}

          {/* Step 2: Pump Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <h3 className="text-gray-800 font-black text-sm">Pump Details</h3>

              <input
                name="pumpName"
                placeholder="Pump Name"
                value={form.pumpName}
                onChange={handleChange}
                required
                className={inputCls}
              />
              <input
                name="licenseNumber"
                placeholder="License Number"
                value={form.licenseNumber}
                onChange={handleChange}
                required
                className={inputCls}
              />
              <input
                name="address"
                placeholder="Pump Address"
                value={form.address}
                onChange={handleChange}
                required
                className={inputCls}
              />

              {/* Location */}
              <button
                type="button"
                onClick={getLocation}
                disabled={locLoading}
                className="w-full bg-gray-50 border border-gray-100 text-gray-500 py-3 rounded-xl text-xs hover:border-orange-300 hover:text-orange-500 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {locLoading ? (
                  <>
                    <IoMdSync className="animate-spin text-base" /> Fetching
                    location...
                  </>
                ) : form.lat ? (
                  <>
                    <FaMapMarkerAlt className="text-orange-500 text-sm" />
                    <span className="truncate max-w-[200px]">
                      {form.address ||
                        `${Number(form.lat).toFixed(4)}, ${Number(form.lng).toFixed(4)}`}
                    </span>
                  </>
                ) : (
                  <>
                    <MdMyLocation className="text-orange-500 text-base" /> Use
                    My Location
                  </>
                )}
              </button>

              {/* Fuel Types */}
              <div>
                <p className="text-gray-500 text-[10px] font-semibold mb-1.5">
                  Fuel Types Available
                </p>
                <div className="flex gap-2">
                  {[
                    { type: "petrol", Icon: FaGasPump },
                    { type: "diesel", Icon: FaFire },
                  ].map(({ type, Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => togglePumpType(type)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition capitalize flex items-center justify-center gap-1.5 ${
                        form.pumpType.includes(type)
                          ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white border-transparent"
                          : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}
                    >
                      <Icon className="text-xs" /> {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div>
                <p className="text-gray-500 text-[10px] font-semibold mb-1.5">
                  Documents
                </p>
                <div className="space-y-2">
                  {[
                    {
                      field: "aadharPhoto",
                      label: "Aadhaar Card *",
                      Icon: FaIdCard,
                    },
                    {
                      field: "ownerIdProof",
                      label: "Owner ID Proof (optional)",
                      Icon: FaFileAlt,
                    },
                  ].map(({ field, label, Icon }) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => document.getElementById(field).click()}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition ${
                        files[field]
                          ? "bg-green-50 border-green-200 text-green-600"
                          : "bg-gray-50 border-gray-100 text-gray-500 hover:border-orange-300"
                      }`}
                    >
                      {files[field] ? (
                        <FaCheckCircle className="text-green-500 text-sm flex-shrink-0" />
                      ) : (
                        <Icon className="text-gray-400 text-sm flex-shrink-0" />
                      )}
                      <span className="flex-1 text-left truncate">
                        {files[field] ? files[field].name : label}
                      </span>
                      <input
                        id={field}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleFile(field)}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <FaChevronLeft className="text-xs" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-200/60 disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <IoMdSync className="animate-spin text-sm" />{" "}
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-4 text-gray-400">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-bold text-orange-500 hover:text-orange-600"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
