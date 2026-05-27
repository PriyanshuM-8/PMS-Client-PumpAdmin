import { useEffect, useState } from "react";
import api from "../utils/api";
import Swal from "sweetalert2";
import {
  FaUsers,
  FaCar,
  FaClipboardList,
  FaSearch,
  FaBan,
  FaCheckCircle,
} from "react-icons/fa";
import { MdPerson } from "react-icons/md";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/pump-admin/customers");
      setCustomers(Array.isArray(data.data) ? data.data : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleBlock = async (id, isBlocked) => {
    const result = await Swal.fire({
      title: isBlocked ? "Unblock Customer?" : "Block Customer?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isBlocked ? "#22c55e" : "#ef4444",
      confirmButtonText: isBlocked ? "Unblock" : "Block",
    });
    if (!result.isConfirmed) return;
    try {
      await api.patch(`/pump-admin/customers/${id}/toggle-block`);
      fetchCustomers();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: err.response?.data?.message || "Failed",
      });
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-gray-900 font-black text-lg">Customers</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          {customers.length} total customers
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-3 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FaUsers className="text-gray-200 text-4xl mx-auto mb-2" />
          <p className="text-gray-300 text-sm">No customers found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0">
                {c.profileImage ? (
                  <img
                    src={c.profileImage}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black text-sm">
                    {c.name?.[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-gray-900 font-bold text-xs">{c.name}</p>
                  {c.isBlocked && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                      Blocked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <MdPerson className="text-gray-400 text-xs" />
                  <p className="text-gray-400 text-[10px]">{c.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <FaCar className="text-orange-400 text-[9px]" />
                    <span className="text-gray-400 text-[10px]">
                      {c.vehicles?.length || 0} vehicles
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaClipboardList className="text-gray-400 text-[9px]" />
                    <span className="text-gray-400 text-[10px]">
                      {c.totalOrders || 0} orders
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggleBlock(c._id, c.isBlocked)}
                className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1.5 rounded-full border transition flex-shrink-0 ${
                  c.isBlocked
                    ? "bg-green-50 text-green-500 border-green-100 hover:bg-green-100"
                    : "bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
                }`}
              >
                {c.isBlocked ? (
                  <>
                    <FaCheckCircle className="text-[9px]" /> Unblock
                  </>
                ) : (
                  <>
                    <FaBan className="text-[9px]" /> Block
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
