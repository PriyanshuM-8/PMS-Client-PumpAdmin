import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  MdBookmarks,
  MdPeople,
  MdLocalGasStation,
  MdBuild,
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdChevronRight,
  MdAccessTime,
  MdEdit,
  MdClose,
  MdCheck,
} from "react-icons/md";
import {
  FaWrench,
  FaGasPump,
  FaCheckCircle,
  FaClipboardList,
  FaUsers,
  FaBell,
  FaCalendarAlt,
} from "react-icons/fa";
import { HiLightningBolt } from "react-icons/hi";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const formatDate = () =>
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const statusColor = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-100",
  accepted: "bg-blue-50 text-blue-600 border-blue-100",
  assigned: "bg-purple-50 text-purple-600 border-purple-100",
  in_progress: "bg-orange-50 text-orange-600 border-orange-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

const StatCard = ({
  label,
  value,
  Icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
        {label}
      </p>
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon className={`text-base ${iconColor}`} />
      </span>
    </div>
    <p className="text-gray-900 font-black text-2xl">{value}</p>
    {trendLabel && (
      <div
        className={`flex items-center gap-1 mt-1.5 text-[10px] font-semibold ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-400" : "text-gray-400"}`}
      >
        {trend === "up" ? (
          <MdTrendingUp className="text-sm" />
        ) : trend === "down" ? (
          <MdTrendingDown className="text-sm" />
        ) : null}
        {trendLabel}
      </div>
    )}
  </div>
);

const QuickAction = ({
  Icon,
  iconBg,
  iconColor,
  label,
  onClick,
  border,
  hover,
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:shadow-md active:scale-[0.97] ${border} ${hover}`}
  >
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
    >
      <Icon className={`text-xl ${iconColor}`} />
    </div>
    <p className="text-xs font-bold text-center leading-tight">{label}</p>
  </button>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold" style={{ color: p.color }}>
          {p.name === "revenue" ? `₹${p.value?.toLocaleString()}` : p.value}{" "}
          {p.name}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [fuelPrices, setFuelPrices] = useState({
    petrol: 0,
    diesel: 0,
    lastUpdated: null,
  });
  const [priceModal, setPriceModal] = useState(false);
  const [priceForm, setPriceForm] = useState({ petrol: "", diesel: "" });
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get("/pump-admin/dashboard"),
      api.get("/pump-admin/dashboard/chart"),
      api.get("/pump-admin/bookings"),
      api.get("/pump-admin/fuel-prices"),
    ])
      .then(([s, c, b, fp]) => {
        setStats(s.data.data);
        setChart(c.data.data || []);
        setRecentBookings(b.data.data?.slice(0, 5) || []);
        if (fp.data.data) setFuelPrices(fp.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openPriceModal = () => {
    setPriceForm({
      petrol: fuelPrices.petrol || "",
      diesel: fuelPrices.diesel || "",
    });
    setPriceError("");
    setPriceModal(true);
  };

  const savePrices = async () => {
    if (!priceForm.petrol || !priceForm.diesel)
      return setPriceError("Both prices required");
    setPriceLoading(true);
    try {
      const { data } = await api.put("/pump-admin/fuel-prices", {
        petrol: parseFloat(priceForm.petrol),
        diesel: parseFloat(priceForm.diesel),
      });
      setFuelPrices(data.data);
      setPriceModal(false);
    } catch (err) {
      setPriceError(err.response?.data?.message || "Update failed");
    } finally {
      setPriceLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const pendingCount = stats?.pendingOrders ?? 0;

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 font-black text-lg leading-tight">
            {getGreeting()}, {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Manage your petrol pump operations efficiently
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate("/bookings")}
            className="relative w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition"
          >
            <FaBell className="text-gray-500 text-sm" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm hidden lg:block">
            <div className="flex items-center gap-1.5 mb-0.5">
              <FaCalendarAlt className="text-gray-400 text-[9px]" />
              <p className="text-gray-500 text-[10px] font-semibold">
                {formatDate()}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <MdAccessTime className="text-gray-400 text-xs" />
              <p className="text-gray-800 text-xs font-black">
                {time.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <button
          onClick={() => navigate("/bookings")}
          className="w-full flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 hover:bg-yellow-100 transition text-left"
        >
          <MdWarning className="text-yellow-500 text-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-yellow-700 font-bold text-xs">
              {pendingCount} booking{pendingCount > 1 ? "s" : ""} waiting for
              your action
            </p>
            <p className="text-yellow-500 text-[10px]">
              Click to view and accept pending bookings
            </p>
          </div>
          <MdChevronRight className="text-yellow-500 text-base flex-shrink-0" />
        </button>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Orders Today"
          value={stats?.totalOrdersToday ?? 0}
          Icon={FaClipboardList}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          trend="up"
          trendLabel="vs yesterday"
        />
        <StatCard
          label="Pending"
          value={stats?.pendingOrders ?? 0}
          Icon={MdAccessTime}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
          trend={pendingCount > 0 ? "down" : "neutral"}
          trendLabel="needs action"
        />
        <StatCard
          label="Active"
          value={stats?.activeDeliveries ?? 0}
          Icon={HiLightningBolt}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          trend="up"
          trendLabel="in progress"
        />
        <StatCard
          label="Completed"
          value={stats?.completedToday ?? 0}
          Icon={FaCheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          trend="up"
          trendLabel="today"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl p-4 shadow-md shadow-orange-200/60">
          <div className="flex items-center gap-2 mb-2">
            <MdTrendingUp className="text-white/70 text-base" />
            <p className="text-white/70 text-[10px] uppercase tracking-wider font-semibold">
              Revenue Today
            </p>
          </div>
          <p className="text-white font-black text-2xl">
            ₹{stats?.revenueToday?.toLocaleString() ?? 0}
          </p>
          <p className="text-white/60 text-[10px] mt-1">Platform earnings</p>
        </div>
        <div className="bg-gradient-to-tr from-gray-800 to-gray-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <FaCalendarAlt className="text-white/70 text-sm" />
            <p className="text-white/70 text-[10px] uppercase tracking-wider font-semibold">
              This Month
            </p>
          </div>
          <p className="text-white font-black text-2xl">
            ₹{stats?.revenueMonth?.toLocaleString() ?? 0}
          </p>
          <p className="text-white/60 text-[10px] mt-1">Monthly total</p>
        </div>
        <div className="grid grid-cols-1 gap-3 col-span-2 lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <FaUsers className="text-purple-500 text-base" />
            </span>
            <div>
              <p className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold">
                Customers
              </p>
              <p className="text-gray-900 font-black text-lg">
                {stats?.totalCustomers ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fuel Delivered */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaGasPump className="text-orange-500 text-sm" />
            <p className="text-gray-700 font-bold text-xs">
              Total Fuel Delivered
            </p>
          </div>
          <span className="text-orange-500 font-black text-sm">
            {stats?.totalFuelDelivered?.toFixed(0) ?? 0} L
          </span>
        </div>
        <div className="space-y-2">
          {[
            {
              label: "Petrol",
              value: 65,
              color: "from-orange-400 to-amber-300",
            },
            { label: "Diesel", value: 35, color: "from-gray-600 to-gray-500" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${color} rounded-full`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fuel Prices */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaGasPump className="text-orange-500 text-sm" />
            <p className="text-gray-700 font-bold text-xs">Fuel Prices</p>
          </div>
          <button
            onClick={openPriceModal}
            className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition"
          >
            <MdEdit className="text-sm" /> Update
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl p-3">
            <p className="text-white/70 text-[9px] uppercase tracking-widest font-semibold">
              Petrol
            </p>
            <p className="text-white font-black text-xl mt-0.5">
              {fuelPrices.petrol ? (
                `₹${fuelPrices.petrol}`
              ) : (
                <span className="text-white/50 text-sm">Not set</span>
              )}
            </p>
            <p className="text-white/60 text-[9px] mt-0.5">per litre</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-white/70 text-[9px] uppercase tracking-widest font-semibold">
              Diesel
            </p>
            <p className="text-white font-black text-xl mt-0.5">
              {fuelPrices.diesel ? (
                `₹${fuelPrices.diesel}`
              ) : (
                <span className="text-white/50 text-sm">Not set</span>
              )}
            </p>
            <p className="text-white/60 text-[9px] mt-0.5">per litre</p>
          </div>
        </div>
        {fuelPrices.lastUpdated && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <MdAccessTime className="text-gray-300 text-xs" />
            <p className="text-gray-400 text-[10px]">
              Last updated:{" "}
              {new Date(fuelPrices.lastUpdated).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>

      {/* Price Update Modal */}
      {priceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaGasPump className="text-orange-500 text-sm" />
                <p className="text-gray-800 font-bold text-sm">
                  Update Fuel Prices
                </p>
              </div>
              <button
                onClick={() => setPriceModal(false)}
                className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition"
              >
                <MdClose className="text-gray-500 text-sm" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">
                  Petrol (per litre)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={priceForm.petrol}
                    onChange={(e) =>
                      setPriceForm((f) => ({ ...f, petrol: e.target.value }))
                    }
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">
                  Diesel (per litre)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={priceForm.diesel}
                    onChange={(e) =>
                      setPriceForm((f) => ({ ...f, diesel: e.target.value }))
                    }
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>
              </div>
              {priceError && (
                <p className="text-red-500 text-xs">{priceError}</p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setPriceModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={savePrices}
                disabled={priceLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-bold shadow-sm shadow-orange-200 disabled:opacity-60 flex items-center justify-center gap-1.5 transition"
              >
                {priceLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <MdCheck className="text-sm" /> Save Prices
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-3 gap-2">
          <QuickAction
            Icon={MdBookmarks}
            iconBg="bg-yellow-100"
            iconColor="text-yellow-600"
            label="Pending Bookings"
            onClick={() => navigate("/bookings")}
            border="border-yellow-100"
            hover="hover:bg-yellow-50 text-yellow-600"
          />
          <QuickAction
            Icon={FaUsers}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            label="View Customers"
            onClick={() => navigate("/customers")}
            border="border-purple-100"
            hover="hover:bg-purple-50 text-purple-600"
          />
          <QuickAction
            Icon={FaGasPump}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            label="Pump Profile"
            onClick={() => navigate("/profile")}
            border="border-orange-100"
            hover="hover:bg-orange-50 text-orange-600"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MdBookmarks className="text-orange-400 text-sm" />
              <p className="text-gray-700 font-bold text-xs">
                Bookings — Last 7 Days
              </p>
            </div>
            <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              Weekly
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chart} barSize={18}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="bookings"
                fill="url(#barGrad)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.7} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MdTrendingUp className="text-orange-400 text-sm" />
              <p className="text-gray-700 font-bold text-xs">
                Revenue — Last 7 Days
              </p>
            </div>
            <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              Weekly
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chart}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#f97316" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <FaClipboardList className="text-orange-400 text-sm" />
            <p className="text-gray-700 font-bold text-xs">Recent Bookings</p>
          </div>
          <button
            onClick={() => navigate("/bookings")}
            className="flex items-center gap-1 text-orange-500 text-[10px] font-bold hover:text-orange-600"
          >
            View All <MdChevronRight className="text-sm" />
          </button>
        </div>
        {recentBookings.length === 0 ? (
          <div className="text-center py-8">
            <FaClipboardList className="text-gray-200 text-3xl mx-auto mb-2" />
            <p className="text-gray-300 text-xs">No bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    "Booking ID",
                    "Customer",
                    "Service",
                    "Amount",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[9px] text-gray-400 uppercase tracking-wider font-bold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, i) => (
                  <tr
                    key={b._id}
                    className={`border-t border-gray-50 hover:bg-gray-50/50 transition ${i % 2 !== 0 ? "bg-gray-50/30" : ""}`}
                  >
                    <td className="px-4 py-3 text-[10px] text-gray-400 font-mono">
                      #{b._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800 font-semibold">
                      {b.customer?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        {b.serviceType === "fuel" ? (
                          <>
                            <FaGasPump className="text-orange-400 text-xs" />{" "}
                            {b.fuelDetails?.fuelType || "Fuel"}
                          </>
                        ) : (
                          <>
                            <FaWrench className="text-blue-400 text-xs" />{" "}
                            Mechanic
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800 font-bold">
                      {b.amount ? `₹${b.amount}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full border capitalize ${statusColor[b.status]}`}
                      >
                        {b.status?.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
