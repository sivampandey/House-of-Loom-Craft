import React, { useState, useEffect } from 'react';
import { supportAPI } from '../../services/api';
import {
  MessageSquareQuote,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Send,
  MessageCircle,
  Mail,
  User,
  Package,
  Calendar,
  X,
  Phone,
  PhoneCall,
  Image,
  Layers
} from 'lucide-react';

const TICKET_STATUSES = ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'];
const PRIORITIES = ['Urgent', 'High', 'Normal', 'Low'];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [adminReply, setAdminReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await supportAPI.getTicketsAdmin({
        search,
        status,
        priority,
        page,
        limit: 15
      });
      if (res?.success) {
        setTickets(res.tickets || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [status, priority, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const openTicketDetail = async (ticketId) => {
    setModalLoading(true);
    try {
      const res = await supportAPI.getTicketByIdAdmin(ticketId);
      if (res?.success) {
        setSelectedTicket(res.ticket);
      }
    } catch (err) {
      alert('Failed to load ticket details: ' + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await supportAPI.updateTicketStatusAdmin(selectedTicket.ticketId, newStatus);
      if (res?.success) {
        setSelectedTicket(res.ticket || { ...selectedTicket, status: newStatus });
        setTickets(prev => prev.map(t => t.ticketId === selectedTicket.ticketId ? { ...t, status: newStatus, updatedAt: new Date() } : t));
      }
    } catch (err) {
      alert('Failed to update ticket status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!adminReply.trim() || submittingReply || !selectedTicket) return;
    setSubmittingReply(true);
    try {
      const res = await supportAPI.replyTicketAdmin(selectedTicket.ticketId, adminReply.trim());
      if (res?.success) {
        setSelectedTicket(res.ticket);
        setTickets(prev => prev.map(t => t.ticketId === selectedTicket.ticketId ? { ...t, updatedAt: new Date() } : t));
        setAdminReply('');
      }
    } catch (err) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || submittingNote || !selectedTicket) return;
    setSubmittingNote(true);
    try {
      const res = await supportAPI.addInternalNoteAdmin(selectedTicket.ticketId, newNote.trim());
      if (res?.success) {
        setSelectedTicket(prev => ({ ...prev, internalNotes: res.internalNotes }));
        setNewNote('');
      }
    } catch (err) {
      alert('Failed to add note: ' + err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Normal':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Open':
        return 'bg-rose-100 text-rose-800';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800';
      case 'Waiting for Customer':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800';
      case 'Closed':
        return 'bg-stone-100 text-stone-600';
      default:
        return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDD5C7] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#241C16] font-medium flex items-center gap-3">
            <MessageSquareQuote className="w-7 h-7 text-[#34402D]" />
            Client Support & Complaints
          </h1>
          <p className="text-xs sm:text-sm text-[#6C5E53] mt-1 font-sans">
            Review live inquiries, complaints, damage reports, and AI Concierge escalations.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#DDD5C7] rounded-lg text-xs font-sans font-medium text-[#241C16] hover:bg-[#F5F0E6] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-xl border border-[#DDD5C7] p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D70]" />
            <input
              type="text"
              placeholder="Search by ticket ID, customer, order #, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-sans bg-[#FAF7F2] border border-[#DDD5C7] rounded-lg focus:outline-none focus:border-[#34402D]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs font-sans bg-[#FAF7F2] border border-[#DDD5C7] rounded-lg focus:outline-none focus:border-[#34402D]"
            >
              <option value="all">All Statuses</option>
              {TICKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs font-sans bg-[#FAF7F2] border border-[#DDD5C7] rounded-lg focus:outline-none focus:border-[#34402D]"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[#34402D] hover:bg-[#283222] text-[#FAF7F0] text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-[#DDD5C7] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-7 h-7 border-2 border-[#34402D]/20 border-t-[#34402D] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[#8C7D70] font-sans mt-3">Loading support tickets...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs font-sans">
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-[#8C7D70] text-xs font-sans">
            <MessageSquareQuote className="w-10 h-10 text-[#DDD5C7] mx-auto mb-2" />
            No support tickets match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#F7F4EE] border-b border-[#DDD5C7] text-[#6C5E53] font-medium uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Customer Contact</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Alerts</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DC]">
                {tickets.map((t) => {
                  const phone = t.customer?.phone || t.customerPhone;
                  const whatsapp = t.customer?.whatsapp || phone;
                  return (
                    <tr key={t.ticketId} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#34402D]">
                        {t.ticketId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#241C16]">{t.customer?.name || t.customerName}</div>
                        <div className="text-[11px] text-[#8C7D70]">{t.customer?.email || t.customerEmail}</div>
                        {phone && (
                          <div className="text-[10px] text-[#55694A] font-medium mt-0.5 flex items-center gap-1">
                            <span>Phone: {phone}</span>
                            {whatsapp && <span>&bull; WA: {whatsapp}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block font-medium text-[#44382E] bg-[#F5F0E6] px-2 py-0.5 rounded">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold border ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#6C5E53]">
                        {t.orderNumber ? `#${t.orderNumber}` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-medium ${getStatusBadge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            title={`WhatsApp: ${t.notifications?.whatsapp?.status || 'pending'}`}
                            className={`w-2 h-2 rounded-full ${t.notifications?.whatsapp?.status === 'sent' ? 'bg-emerald-500' : 'bg-stone-300'}`}
                          />
                          <span
                            title={`Email: ${t.notifications?.email?.status || 'pending'}`}
                            className={`w-2 h-2 rounded-full ${t.notifications?.email?.status === 'sent' ? 'bg-emerald-500' : 'bg-stone-300'}`}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#8C7D70]">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 text-[#8C7D70]">
                        {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openTicketDetail(t.ticketId)}
                          className="px-2.5 py-1.5 bg-[#34402D]/10 hover:bg-[#34402D] text-[#34402D] hover:text-white rounded-md text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#DDD5C7] bg-[#FAF8F5] text-xs font-sans">
            <span className="text-[#8C7D70]">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-[#DDD5C7] rounded text-[#241C16] disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-[#DDD5C7] rounded text-[#241C16] disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Ticket Inspector Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#DDD5C7] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#34402D] text-[#FAF7F0] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-medium tracking-wide">Ticket {selectedTicket.ticketId}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getPriorityBadge(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <p className="text-xs text-[#FAF7F0]/70 font-sans mt-0.5">
                  {selectedTicket.category} &bull; Created {new Date(selectedTicket.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#FAF7F0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs font-sans text-[#241C16]">
              {/* Customer Card & Quick Contact (Sections 7 & 8) */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D6] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-[#241C16] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#34402D]" />
                      {selectedTicket.customer?.name || selectedTicket.customerName}
                      {selectedTicket.userId && (
                        <span className="text-[10px] text-[#6C5E53] font-mono font-normal bg-[#EFE8DC] px-1.5 py-0.5 rounded">
                          ID: {selectedTicket.userId._id || selectedTicket.userId}
                        </span>
                      )}
                    </div>
                    <div className="text-[#6C5E53] mt-0.5">{selectedTicket.customer?.email || selectedTicket.customerEmail}</div>
                    <div className="text-[#8C7D70] mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Phone: {selectedTicket.customer?.phone || selectedTicket.customerPhone || 'Not provided'}</span>
                      {(selectedTicket.customer?.whatsapp || selectedTicket.customerPhone) && (
                        <span>&bull; WhatsApp: {selectedTicket.customer?.whatsapp || selectedTicket.customerPhone}</span>
                      )}
                    </div>
                  </div>

                  {/* ADMIN CONTACT ACTIONS (Section 8) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(selectedTicket.customer?.whatsapp || selectedTicket.customerPhone) && (
                      <a
                        href={`https://wa.me/${(selectedTicket.customer?.whatsapp || selectedTicket.customerPhone).replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open WhatsApp chat with client"
                        className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-[#1EBE5D] transition-colors cursor-pointer text-xs shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp Customer
                      </a>
                    )}
                    {(selectedTicket.customer?.phone || selectedTicket.customerPhone) && (
                      <a
                        href={`tel:${(selectedTicket.customer?.phone || selectedTicket.customerPhone).replace(/[^\d+]/g, '')}`}
                        title="Place phone call to client"
                        className="px-3 py-1.5 bg-[#55694A] text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-[#45553C] transition-colors cursor-pointer text-xs shadow-2xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Call Customer
                      </a>
                    )}
                    <a
                      href={`mailto:${selectedTicket.customer?.email || selectedTicket.customerEmail}?subject=House of Loom %26 Craft: Regarding Support Ticket ${selectedTicket.ticketId}`}
                      title="Send email to client"
                      className="px-3 py-1.5 bg-[#34402D] text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-[#283222] transition-colors cursor-pointer text-xs shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email Customer
                    </a>
                  </div>
                </div>

                {/* LINKED ORDER INFORMATION (Section 7) */}
                {selectedTicket.orderId ? (
                  <div className="pt-3 border-t border-[#E8E2D6] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-lg border border-[#E2DDD5]">
                    <div>
                      <span className="font-bold text-[#34402D] block">
                        Linked Order: #{selectedTicket.orderId.orderNumber || selectedTicket.orderNumber}
                      </span>
                      <span className="text-[#6C5E53]">
                        Order Status: <strong className="uppercase">{selectedTicket.orderId.orderStatus || 'N/A'}</strong> &bull; Total: ₹{selectedTicket.orderId.total?.toLocaleString('en-IN')}
                      </span>
                      {selectedTicket.orderId.createdAt && (
                        <div className="text-[11px] text-[#8C7D70]">
                          Placed: {new Date(selectedTicket.orderId.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                    <div>
                      {selectedTicket.orderId.carrier && (
                        <div className="text-[#4E3C2B]">
                          Carrier: <strong>{selectedTicket.orderId.carrier}</strong>
                          {selectedTicket.orderId.trackingNumber && (
                            <span className="block text-[11px] font-mono">Tracking: {selectedTicket.orderId.trackingNumber}</span>
                          )}
                        </div>
                      )}
                      {selectedTicket.orderId.items && selectedTicket.orderId.items.length > 0 && (
                        <div className="text-[11px] text-[#6C5E53] truncate mt-1">
                          Items: {selectedTicket.orderId.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedTicket.orderNumber ? (
                  <div className="pt-2 border-t border-[#E8E2D6] text-xs text-[#34402D] font-medium">
                    Referenced Order: #{selectedTicket.orderNumber}
                  </div>
                ) : null}
              </div>

              {/* Status Update Control (Section 9) */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#DDD5C7]">
                <div>
                  <span className="font-bold text-[#44382E] block">Ticket Status Update</span>
                  <span className="text-[11px] text-[#8C7D70]">
                    Updates MongoDB, timeline, and customer's live profile view.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="px-3.5 py-2 bg-[#FAF7F2] border border-[#DDD5C7] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#34402D] cursor-pointer"
                  >
                    {TICKET_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {updatingStatus && <RefreshCw className="w-4 h-4 animate-spin text-[#34402D]" />}
                </div>
              </div>

              {/* Customer Complaint */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6C5E53] mb-1.5">Original Complaint Subject & Description</h4>
                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border-l-4 border-[#34402D] space-y-1.5">
                  <div className="font-bold text-[#241C16] text-sm">{selectedTicket.subject}</div>
                  <div className="text-[12.5px] leading-relaxed italic text-[#3E342B]">
                    "{selectedTicket.customerMessage}"
                  </div>

                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10.5px] font-bold uppercase text-[#6C5E53] block mb-1">
                        Client Photographs & Attachments:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedTicket.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DDD5C7] rounded-lg text-xs hover:border-[#34402D] transition-colors font-medium text-[#241C16]"
                          >
                            <Image className="w-3.5 h-3.5 text-[#34402D]" />
                            {att.name || `Photo #${i + 1}`}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Diagnostic Summary */}
              {selectedTicket.aiSummary && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6C5E53] mb-1.5">AI Concierge Diagnostic</h4>
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-950 space-y-1">
                    <p>{selectedTicket.aiSummary}</p>
                    {selectedTicket.aiSuggestedResolution && (
                      <p className="font-semibold text-blue-900 pt-1">
                        Suggested Action: {selectedTicket.aiSuggestedResolution}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Conversation Context */}
              {selectedTicket.conversationContext && selectedTicket.conversationContext.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6C5E53] mb-1.5">Relevant Chat Context</h4>
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DDD5C7] max-h-40 overflow-y-auto space-y-2">
                    {selectedTicket.conversationContext.map((c, i) => (
                      <div key={i} className="text-[11.5px]">
                        <span className="font-bold text-[#34402D]">{c.role === 'user' ? 'Client' : 'Concierge'}:</span>{' '}
                        <span className="text-[#3E342B]">{c.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIMELINE OF STATUS CHANGES (Section 7 & 9) */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6C5E53] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#34402D]" />
                  Ticket Activity Timeline
                </h4>
                <div className="space-y-2 bg-[#FAF8F5] p-3 rounded-xl border border-[#DDD5C7] max-h-48 overflow-y-auto">
                  {selectedTicket.timeline && selectedTicket.timeline.length > 0 ? (
                    selectedTicket.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-[11.5px] border-b border-[#EFE8DC] last:border-0 pb-1.5 last:pb-0">
                        <span className="text-[10px] text-[#8C7D70] whitespace-nowrap pt-0.5">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                          {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex-1">
                          <span className="font-semibold text-[#241C16]">{item.message}</span>
                          {item.status && (
                            <span className="text-[10px] ml-2 px-2 py-0.2 rounded font-medium bg-[#EFE8DC] text-[#44382E]">
                              [{item.status}]
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-[#8C7D70] italic">No timeline entries yet.</p>
                  )}
                </div>
              </div>

              {/* MESSAGES & CUSTOMER REPLIES THREAD */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6C5E53] mb-2 flex items-center gap-1.5">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-[#34402D]" />
                    Messages & Client Follow-ups
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedTicket.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          m.sender === 'admin'
                            ? 'bg-[#EFE8D8] border-[#DACDB3] ml-4'
                            : 'bg-white border-[#DDD5C7] mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#8C7D70] mb-1">
                          <span className="font-bold text-[#34402D]">
                            {m.sender === 'admin' ? 'Support Desk Reply' : `${selectedTicket.customer?.name || selectedTicket.customerName} (Client)`}
                          </span>
                          <span>{new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <p className="text-[12px] leading-relaxed text-[#241C16] whitespace-pre-wrap">{m.message}</p>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap gap-2">
                            {m.attachments.map((att, ai) => (
                              <a
                                key={ai}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10.5px] text-[#34402D] underline"
                              >
                                <Image className="w-3 h-3" />
                                {att.name || 'Photo'}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION A: CUSTOMER-VISIBLE SUPPORT RESPONSE (Section 10) */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-700" />
                    Customer-Visible Support Response
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Client Can See This
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/80">
                  This message will appear directly on the customer's profile complaint page and ticket timeline.
                </p>

                <form onSubmit={handleSendReply} className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Write a response to the customer regarding their complaint..."
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 text-[#241C16]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReply || !adminReply.trim()}
                      className="px-4 py-2 bg-[#34402D] hover:bg-[#283222] text-[#FAF7F0] rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Send className="w-3 h-3" />
                      {submittingReply ? 'Sending...' : 'Send Response to Customer'}
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION B: INTERNAL STAFF NOTES (Section 10) */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-950">
                    Internal Staff Notes (Staff Only)
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    Hidden from Customer
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  Internal notes are never exposed to the client in the profile or API.
                </p>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 ? (
                    selectedTicket.internalNotes.map((note, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-amber-200 rounded-lg text-[11.5px]">
                        <div className="flex items-center justify-between text-[10px] text-amber-900/70 mb-1">
                          <span className="font-semibold text-amber-950">{note.author}</span>
                          <span>{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-amber-950">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-amber-900/60 italic">No internal notes added yet.</p>
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add an internal note or update for atelier staff..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:border-amber-600 text-[#241C16]"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !newNote.trim()}
                    className="px-3.5 py-2 bg-[#34402D] hover:bg-[#283222] text-[#FAF7F0] rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1 shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
