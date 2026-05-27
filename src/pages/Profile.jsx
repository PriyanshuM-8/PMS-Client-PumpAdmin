import { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  FaGasPump,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaFire,
} from "react-icons/fa";
import { MdPerson, MdVerified, MdCheckCircle, MdCancel } from "react-icons/md";

export default function Profile() {
  const { user } = useAuth();
  const [pump, setPump] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/pump-admin/pump")
      .then(({ data }) => setPump(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const InfoRow = ({ Icon, iconColor, label, value }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-3">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Icon className={`text-sm ${iconColor}`} />
        <p className="text-gray-400 text-xs">{label}</p>
      </div>
      <p className="text-gray-800 text-xs font-semibold text-right truncate max-w-[55%]">
        {value || "—"}
      </p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h1 className="text-gray-900 font-black text-lg">Profile</h1>
        <p className="text-gray-400 text-xs mt-0.5">Pump & account details</p>
      </div>

      {/* Pump Card */}
      <div className="bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl p-5 shadow-md shadow-orange-200/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <FaGasPump className="text-white text-2xl" />
          </div>
          <div>
            <p className="text-white font-black text-base">
              {pump?.pumpName || "My Pump"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <FaMapMarkerAlt className="text-white/60 text-xs" />
              <p className="text-white/70 text-xs">{pump?.address?.full}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center">
            {pump?.status === "active" ? (
              <MdCheckCircle className="text-green-300 text-lg mx-auto" />
            ) : (
              <MdCancel className="text-red-300 text-lg mx-auto" />
            )}
            <p className="text-white/70 text-[9px] mt-0.5 capitalize">
              {pump?.status}
            </p>
          </div>
          <div className="flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center">
            {pump?.approvalStatus === "approved" ? (
              <MdVerified className="text-green-300 text-lg mx-auto" />
            ) : (
              <FaFire className="text-yellow-300 text-lg mx-auto" />
            )}
            <p className="text-white/70 text-[9px] mt-0.5 capitalize">
              {pump?.approvalStatus}
            </p>
          </div>
          <div className="flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center">
            <FaFire className="text-amber-200 text-lg mx-auto" />
            <p className="text-white/70 text-[9px] mt-0.5">
              {pump?.pumpType?.join(", ") || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Pump Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-2">
          Pump Details
        </p>
        <InfoRow
          Icon={FaGasPump}
          iconColor="text-orange-400"
          label="Pump Name"
          value={pump?.pumpName}
        />
        <InfoRow
          Icon={FaPhone}
          iconColor="text-green-500"
          label="Phone"
          value={pump?.phone}
        />
        <InfoRow
          Icon={FaEnvelope}
          iconColor="text-blue-400"
          label="Email"
          value={pump?.email}
        />
        <InfoRow
          Icon={FaIdCard}
          iconColor="text-purple-400"
          label="License No."
          value={pump?.licenseNumber}
        />
        <InfoRow
          Icon={FaMapMarkerAlt}
          iconColor="text-red-400"
          label="Address"
          value={pump?.address?.full}
        />
      </div>

      {/* Owner Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-2">
          Owner Details
        </p>
        <InfoRow
          Icon={MdPerson}
          iconColor="text-gray-400"
          label="Name"
          value={user?.name}
        />
        <InfoRow
          Icon={FaEnvelope}
          iconColor="text-blue-400"
          label="Email"
          value={user?.email}
        />
      </div>
    </div>
  );
}
