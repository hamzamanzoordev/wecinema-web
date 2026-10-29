"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Search, Check, X, Eye, Package,
  Clock, CheckCircle, XCircle, DollarSign, Filter, Pencil, Trash2, Save,
} from "lucide-react";
import * as adminService from "@/features/admin/api/adminService";
import type { MarketplaceListing } from "@/features/admin/types/admin.types";
import toast from "react-hot-toast";

const TYPE_OPTIONS = ["for_sale", "licensing", "adaptation_rights", "commission"] as const;
const STATUS_OPTIONS = ["draft", "active", "sold", "inactive", "pending_review"] as const;

interface EditForm {
  title: string;
  price: string;
  type: string;
  status: string;
  category: string;
  description: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "border-green-500/30 text-green-400 bg-green-500/10",
  draft: "border-gray-500/30 text-gray-400 bg-gray-500/10",
  sold: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  inactive: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  pending_review: "border-orange-500/30 text-orange-400 bg-orange-500/10",
};

const TYPE_LABELS: Record<string, string> = {
  for_sale: "For Sale",
  licensing: "Licensing",
  adaptation_rights: "Adaptation",
  commission: "Commission",
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [filtered, setFiltered] = useState<MarketplaceListing[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [mutating, setMutating] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editListing, setEditListing] = useState<MarketplaceListing | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", price: "", type: "for_sale", status: "active", category: "", description: "" });
  const [deleteListing, setDeleteListing] = useState<MarketplaceListing | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getMarketplaceListings();
      setListings(res?.listings ?? []);
      setFiltered(res?.listings ?? []);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  useEffect(() => {
    let result = listings;
    if (statusFilter !== "all") result = result.filter(l => l.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        (l.seller as { username?: string })?.username?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statusFilter, listings]);

  const handleApprove = async (id: string) => {
    setMutating(true);
    try {
      await adminService.approveMarketplaceListing(id);
      toast.success("Listing approved");
      fetchListings();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setMutating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setMutating(true);
    try {
      await adminService.rejectMarketplaceListing(rejectId, rejectReason);
      toast.success("Listing rejected");
      setRejectId(null);
      setRejectReason("");
      fetchListings();
    } catch {
      toast.error("Failed to reject");
    } finally {
      setMutating(false);
    }
  };

  const openEdit = (listing: MarketplaceListing) => {
    setEditListing(listing);
    setEditForm({
      title: listing.title ?? "",
      price: listing.price != null ? String(listing.price) : "",
      type: listing.type ?? "for_sale",
      status: listing.status ?? "active",
      category: listing.category ?? "",
      description: listing.description ?? "",
    });
  };

  const handleEditSave = async () => {
    if (!editListing) return;
    if (!editForm.title.trim()) { toast.error("Title is required"); return; }
    const priceNum = editForm.price ? Number(editForm.price) : undefined;
    if (priceNum !== undefined && (isNaN(priceNum) || priceNum <= 0)) {
      toast.error("Price must be a positive number"); return;
    }
    setMutating(true);
    try {
      await adminService.updateMarketplaceListing(editListing._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category.trim(),
        type: editForm.type,
        status: editForm.status,
        ...(priceNum !== undefined ? { price: priceNum } : {}),
      });
      toast.success("Listing updated");
      setEditListing(null);
      fetchListings();
    } catch {
      toast.error("Failed to update listing");
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteListing) return;
    setMutating(true);
    try {
      await adminService.deleteMarketplaceListing(deleteListing._id);
      toast.success("Listing deleted");
      setDeleteListing(null);
      fetchListings();
    } catch {
      toast.error("Failed to delete listing");
    } finally {
      setMutating(false);
    }
  };

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === "active").length,
    pending: listings.filter(l => l.status === "pending_review").length,
    sold: listings.filter(l => l.status === "sold").length,
  };

  const detailListing = detailId ? listings.find(l => l._id === detailId) : null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-pink-400" />
          Marketplace
        </h1>
        <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">Manage listings and approvals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Listings", value: stats.total, icon: Package, color: "text-purple-400" },
          { label: "Active", value: stats.active, icon: CheckCircle, color: "text-green-400" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-orange-400" },
          { label: "Sold", value: stats.sold, icon: DollarSign, color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-[var(--ap-surface-alt)]">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-[var(--ap-text-3)] font-mono">{label}</p>
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ap-text-3)]" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] placeholder-[var(--ap-text-3)] text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--ap-text-3)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-pink-500 font-mono"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_review">Pending</option>
            <option value="sold">Sold</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-[var(--ap-surface-alt)]" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-[var(--ap-border)]">
                  {["Title", "Seller", "Type", "Price", "Status", "Approved", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--ap-text-2)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ap-border)]">
                {filtered.map((listing) => (
                  <motion.tr key={listing._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[var(--ap-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--ap-text)] max-w-[180px] truncate">{listing.title}</p>
                      <p className="text-[10px] text-[var(--ap-text-3)] font-mono">{new Date(listing.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--ap-text-2)]">{(listing.seller as { username?: string })?.username ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-[var(--ap-text-2)]">{TYPE_LABELS[listing.type] ?? listing.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      {listing.price != null ? (
                        <span className="text-sm font-bold text-emerald-400 font-mono">${listing.price}</span>
                      ) : <span className="text-[var(--ap-text-3)] text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${STATUS_COLORS[listing.status] ?? "border-gray-500/30 text-gray-400"}`}>
                        {listing.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {listing.approved
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : listing.approved === false
                        ? <XCircle className="w-4 h-4 text-red-400" />
                        : <Clock className="w-4 h-4 text-yellow-400" />
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailId(listing._id)}
                          className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-purple-500/20 text-[var(--ap-text-2)] hover:text-purple-400 transition-all"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(listing)}
                          className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-blue-500/20 text-[var(--ap-text-2)] hover:text-blue-400 transition-all"
                          title="Edit listing"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteListing(listing)}
                          className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-red-500/20 text-[var(--ap-text-2)] hover:text-red-400 transition-all"
                          title="Delete listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {listing.status === "pending_review" && (
                          <>
                            <button
                              onClick={() => handleApprove(listing._id)}
                              disabled={mutating}
                              className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all"
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setRejectId(listing._id); setRejectReason(""); }}
                              disabled={mutating}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--ap-text-3)] font-mono">No listings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--ap-text)]">Reject Listing</h3>
                <button onClick={() => setRejectId(null)} className="text-[var(--ap-text-3)] hover:text-[var(--ap-text)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this listing is being rejected..."
                  className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-red-500 font-mono resize-none placeholder-[var(--ap-text-3)]"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRejectId(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm">Cancel</button>
                <button onClick={handleReject} disabled={mutating || !rejectReason.trim()} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {detailListing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--ap-text)]">Listing Details</h3>
                <button onClick={() => setDetailId(null)} className="text-[var(--ap-text-3)] hover:text-[var(--ap-text)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Title", value: detailListing.title },
                  { label: "Type", value: TYPE_LABELS[detailListing.type] ?? detailListing.type },
                  { label: "Status", value: detailListing.status },
                  { label: "Price", value: detailListing.price != null ? `$${detailListing.price}` : "-" },
                  { label: "Seller", value: (detailListing.seller as { username?: string })?.username ?? "-" },
                  { label: "Created", value: new Date(detailListing.createdAt).toLocaleDateString() },
                  ...(detailListing.rejectionReason ? [{ label: "Rejection Reason", value: detailListing.rejectionReason }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="text-xs font-mono text-[var(--ap-text-3)] flex-shrink-0">{label}</span>
                    <span className="text-sm text-[var(--ap-text)] text-right">{value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setDetailId(null)} className="w-full mt-5 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editListing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--ap-text)] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-400" /> Edit Listing
                </h3>
                <button onClick={() => setEditListing(null)} className="text-[var(--ap-text-3)] hover:text-[var(--ap-text)]"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Title</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-blue-500 placeholder-[var(--ap-text-3)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Price (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-blue-500 placeholder-[var(--ap-text-3)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Category</label>
                    <input
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-blue-500 placeholder-[var(--ap-text-3)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Type</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-blue-500"
                    >
                      {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-blue-500"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Description</label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-blue-500 resize-none placeholder-[var(--ap-text-3)]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditListing(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">Cancel</button>
                <button onClick={handleEditSave} disabled={mutating} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteListing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ap-text)]">Delete Listing</h3>
                  <p className="text-xs text-[var(--ap-text-3)]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-[var(--ap-text-2)] mb-6">
                Permanently delete <span className="font-semibold text-[var(--ap-text)]">{deleteListing.title}</span> and its media files?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteListing(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">Cancel</button>
                <button onClick={handleDelete} disabled={mutating} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
