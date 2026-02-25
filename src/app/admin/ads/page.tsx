"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/adminAuth";

const POSITIONS = [
  { value: "hero", label: "Hero (Homepage)" },
  { value: "home-between-sections", label: "Between sections (Homepage)" },
  { value: "post-content", label: "Inside post content" },
  { value: "above-iframe", label: "Above stream iframe" },
  { value: "below-iframe", label: "Below stream iframe" },
  { value: "sidebar", label: "Sidebar (Desktop)" },
];

interface Ad {
  id: string;
  position: string;
  code: string;
  name?: string;
  active: boolean;
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPosition, setFormPosition] = useState("hero");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formActive, setFormActive] = useState(true);
  const router = useRouter();

  const fetchAds = () => {
    fetch("/api/ads", { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAds(data);
        else setAds([]);
      })
      .catch(() => setAds([]));
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    fetchAds();
    setLoading(false);
  }, [router]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormPosition("hero");
    setFormCode("");
    setFormName("");
    setFormActive(true);
  };

  const handleEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setFormPosition(ad.position);
    setFormCode(ad.code);
    setFormName(ad.name || "");
    setFormActive(ad.active);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const res = await fetch(`/api/ads/${editingId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          position: formPosition,
          code: formCode,
          name: formName,
          active: formActive,
        }),
      });
      if (res.ok) {
        fetchAds();
        resetForm();
      }
    } else {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          position: formPosition,
          code: formCode,
          name: formName,
          active: formActive,
        }),
      });
      if (res.ok) {
        fetchAds();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    const res = await fetch(`/api/ads/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) fetchAds();
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Ads</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-red-600"
        >
          Add Ad
        </button>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Add Google AdSense or custom HTML. One ad per position (new ad replaces existing for that position).
      </p>

      {(showForm || editingId) && (
        <form onSubmit={handleSubmit} className="glass-card p-6 mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {editingId ? "Edit Ad" : "New Ad"}
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
            <select
              value={formPosition}
              onChange={(e) => setFormPosition(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name (optional)</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Hero Banner"
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ad Code (HTML / AdSense script)</label>
            <textarea
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              rows={6}
              placeholder="<script>...</script> or <ins>...</ins>"
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-white font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              className="rounded border-dark-border"
            />
            <label htmlFor="active" className="text-sm text-gray-300">
              Active
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-red-600"
            >
              {editingId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 rounded-lg border border-dark-border text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="glass-card p-4 flex items-center justify-between flex-wrap gap-2"
          >
            <div>
              <p className="font-medium text-white">{ad.name || ad.position}</p>
              <p className="text-xs text-gray-500">{ad.position}</p>
              <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                {ad.code?.slice(0, 80)}...
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded ${ad.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}
              >
                {ad.active ? "Active" : "Inactive"}
              </span>
              <button
                type="button"
                onClick={() => handleEdit(ad)}
                className="text-sm text-primary hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(ad.id)}
                className="text-sm text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {ads.length === 0 && !showForm && (
        <p className="text-gray-400 py-8">No ads. Click &quot;Add Ad&quot; to add one.</p>
      )}
    </div>
  );
}
