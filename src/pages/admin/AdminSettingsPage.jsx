import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, API_BASE } from '../../services/api';
import { 
  Settings, ShieldCheck, Database, Server, Mail, Phone, 
  MapPin, Globe, CheckCircle, RefreshCw, AlertCircle
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getDashboard();
        setStats(res?.stats ? res : (res?.data || res));
      } catch (err) {
        console.error('Failed to fetch status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-serif text-[#1E261B] tracking-wide">System & Store Settings</h1>
        <p className="text-xs text-[#1E261B]/60 mt-1">
          Store operational metadata, administrative profile details, and database connectivity.
        </p>
      </div>

      {/* Database Connection Info Card */}
      <div className="bg-white border border-[#1E261B]/10 rounded-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E261B]/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-serif text-[#1E261B] font-semibold">MongoDB Atlas Connection</h2>
              <p className="text-[11px] text-[#1E261B]/60">Live production database status</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/70 text-emerald-800 text-[11px] font-medium rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#1E261B]/50 block mb-0.5">Database Cluster Target:</span>
            <span className="font-mono text-[#1E261B] font-medium bg-[#FAF7F2] px-2 py-1 rounded inline-block">
              pottery_rugs
            </span>
          </div>
          <div>
            <span className="text-[#1E261B]/50 block mb-0.5">API Server Host:</span>
            <span className="font-mono text-[#1E261B] font-medium bg-[#FAF7F2] px-2 py-1 rounded inline-block break-all">
              {API_BASE}
            </span>
          </div>
          <div>
            <span className="text-[#1E261B]/50 block mb-0.5">Catalog Collection Count:</span>
            <span className="text-[#1E261B] font-medium">
              {loading
                ? 'Loading...'
                : `${stats?.stats?.totalProducts || stats?.totalProducts || 0} active products in catalog`}
            </span>
          </div>
          <div>
            <span className="text-[#1E261B]/50 block mb-0.5">Active Admin Account:</span>
            <span className="text-[#1E261B] font-medium font-mono">
              {user?.email || 'Potteryrugs@gmail.com'}
            </span>
          </div>
        </div>
      </div>

      {/* Brand & Storefront Metadata */}
      <div className="bg-white border border-[#1E261B]/10 rounded-sm p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#1E261B]/10">
          <div className="p-2 bg-[#45563D]/10 text-[#45563D] rounded-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-serif text-[#1E261B] font-semibold">Storefront Profile & Heritage</h2>
            <p className="text-[11px] text-[#1E261B]/60">General public brand information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[#1E261B]/60 block mb-1">Brand Name</label>
            <input
              type="text"
              readOnly
              value="House of Loom & Craft"
              className="w-full px-3 py-2 border border-[#1E261B]/15 rounded bg-[#FAF7F2] text-[#1E261B] font-medium"
            />
          </div>
          <div>
            <label className="text-[#1E261B]/60 block mb-1">Manufacturing Center</label>
            <input
              type="text"
              readOnly
              value="Bhadohi, Uttar Pradesh, India (Carpet Capital)"
              className="w-full px-3 py-2 border border-[#1E261B]/15 rounded bg-[#FAF7F2] text-[#1E261B]"
            />
          </div>
          <div>
            <label className="text-[#1E261B]/60 block mb-1">Official Support Email</label>
            <input
              type="text"
              readOnly
              value="Potteryrugs@gmail.com"
              className="w-full px-3 py-2 border border-[#1E261B]/15 rounded bg-[#FAF7F2] text-[#1E261B]"
            />
          </div>
          <div>
            <label className="text-[#1E261B]/60 block mb-1">Support Phone / WhatsApp</label>
            <input
              type="text"
              readOnly
              value="+91 7460007382 (Alternate: +91 9839116625)"
              className="w-full px-3 py-2 border border-[#1E261B]/15 rounded bg-[#FAF7F2] text-[#1E261B]"
            />
          </div>
        </div>
      </div>

      {/* Security & Access Policies */}
      <div className="bg-white border border-[#1E261B]/10 rounded-sm p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#1E261B]/10">
          <div className="p-2 bg-[#BA9977]/15 text-[#8C6D4F] rounded-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-serif text-[#1E261B] font-semibold">Security Safeguards</h2>
            <p className="text-[11px] text-[#1E261B]/60">Operational safeguards active on your backend</p>
          </div>
        </div>

        <ul className="space-y-2 text-xs text-[#1E261B]/80">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Role-based Authorization:</strong> All administrative endpoints under <code>/api/admin/*</code> enforce cryptographic JWT verification + <code>user.role === 'admin'</code> check.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Anti-Lockout Protection:</strong> System safeguards prevent deleting the sole remaining administrator or deleting your own active session.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Historical Data Integrity:</strong> Products referenced by past customer orders cannot be hard-deleted; the admin API automatically switches to unpublishing them safely to preserve purchase records.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Inventory Restoration:</strong> When an order is marked as "Cancelled" via the Admin status workflow, reserved quantities are restored to the active inventory automatically.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
