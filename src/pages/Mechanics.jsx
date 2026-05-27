import { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import Swal from "sweetalert2";
import {
  FaWrench,
  FaPhone,
  FaStar,
  FaCheckCircle,
  FaTimesCircle,
  FaCamera,
  FaIdCard,
  FaPlus,
} from "react-icons/fa";
import { MdBuild, MdInfo, MdPerson } from "react-icons/md";
import { HiLightningBolt } from "react-icons/hi";

const inputCls =
  "w-full bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition";
const SKILLS = ["engine", "puncture", "battery", "oil", "all work"];

export default function Mechanics() {
  const [mechanics, setMechanics] = useState({ internal: [], external: [] });
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState("internal");
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    experience: "",
    address: "",
    skills: [],
  });
  const [files, setFiles] = useState({ profileImage: null, aadharPhoto: null });
  const [previews, setPreviews] = useState({ profileImage: null });
  const profileRef = useRef(null);
  const aadharRef = useRef(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        api.get("/pump-admin/mechanics"),
        api.get("/pump-admin/mechanics/pending"),
      ]);
      setMechanics(m.data.data || { internal: [], external: [] });
      setPending(Array.isArray(p.data.data) ? p.data.data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleToggle = async (id) => {
    try {
      await api.patch(`/pump-admin/mechanics/${id}/toggle`);
      fetchAll();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: err.response?.data?.message || "Failed",
      });
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/pump-admin/mechanics/${id}/approve`);
      fetchAll();
      Swal.fire({
        icon: "success",
        title: "Approved!",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: err.response?.data?.message || "Failed",
      });
    }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: "Reject Mechanic?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Reject",
    });
    if (!result.isConfirmed) return;
    try {
      await api.patch(`/pump-admin/mechanics/${id}/reject`);
      fetchAll();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: err.response?.data?.message || "Failed",
      });
    }
  };

  const toggleSkill = (skill) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));

  const handleFile = (field) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFiles((f) => ({ ...f, [field]: file }));
    if (field === "profileImage")
      setPreviews((p) => ({ ...p, profileImage: URL.createObjectURL(file) }));
  };

  const handleAddMechanic = async () => {
    if (!form.name || !form.phone)
      return Swal.fire({
        icon: "warning",
        title: "Name and phone are required",
      });
    if (!/^[6-9]\d{9}$/.test(form.phone))
      return Swal.fire({
        icon: "warning",
        title: "Enter valid 10-digit phone",
      });
    setAddLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      if (form.email) fd.append("email", form.email);
      if (form.experience) fd.append("experience", form.experience);
      if (form.address) fd.append("address", form.address);
      form.skills.forEach((s) => fd.append("skills", s));
      if (files.profileImage) fd.append("profileImage", files.profileImage);
      if (files.aadharPhoto) fd.append("aadharPhoto", files.aadharPhoto);
      await api.post("/pump-admin/mechanics", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowAddForm(false);
      setForm({
        name: "",
        phone: "",
        email: "",
        experience: "",
        address: "",
        skills: [],
      });
      setFiles({ profileImage: null, aadharPhoto: null });
      setPreviews({ profileImage: null });
      fetchAll();
      Swal.fire({
        icon: "success",
        title: "Mechanic Added!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: err.response?.data?.message || "Failed to add mechanic",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const MechanicCard = ({ m, showActions = true, showApprove = false }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
          {m.profileImage ? (
            <img
              src={m.profileImage}
              alt={m.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-black text-sm">{m.name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <p className="text-gray-900 font-bold text-xs">{m.name}</p>
            <span
              className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${m.type === "internal" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"}`}
            >
              {m.type}
            </span>
            <span
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                m.currentStatus === "idle"
                  ? "bg-green-50 text-green-600 border-green-100"
                  : m.currentStatus === "busy"
                    ? "bg-orange-50 text-orange-600 border-orange-100"
                    : "bg-gray-50 text-gray-400 border-gray-100"
              }`}
            >
              {m.currentStatus}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <FaPhone className="text-gray-400 text-[9px]" />
            <p className="text-gray-400 text-[10px]">{m.phone}</p>
          </div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <FaWrench className="text-gray-400 text-[9px]" />
            <p className="text-gray-400 text-[10px]">
              {m.skills?.join(", ") || "General"} · {m.experience}yr exp
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <FaStar className="text-yellow-400 text-[9px]" />
              <span className="text-gray-300 text-[9px]">{m.rating || 0}</span>
            </div>
            <span className="text-gray-200 text-[9px]">·</span>
            <span className="text-gray-300 text-[9px]">{m.totalJobs} jobs</span>
            <span className="text-gray-200 text-[9px]">·</span>
            {m.isAvailable ? (
              <div className="flex items-center gap-0.5">
                <FaCheckCircle className="text-green-500 text-[9px]" />
                <span className="text-green-500 text-[9px]">Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                <FaTimesCircle className="text-red-400 text-[9px]" />
                <span className="text-red-400 text-[9px]">Unavailable</span>
              </div>
            )}
          </div>
        </div>
        {showActions && (
          <button
            onClick={() => handleToggle(m._id)}
            className={`text-[9px] font-bold px-2.5 py-1.5 rounded-full border transition flex-shrink-0 ${
              m.status === "active"
                ? "bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
                : "bg-green-50 text-green-500 border-green-100 hover:bg-green-100"
            }`}
          >
            {m.status === "active" ? "Deactivate" : "Activate"}
          </button>
        )}
      </div>
      {showApprove && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => handleApprove(m._id)}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1.5"
          >
            <FaCheckCircle className="text-xs" /> Approve
          </button>
          <button
            onClick={() => handleReject(m._id)}
            className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 font-bold text-[10px] border border-red-100 flex items-center justify-center gap-1.5"
          >
            <FaTimesCircle className="text-xs" /> Reject
          </button>
        </div>
      )}
    </div>
  );

  const tabs = [
    { key: "internal", label: `Internal (${mechanics.internal?.length || 0})` },
    { key: "external", label: `External (${mechanics.external?.length || 0})` },
    {
      key: "pending",
      label: `Pending (${pending.length})`,
      badge: pending.length,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-black text-lg">Mechanics</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {(mechanics.internal?.length || 0) +
              (mechanics.external?.length || 0)}{" "}
            total · {pending.length} pending
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-200/60"
        >
          <FaPlus className="text-xs" /> Add Internal
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-start gap-2">
        <MdInfo className="text-blue-500 text-base flex-shrink-0 mt-0.5" />
        <p className="text-blue-600 text-[10px] leading-relaxed">
          When assigning a mechanic,{" "}
          <strong>internal mechanics are prioritized first</strong>. External
          mechanics are shown only if no internal mechanic is available.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
              tab === t.key
                ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white border-transparent shadow-sm"
                : "bg-white text-gray-500 border-gray-100"
            }`}
          >
            {t.label}
            {t.badge > 0 && tab !== t.key && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {tab === "internal" &&
            (mechanics.internal?.length === 0 ? (
              <div className="text-center py-12">
                <FaWrench className="text-gray-200 text-4xl mx-auto mb-3" />
                <p className="text-gray-300 text-sm mb-3">
                  No internal mechanics yet
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md"
                >
                  Add Your First Mechanic
                </button>
              </div>
            ) : (
              mechanics.internal.map((m) => <MechanicCard key={m._id} m={m} />)
            ))}

          {tab === "external" &&
            (mechanics.external?.length === 0 ? (
              <div className="text-center py-12">
                <FaWrench className="text-gray-200 text-4xl mx-auto mb-2" />
                <p className="text-gray-300 text-sm">
                  No approved external mechanics
                </p>
              </div>
            ) : (
              mechanics.external.map((m) => <MechanicCard key={m._id} m={m} />)
            ))}

          {tab === "pending" &&
            (pending.length === 0 ? (
              <div className="text-center py-12">
                <FaCheckCircle className="text-gray-200 text-4xl mx-auto mb-2" />
                <p className="text-gray-300 text-sm">No pending requests</p>
              </div>
            ) : (
              pending.map((m) => (
                <MechanicCard
                  key={m._id}
                  m={m}
                  showActions={false}
                  showApprove={true}
                />
              ))
            ))}
        </div>
      )}

      {/* Add Mechanic Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-50 flex items-center justify-between z-10">
              <div>
                <h3 className="text-gray-900 font-black text-sm">
                  Add Internal Mechanic
                </h3>
                <p className="text-gray-400 text-[10px] mt-0.5">
                  Exclusive to your pump
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <FaTimesCircle className="text-gray-400 text-sm" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => profileRef.current?.click()}
                  className="w-16 h-16 rounded-full border-2 border-dashed border-orange-300 overflow-hidden bg-gray-50 flex items-center justify-center"
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
                  ref={profileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile("profileImage")}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 text-[10px] font-semibold mb-1 block">
                    Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-semibold mb-1 block">
                    Phone *
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    placeholder="10-digit"
                    className={inputCls}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 text-[10px] font-semibold mb-1 block">
                    Email
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="Optional"
                    type="email"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-semibold mb-1 block">
                    Experience (yrs)
                  </label>
                  <input
                    value={form.experience}
                    onChange={(e) =>
                      setForm({ ...form, experience: e.target.value })
                    }
                    placeholder="0"
                    type="number"
                    min="0"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-500 text-[10px] font-semibold mb-1 block">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Mechanic's address"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-gray-500 text-[10px] font-semibold mb-1.5 block">
                  Skills
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition capitalize ${
                        form.skills.includes(skill)
                          ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white border-transparent"
                          : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-500 text-[10px] font-semibold mb-1 block">
                  Aadhaar Photo (optional)
                </label>
                <button
                  type="button"
                  onClick={() => aadharRef.current?.click()}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition ${
                    files.aadharPhoto
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-gray-50 border-gray-100 text-gray-500 hover:border-orange-300"
                  }`}
                >
                  {files.aadharPhoto ? (
                    <FaCheckCircle className="text-green-500 text-sm" />
                  ) : (
                    <FaIdCard className="text-gray-400 text-sm" />
                  )}
                  <span className="truncate">
                    {files.aadharPhoto
                      ? files.aadharPhoto.name
                      : "Upload Aadhaar"}
                  </span>
                </button>
                <input
                  ref={aadharRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFile("aadharPhoto")}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMechanic}
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {addLoading ? (
                    "Adding..."
                  ) : (
                    <>
                      <FaPlus className="text-xs" /> Add Mechanic
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
