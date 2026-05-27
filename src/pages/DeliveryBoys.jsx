import { useEffect, useState, useRef } from 'react'
import api from '../utils/api'
import Swal from 'sweetalert2'
import { MdDeliveryDining, MdAdd, MdClose, MdPhone, MdLocationOn, MdEdit, MdCheck, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import { FaTrash, FaToggleOn, FaToggleOff, FaIdCard, FaLock, FaKey } from 'react-icons/fa'

export default function DeliveryBoys() {
  const [boys, setBoys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [aadhar, setAadhar] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  // Edit modal state
  const [editBoy, setEditBoy] = useState(null)
  const [editForm, setEditForm] = useState({ phone: '', password: '' })
  const [editShowPass, setEditShowPass] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)

  const fetchBoys = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/pump-admin/delivery-boys')
      setBoys(data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchBoys() }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAadhar(file)
    setPreview(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setForm({ name: '', phone: '', address: '', password: '' })
    setAadhar(null)
    setPreview(null)
    setShowPass(false)
    setShowForm(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!aadhar) return Swal.fire({ icon: 'warning', title: 'Aadhar photo required', background: '#fff', confirmButtonColor: '#f97316' })
    if (form.password.length < 6) return Swal.fire({ icon: 'warning', title: 'Password must be at least 6 characters', background: '#fff', confirmButtonColor: '#f97316' })
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('phone', form.phone)
      fd.append('address', form.address)
      fd.append('password', form.password)
      fd.append('aadharPhoto', aadhar)
      await api.post('/pump-admin/delivery-boys', fd)
      resetForm()
      fetchBoys()
      Swal.fire({ icon: 'success', title: 'Delivery boy added!', timer: 1500, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: err.response?.data?.message || 'Failed to add', confirmButtonColor: '#f97316' })
    } finally { setSubmitting(false) }
  }

  const openEdit = (boy) => {
    setEditBoy(boy)
    setEditForm({ phone: boy.phone, password: '' })
    setEditShowPass(false)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (editForm.password && editForm.password.length < 6)
      return Swal.fire({ icon: 'warning', title: 'Password must be at least 6 characters', confirmButtonColor: '#f97316' })
    setEditSubmitting(true)
    try {
      await api.patch(`/pump-admin/delivery-boys/${editBoy._id}/edit`, {
        phone: editForm.phone,
        ...(editForm.password && { password: editForm.password }),
      })
      setBoys(prev => prev.map(b => b._id === editBoy._id ? { ...b, phone: editForm.phone } : b))
      setEditBoy(null)
      Swal.fire({ icon: 'success', title: 'Updated successfully!', timer: 1500, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: err.response?.data?.message || 'Update failed', confirmButtonColor: '#f97316' })
    } finally { setEditSubmitting(false) }
  }

  const handleToggle = async (id) => {
    try {
      await api.patch(`/pump-admin/delivery-boys/${id}/toggle`)
      setBoys(prev => prev.map(b => b._id === id ? { ...b, isActive: !b.isActive } : b))
    } catch (err) {
      Swal.fire({ icon: 'error', title: err.response?.data?.message || 'Failed', confirmButtonColor: '#f97316' })
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Delivery Boy?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    })
    if (!result.isConfirmed) return
    try {
      await api.delete(`/pump-admin/delivery-boys/${id}`)
      setBoys(prev => prev.filter(b => b._id !== id))
    } catch (err) {
      Swal.fire({ icon: 'error', title: err.response?.data?.message || 'Failed', confirmButtonColor: '#f97316' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-black text-lg">Delivery Boys</h1>
          <p className="text-gray-400 text-xs mt-0.5">{boys.length} registered</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-bold shadow-md shadow-orange-200/60 hover:opacity-90 transition active:scale-95"
        >
          <MdAdd className="text-base" /> Add Delivery Boy
        </button>
      </div>

      {/* ── Add Form Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                  <MdDeliveryDining className="text-orange-500 text-sm" />
                </div>
                <p className="font-black text-gray-800 text-sm">Add Delivery Boy</p>
              </div>
              <button onClick={resetForm} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition">
                <MdClose className="text-gray-500 text-sm" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Enter full name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="10-digit mobile number"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Address</label>
                <div className="relative">
                  <MdLocationOn className="absolute left-3 top-3 text-gray-400 text-sm" />
                  <textarea
                    required
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Enter full address"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition resize-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Login Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
                  <input
                    required
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-10 py-2.5 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPass ? <MdVisibilityOff className="text-sm" /> : <MdVisibility className="text-sm" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Delivery boy will use this password to login in their app</p>
              </div>

              {/* Aadhar */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Aadhar Card Photo</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition"
                >
                  {preview ? (
                    <img src={preview} alt="Aadhar preview" className="h-24 w-auto rounded-lg object-cover mx-auto shadow-sm" />
                  ) : (
                    <div>
                      <FaIdCard className="text-gray-300 text-2xl mx-auto mb-1.5" />
                      <p className="text-gray-400 text-xs">Tap to upload Aadhar photo</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-bold shadow-sm hover:opacity-90 transition disabled:opacity-60 active:scale-95"
                >
                  {submitting ? 'Adding...' : 'Add Delivery Boy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────── */}
      {editBoy && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MdEdit className="text-blue-500 text-sm" />
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">Edit Delivery Boy</p>
                  <p className="text-gray-400 text-[10px]">{editBoy.name}</p>
                </div>
              </div>
              <button onClick={() => setEditBoy(null)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition">
                <MdClose className="text-gray-500 text-sm" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5">
              {/* Phone */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    required
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="10-digit mobile number"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  New Password <span className="text-gray-300 font-normal normal-case">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
                  <input
                    type={editShowPass ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Enter new password"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setEditShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {editShowPass ? <MdVisibilityOff className="text-sm" /> : <MdVisibility className="text-sm" />}
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <FaLock className="text-blue-400 text-[11px] mt-0.5 flex-shrink-0" />
                <p className="text-blue-500 text-[10px] leading-relaxed">
                  Delivery boy uses their <strong>phone number</strong> and <strong>password</strong> to login in the Delivery Boy App.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditBoy(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold shadow-sm hover:opacity-90 transition disabled:opacity-60 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {editSubmitting ? 'Saving...' : <><MdCheck className="text-sm" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── List ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : boys.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
            <MdDeliveryDining className="text-gray-300 text-3xl" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">No delivery boys added yet</p>
          <p className="text-gray-300 text-xs mt-1">Add your first delivery boy to get started</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {boys.map(b => (
            <div key={b._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm shadow-orange-200/60">
                  {b.name?.[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-gray-900 font-bold text-xs truncate">{b.name}</p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 ${b.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <MdPhone className="text-gray-400 text-[10px] flex-shrink-0" />
                    <p className="text-gray-500 text-[10px] font-medium">{b.phone}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdLocationOn className="text-gray-400 text-[10px] flex-shrink-0" />
                    <p className="text-gray-400 text-[10px] truncate">{b.address}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {b.aadharPhoto && (
                    <a
                      href={b.aadharPhoto}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center hover:bg-blue-100 transition"
                      title="View Aadhar"
                    >
                      <FaIdCard className="text-blue-500 text-xs" />
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(b)}
                    className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center hover:bg-purple-100 transition"
                    title="Edit phone / password"
                  >
                    <MdEdit className="text-purple-500 text-sm" />
                  </button>
                  <button
                    onClick={() => handleToggle(b._id)}
                    className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-orange-50 hover:border-orange-200 transition"
                    title={b.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {b.isActive
                      ? <FaToggleOn className="text-green-500 text-sm" />
                      : <FaToggleOff className="text-gray-400 text-sm" />}
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center hover:bg-red-100 transition"
                    title="Delete"
                  >
                    <FaTrash className="text-red-400 text-xs" />
                  </button>
                </div>
              </div>

              {/* Login credentials hint */}
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                <FaLock className="text-gray-300 text-[10px] flex-shrink-0" />
                <p className="text-gray-300 text-[10px]">
                  Login: <span className="text-gray-400 font-semibold">{b.phone}</span> + password set by you
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
