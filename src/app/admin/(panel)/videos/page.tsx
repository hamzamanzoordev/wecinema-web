"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Pencil, Trash2, Play, X, Check, AlertCircle, Search } from "lucide-react";
import * as adminService from "@/features/admin/api/adminService";
import toast from "react-hot-toast";

interface Video {
  _id: string;
  title: string;
  description?: string;
  genre?: string;
  url?: string;
  duration?: number;
  createdAt: string;
  author?: { _id: string; username: string; avatar?: string };
  transcodingStatus?: string;
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    completed: "border-green-500/30 text-green-400 bg-green-500/10",
    processing: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
    pending: "border-gray-500/30 text-gray-400 bg-gray-500/10",
    failed: "border-red-500/30 text-red-400 bg-red-500/10",
  };
  const s = status ?? "completed";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${map[s] ?? map.completed}`}>
      {s.toUpperCase()}
    </span>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filtered, setFiltered] = useState<Video[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editVideo, setEditVideo] = useState<Video | null>(null);
  const [mutating, setMutating] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllVideos();
      const list = (res?.videos ?? []) as Video[];
      setVideos(list);
      setFiltered(list);
    } catch {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      videos.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.author?.username?.toLowerCase().includes(q) ||
        v.genre?.toLowerCase().includes(q)
      )
    );
  }, [search, videos]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setMutating(true);
    try {
      await adminService.deleteVideo(deleteId);
      toast.success("Video deleted");
      setDeleteId(null);
      fetchVideos();
    } catch {
      toast.error("Delete failed");
    } finally {
      setMutating(false);
    }
  };

  const handleEdit = async () => {
    if (!editVideo) return;
    setMutating(true);
    try {
      await adminService.editVideo(editVideo._id, {
        title: editVideo.title,
        description: editVideo.description,
        genre: editVideo.genre,
      });
      toast.success("Video updated");
      setEditVideo(null);
      fetchVideos();
    } catch {
      toast.error("Update failed");
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-400" />
            Videos
          </h1>
          <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">{videos.length} total videos</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ap-text-3)]" />
        <input
          type="text"
          placeholder="Search by title, author, or genre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] placeholder-[var(--ap-text-3)] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
      </div>

      <div className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-[var(--ap-surface-alt)]" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-[var(--ap-border)]">
                  {["Title", "Author", "Genre", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--ap-text-2)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ap-border)]">
                {filtered.map((video) => (
                  <motion.tr
                    key={video._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[var(--ap-hover)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--ap-text)] max-w-[200px] truncate">{video.title}</p>
                      {video.duration != null && (
                        <p className="text-[10px] text-[var(--ap-text-3)] font-mono">{video.duration}min</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {video.author?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-[var(--ap-text-2)]">{video.author?.username ?? "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ap-text-2)] font-mono">{video.genre ?? "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={video.transcodingStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--ap-text-3)] font-mono">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {video.url && (
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-green-500/20 text-[var(--ap-text-2)] hover:text-green-400 transition-all"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setEditVideo(video)}
                          className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-blue-500/20 text-[var(--ap-text-2)] hover:text-blue-400 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(video._id)}
                          className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-red-500/20 text-[var(--ap-text-2)] hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--ap-text-3)] font-mono">
                      No videos found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ap-text)]">Delete Video</h3>
                  <p className="text-xs text-[var(--ap-text-3)]">This will delete the video permanently</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={mutating}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editVideo && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--ap-text)] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-400" />
                  Edit Video
                </h3>
                <button onClick={() => setEditVideo(null)} className="text-[var(--ap-text-3)] hover:text-[var(--ap-text)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Title", key: "title", type: "text" },
                  { label: "Genre", key: "genre", type: "text" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={editVideo[key as keyof Video] as string ?? ""}
                      onChange={(e) => setEditVideo({ ...editVideo, [key]: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={editVideo.description ?? ""}
                    onChange={(e) => setEditVideo({ ...editVideo, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-blue-500 font-mono resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5 pt-4 border-t border-[var(--ap-border)]">
                <button onClick={() => setEditVideo(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={mutating}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
