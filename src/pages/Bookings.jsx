import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Swal from "sweetalert2";
import { getSocket } from "../utils/socket";
import {
  FaGasPump, FaWrench, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt,
} from "react-icons/fa";
import { MdAccessTime, MdPerson } from "react-icons/md";
import { HiLightningBolt } from "react-icons/hi";
import { IoMdSync } from "react-icons/io";

const statusColor = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-100",
  accepted: "bg-blue-50 text-blue-600 border-blue-100",
  assigned: "bg-purple-50 text-purple-600 border-purple-100",
  in_progress: "bg-orange-50 text-orange-600 border-orange-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

const ETA_OPTIONS = [10, 15, 20, 30, 45, 60];
const filters = ["all", "pending", "accepted", "assigned", "in_progress", "completed", "cancelled"];

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [assignSheet, setAssignSheet] = useState(null);

  const [acceptSheet, setAcceptSheet] = useState(null);
  const [completeSheet, setCompleteSheet] = useState(null);
  const [eta, setEta] = useState(15);
  const [workDetails, setWorkDetails] = useState({ description: "", labourCharge: "", partsChanged: [] });
  const [completing, setCompleting] = useState(false);
  const [mechanicBillSheet, setMechanicBillSheet] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/bookings/pump/all" : `/bookings/pump/all?status=${filter}`;
      const { data } = await api.get(url);
      setBookings(Array.isArray(data.data) ? data.data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (filter === "all" || filter === "pending") fetchBookings();
    }, 15000);
    return () => clearInterval(interval);
  }, [filter, fetchBookings]);

  useEffect(() => {
    const attachSocketListeners = () => {
      const socket = getSocket();
      if (!socket) return;

      socket.off("new_booking");
      socket.off("booking_taken");
      socket.off("booking_cancelled");

      socket.on("new_booking", (data) => {
        fetchBookings();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          title: `New booking from ${data.customerName || "customer"}`,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
        });
      });

      socket.on("booking_taken", (data) => {
        setBookings((prev) => prev.filter((b) => b._id?.toString() !== data.bookingId?.toString()));
      });

      socket.on("booking_cancelled", (data) => {
        setBookings((prev) => prev.filter((b) => b._id?.toString() !== data.bookingId?.toString()));
      });
    };

    attachSocketListeners();

    let attempts = 0;
    const interval = setInterval(() => {
      const socket = getSocket();
      if (socket?.connected || attempts >= 5) {
        clearInterval(interval);
        attachSocketListeners();
      }
      attempts++;
    }, 1000);

    return () => {
      clearInterval(interval);
      const socket = getSocket();
      if (socket) {
        socket.off("new_booking");
        socket.off("booking_taken");
        socket.off("booking_cancelled");
      }
    };
  }, [filter, fetchBookings]);

  const handleAccept = async () => {
    try {
      await api.patch(`/bookings/pump/${acceptSheet._id}/accept`, { estimatedArrival: eta });
      setAcceptSheet(null);
      fetchBookings();
      Swal.fire({ icon: "success", title: `Accepted! ETA: ${eta} min`, timer: 1500, showConfirmButton: false });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed";
      if (msg.includes("Insufficient wallet balance")) {
        setAcceptSheet(null);
        Swal.fire({
          title: "Insufficient Balance",
          text: msg,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Recharge Wallet",
          cancelButtonText: "Close"
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/wallet");
          }
        });
      } else {
        Swal.fire({ icon: "error", title: msg });
      }
    }
  };

  const handleReject = async (bookingId) => {
    const result = await Swal.fire({
      title: "Reject Booking?",
      text: "This booking will be passed to other nearby pumps.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Reject",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await api.patch(`/bookings/pump/${bookingId}/reject`);
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      Swal.fire({ icon: "success", title: "Booking Rejected", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Failed" });
    }
  };

  const openAssign = async (booking) => {
    if (booking.serviceType === "fuel") {
      const { data } = await api.get("/pump-admin/delivery-boys");
      setDeliveryBoys((data.data || []).filter(b => b.isActive));
      setEta(booking.estimatedArrival || 15);
      setAssignSheet(booking);
    }
  };

  const handleAssignDeliveryBoy = async (deliveryBoyId) => {
    try {
      await api.patch(`/bookings/pump/${assignSheet._id}/assign-delivery-boy`, { deliveryBoyId, estimatedArrival: eta });
      setAssignSheet(null);
      fetchBookings();
      Swal.fire({ icon: "success", title: "Delivery Boy Assigned!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Failed" });
    }
  };

  const handleReached = async (id) => {
    try {
      await api.patch(`/bookings/pump/${id}/reached`);
      fetchBookings();
      Swal.fire({ icon: "success", title: "Marked as Reached!", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Failed" });
    }
  };

  const handleInProgress = async (id) => {
    try {
      await api.patch(`/bookings/pump/${id}/in-progress`);
      fetchBookings();
      Swal.fire({ icon: "success", title: "Marked In Progress!", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Failed" });
    }
  };

  const handleCompleteClick = (b) => {
    setWorkDetails({ description: "", labourCharge: "", partsChanged: [] });
    setCompleteSheet(b);
  };

  const submitCompleteJob = async (details = null) => {
    if (completing) return;
    setCompleting(true);
    try {
      const finalDetails = details || (completeSheet.serviceType === "mechanic"
        ? { description: workDetails.description, labourCharge: parseFloat(workDetails.labourCharge) || 0 }
        : undefined);
      
      const res = await api.patch(`/bookings/pump/${completeSheet._id}/complete`, { workDetails: finalDetails });
      setCompleteSheet(null);
      setMechanicBillSheet(null);
      fetchBookings();
      
      const trialMsg = res.data?.data?.trialMessage;
      Swal.fire({ 
        icon: "success", 
        title: "Job Completed!", 
        text: trialMsg || undefined,
        timer: trialMsg ? undefined : 1500, 
        showConfirmButton: !!trialMsg 
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Failed" });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-gray-900 font-black text-lg">Bookings</h1>
        <p className="text-gray-400 text-xs mt-0.5">{bookings.length} bookings</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition ${
              filter === f
                ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white border-transparent shadow-sm"
                : "bg-white text-gray-500 border-gray-100 hover:border-orange-200"
            }`}>
            {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <FaGasPump className="text-gray-200 text-4xl mx-auto mb-3" />
          <p className="text-gray-300 text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {b.serviceType === "fuel"
                      ? <FaGasPump className="text-white text-base" />
                      : <FaWrench className="text-white text-base" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border capitalize ${statusColor[b.status]}`}>
                        {b.status.replace("_", " ")}
                      </span>
                      <span className="text-gray-300 text-[9px] font-mono">#{b._id.slice(-6).toUpperCase()}</span>
                      {b.estimatedArrival && (
                        <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                          <MdAccessTime className="text-xs" /> {b.estimatedArrival} min
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <MdPerson className="text-gray-400 text-xs flex-shrink-0" />
                      <p className="text-gray-900 font-bold text-xs">{b.customer?.name || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {b.serviceType === "fuel"
                        ? <FaGasPump className="text-orange-400 text-[10px] flex-shrink-0" />
                        : <FaWrench className="text-blue-400 text-[10px] flex-shrink-0" />}
                      <p className="text-gray-400 text-[10px]">
                        {b.serviceType === "fuel"
                          ? `${b.fuelDetails?.fuelType} · ${b.fuelDetails?.quantity}L`
                          : "Mechanic Service"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-red-400 text-[10px] flex-shrink-0" />
                      <p className="text-gray-400 text-[10px] truncate">{b.address?.full}</p>
                    </div>
                    {b.mechanic && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <FaWrench className="text-purple-400 text-[10px] flex-shrink-0" />
                        <p className="text-purple-500 text-[10px] font-semibold">{b.mechanic.name}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {b.amount > 0 ? (
                    <p className="text-gray-900 font-black text-sm">₹{b.amount}</p>
                  ) : (
                    <p className="text-gray-400 text-[10px]">On completion</p>
                  )}
                  <p className="text-gray-300 text-[9px] mt-0.5">
                    {new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                {b.status === "pending" && (
                  <>
                    <button onClick={() => handleReject(b._id)}
                      className="flex-1 py-2 rounded-xl bg-red-50 border border-red-100 text-red-500 font-bold text-[10px] flex items-center justify-center gap-1.5 hover:bg-red-100 transition">
                      <FaTimesCircle className="text-xs" /> Reject
                    </button>
                    <button onClick={() => { setAcceptSheet(b); setEta(15); }}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1.5">
                      <FaCheckCircle className="text-xs" /> Accept
                    </button>
                  </>
                )}
                {b.status === "accepted" && b.serviceType === "fuel" && (
                  <button onClick={() => openAssign(b)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1.5">
                    <FaWrench className="text-xs" /> Assign Delivery Boy
                  </button>
                )}
                {b.status === "assigned" && (
                  <button onClick={() => handleInProgress(b._id)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1.5">
                    <HiLightningBolt className="text-xs" /> Mark In Progress
                  </button>
                )}
                {b.status === "in_progress" && b.serviceType === "fuel" && (
                  <button onClick={() => handleReached(b._id)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1.5">
                    <FaMapMarkerAlt className="text-xs" /> Reached Location
                  </button>
                )}
                {(b.status === "in_progress" && b.serviceType === "mechanic") || b.status === "payment_pending" ? (
                  <button onClick={() => handleCompleteClick(b)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1.5">
                    <FaCheckCircle className="text-xs" /> Complete Job
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {acceptSheet && (
        <Sheet onClose={() => setAcceptSheet(null)}>
          <h3 className="text-gray-900 font-black text-sm mb-1">Accept Booking</h3>
          <p className="text-gray-400 text-[10px] mb-4">Set estimated arrival time for the customer</p>
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <MdPerson className="text-gray-400 text-sm" />
              <p className="text-gray-700 font-bold text-xs">{acceptSheet.customer?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {acceptSheet.serviceType === "fuel"
                ? <FaGasPump className="text-orange-400 text-xs" />
                : <FaWrench className="text-blue-400 text-xs" />}
              <p className="text-gray-400 text-[10px] capitalize">
                {acceptSheet.serviceType === "fuel"
                  ? `${acceptSheet.fuelDetails?.fuelType} · ${acceptSheet.fuelDetails?.quantity}L`
                  : "Mechanic Service"}
              </p>
            </div>
            {acceptSheet.amount > 0 && (
              <p className="text-orange-500 font-black text-sm mt-2">₹{acceptSheet.amount}</p>
            )}
          </div>
          <p className="text-gray-500 text-[10px] font-semibold mb-2 uppercase tracking-wider">Estimated Arrival Time</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ETA_OPTIONS.map((t) => (
              <button key={t} type="button" onClick={() => setEta(t)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                  eta === t
                    ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white border-transparent shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-100"
                }`}>
                {t} min
              </button>
            ))}
          </div>
          <button type="button" onClick={handleAccept}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2">
            <FaCheckCircle className="text-sm" /> Accept — ETA {eta} min
          </button>
        </Sheet>
      )}

      {assignSheet && (
        <Sheet onClose={() => setAssignSheet(null)}>
          <h3 className="text-gray-900 font-black text-sm mb-1">Assign Delivery Boy</h3>
          <p className="text-gray-400 text-[10px] mb-3">Select an available delivery boy for this fuel order</p>
          <div className="mb-4">
            <p className="text-gray-500 text-[10px] font-semibold mb-2 uppercase tracking-wider">Update ETA</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {ETA_OPTIONS.map((t) => (
                <button key={t} type="button" onClick={() => setEta(t)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition ${
                    eta === t ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white border-transparent" : "bg-gray-50 text-gray-500 border-gray-100"
                  }`}>
                  {t}m
                </button>
              ))}
            </div>
          </div>
          {deliveryBoys.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-300 text-xs">No active delivery boys available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveryBoys.map((boy) => (
                <button key={boy._id} onClick={() => handleAssignDeliveryBoy(boy._id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-orange-100 bg-orange-50/30 hover:bg-orange-50 hover:border-orange-300 transition text-left">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {boy.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold text-xs">{boy.name}</p>
                    <p className="text-gray-400 text-[10px]">{boy.phone}</p>
                  </div>
                  <span className="text-[9px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Available</span>
                </button>
              ))}
            </div>
          )}
        </Sheet>
      )}

      {completeSheet && (
        <Sheet onClose={() => setCompleteSheet(null)}>
          <h3 className="text-gray-900 font-black text-sm mb-1">Complete Job</h3>
          <p className="text-gray-400 text-[10px] mb-4">Confirm completion of this service</p>

          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <MdPerson className="text-gray-400 text-sm" />
              <p className="text-gray-700 font-bold text-xs">{completeSheet.customer?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {completeSheet.serviceType === "fuel"
                ? <FaGasPump className="text-orange-400 text-xs" />
                : <FaWrench className="text-blue-400 text-xs" />}
              <p className="text-gray-400 text-[10px] capitalize">
                {completeSheet.serviceType === "fuel"
                  ? `${completeSheet.fuelDetails?.fuelType} · ${completeSheet.fuelDetails?.quantity}L`
                  : "Mechanic Service"}
              </p>
            </div>
          </div>

          {completeSheet.serviceType === "mechanic" && (
            <>
              <p className="text-gray-500 text-[10px] font-semibold mb-2 uppercase tracking-wider">Work Summary</p>
              <textarea
                value={workDetails.description}
                onChange={(e) => setWorkDetails((p) => ({ ...p, description: e.target.value }))}
                placeholder="Work done description..."
                rows={2}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition resize-none mb-2"
              />
              <input
                type="number" placeholder="Labour charge (₹)"
                value={workDetails.labourCharge}
                onChange={(e) => setWorkDetails((p) => ({ ...p, labourCharge: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition mb-4"
              />
            </>
          )}

          <button
            onClick={() => completeSheet.serviceType === "mechanic" ? setMechanicBillSheet(completeSheet) : submitCompleteJob()}
            disabled={completing}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {completing ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><FaCheckCircle className="text-sm" /> Complete Job</>}
          </button>
        </Sheet>
      )}
    </div>
  );
}

function Sheet({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-[2rem] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
