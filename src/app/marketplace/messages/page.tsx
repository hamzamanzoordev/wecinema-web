"use client";
// src/pages/marketplace/shared/Messages.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FiMessageSquare, FiSearch, FiRefreshCw, FiX,
  FiShoppingBag, FiAlertCircle, FiArchive, FiPlus,
} from 'react-icons/fi';
import Link from 'next/link';

import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import FirebaseChatInterface from '@/components/chat/FirebaseChatInterface';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useMyChats, useChatActions } from '@/features/marketplace/api/chat.service';
import { toast } from '@/lib/toast';
import { DealOfferChatCard } from '@/features/deals/components/DealOfferChatCard';
import { DealStatusBadge } from '@/features/deals/components/DealStatusBadge';
import { formatCents, parseDealMeta } from '@/features/deals/lib/dealFormat';
import type { Message as FirebaseMessage } from '@/hooks/useFirebaseChat';
import type { Chat, ChatUser } from '@/types/chat.types';

const ACCENT_OUTLINE = {
  borderColor: 'var(--color-accent-primary)',
  color: 'var(--color-accent-primary)',
} as const;

/** Deal statuses that still have an active negotiation or order behind them. */
const LIVE_DEAL_STATUSES = new Set(['pending', 'negotiating', 'accepted', 'paid']);

// ─── Helpers ─────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500',
];

function avatarColor(userId: string): string {
  if (!userId) return AVATAR_COLORS[0] ?? 'bg-violet-500';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-violet-500';
}

function initial(username: string): string {
  return username?.trim().charAt(0).toUpperCase() || 'U';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const ORDER_STATUS_CLASSES: Record<string, string> = {
  completed:   'text-emerald-400 bg-emerald-400/10',
  in_progress: 'text-sky-400     bg-sky-400/10',
  paid:        'text-violet-400  bg-violet-400/10',
  delivered:   'text-green-400   bg-green-400/10',
  cancelled:   'text-red-400     bg-red-400/10',
};

// ─── Avatar ──────────────────────────────────────────────────

const UserAvatar: React.FC<{ user: ChatUser; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  const color = avatarColor(user._id);

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        className={`${dim} rounded-full object-cover ring-2 ring-border flex-shrink-0`}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initial(user.username)}
    </div>
  );
};

// ─── Chat list item ───────────────────────────────────────────

const ChatItem: React.FC<{
  chat: Chat;
  selected: boolean;
  onSelect: () => void;
  onArchive: () => void;
}> = ({ chat, selected, onSelect, onArchive }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`relative px-4 py-3 cursor-pointer transition-all theme-transition group ${
        selected
          ? 'bg-accent/10 border-l-2 border-accent'
          : 'border-l-2 border-transparent hover:bg-btn-secondary-bg'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <UserAvatar user={chat.otherUser} size="md" />
          {(chat.unreadCount ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-btn-primary-text text-[10px] font-bold rounded-full flex items-center justify-center">
              {chat.unreadCount! > 9 ? '9+' : chat.unreadCount}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className={`text-sm font-semibold truncate ${selected ? 'text-accent' : 'text-text-primary'} theme-transition`}>
              {chat.otherUser.username}
            </span>
            <span className="text-[10px] text-text-tertiary flex-shrink-0">
              {formatTime(chat.updatedAt)}
            </span>
          </div>

          <p className="text-xs text-text-secondary truncate mb-1">{chat.listing.title}</p>

          {chat.lastMessage && (
            <p className="text-xs text-text-tertiary truncate">{chat.lastMessage}</p>
          )}

          {chat.deal ? (
            <DealStatusBadge status={chat.deal.status} className="mt-1.5 !px-1.5 !py-0.5 !text-[10px]" />
          ) : chat.order && (
            <span className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              ORDER_STATUS_CLASSES[chat.order.status] ?? 'text-gray-400 bg-gray-400/10'
            }`}>
              {chat.order.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Archive button */}
        {hover && (
          <button
            onClick={e => { e.stopPropagation(); onArchive(); }}
            title="Archive"
            className="flex-shrink-0 p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-border transition-colors"
          >
            <FiArchive size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────

const Messages: React.FC = () => {
  const router                     = useRouter();
  const searchParams = useSearchParams();
  const setSearchParams = (params: Record<string, string>, opts?: { replace?: boolean }) => {
    const qs = new URLSearchParams(params).toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    if (opts?.replace) router.replace(url);
    else router.push(url);
  };
  const { authUser, isAuthenticated } = useAuth();

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  // Derive ChatUser from AuthUser for FirebaseChatInterface
  const currentUser: ChatUser | null = authUser
    ? { _id: authUser._id, username: authUser.username, email: authUser.email, avatar: authUser.avatar }
    : null;

  // Data hooks
  const { chats, loading, error, totalUnread, refetch, removeLocal } = useMyChats();
  const { archive, markReadByFirebaseId } = useChatActions(removeLocal);

  // Local state
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery,  setSearchQuery]  = useState('');

  const hasProcessedUrl = useRef(false);
  const dealRetried     = useRef(false);
  const lastChatId      = useRef<string | null>(null);

  // Update document title with unread count
  useEffect(() => {
    document.title = totalUnread > 0
      ? `(${totalUnread}) Messages | Marketplace`
      : 'Messages | Marketplace';
    return () => { document.title = 'Wecinema'; };
  }, [totalUnread]);

  // Auto-select chat from URL params (once, after chats load)
  useEffect(() => {
    const urlChatId = searchParams.get('chat');
    const orderId   = searchParams.get('order');
    const dealId    = searchParams.get('deal');

    if (hasProcessedUrl.current || loading) return;
    if (!chats.length && !dealId) return;

    if (!urlChatId && !orderId && !dealId) { hasProcessedUrl.current = true; return; }
    if (urlChatId && urlChatId === lastChatId.current) { hasProcessedUrl.current = true; return; }

    const found = urlChatId
      ? chats.find(c => c.firebaseChatId === urlChatId) ?? null
      : orderId
        ? chats.find(c => c.order?._id === orderId) ?? null
        : chats.find(c => c.deal?._id === dealId || c.dealId === dealId || c.firebaseChatId === `deal_${dealId}`) ?? null;

    // A deal's conversation is created server-side alongside the deal. Arriving
    // straight from the Deal Room, the list can predate it — reload once.
    if (!found && dealId && !dealRetried.current) {
      dealRetried.current = true;
      refetch();
      return;
    }

    hasProcessedUrl.current = true;
    lastChatId.current = urlChatId ?? found?.firebaseChatId ?? null;

    if (found) {
      setSelectedChat(found);
      if (urlChatId || dealId) setSearchParams({ chat: found.firebaseChatId }, { replace: true });
    } else if (dealId) {
      toast.error('This deal conversation is not available yet. Please try again shortly.');
    }
  }, [chats, loading, searchParams, setSearchParams, refetch]);

  // Reset on unmount
  useEffect(() => () => {
    hasProcessedUrl.current = false;
    lastChatId.current = null;
  }, []);

  const handleSelect = useCallback((chat: Chat) => {
    if (selectedChat?.firebaseChatId === chat.firebaseChatId) return;
    setSelectedChat(chat);
    setSearchParams({ chat: chat.firebaseChatId }, { replace: true });
    lastChatId.current = chat.firebaseChatId;
    // Mark read
    if ((chat.unreadCount ?? 0) > 0) {
      markReadByFirebaseId(chat.firebaseChatId);
    }
  }, [selectedChat, setSearchParams, markReadByFirebaseId]);

  const handleArchive = useCallback((chat: Chat) => {
    archive(chat._id);
    if (selectedChat?._id === chat._id) setSelectedChat(null);
  }, [archive, selectedChat]);

  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      chat.otherUser.username.toLowerCase().includes(q) ||
      chat.listing.title.toLowerCase().includes(q) ||
      (chat.lastMessage?.toLowerCase() ?? '').includes(q)
    );
  });

  // "Start Deal" goes to the open deal for this conversation if there is one,
  // otherwise to a new offer on the conversation's listing (buyers only).
  const selectedDeal = selectedChat?.deal ?? null;
  const hasLiveDeal  = !!selectedDeal && LIVE_DEAL_STATUSES.has(selectedDeal.status);
  const startDealHref = hasLiveDeal
    ? `/marketplace/deal/${selectedDeal!._id}`
    : selectedChat?.listing?._id && selectedDeal?.viewerRole !== 'seller'
      ? `/marketplace/deals/new?listing=${selectedChat.listing._id}`
      : '/marketplace/browse';

  const renderDealMessage = useCallback((msg: FirebaseMessage) => {
    if (msg.messageType !== 'deal') return null;
    const meta = parseDealMeta(msg.metadata);
    if (!meta) return null;
    return (
      <DealOfferChatCard
        meta={meta}
        deal={selectedChat?.deal?._id === meta.dealId ? selectedChat.deal : null}
        currentUserId={authUser?._id}
        timestamp={msg.timestamp}
      />
    );
  }, [selectedChat, authUser?._id]);

  // ── Loading ────────────────────────────────────────────────
  if (loading && !chats.length) {
    return (
      <MarketplaceLayout>
        <div className="bg-bg-secondary theme-transition flex items-center justify-center p-4">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 animate-pulse bg-accent opacity-20 rounded-full blur-xl" />
              <div className="relative animate-spin rounded-full h-24 w-24 border-4 border-transparent border-t-accent border-r-accent mx-auto" />
            </div>
            <p className="mt-8 text-text-primary text-xl font-bold tracking-wider">LOADING MESSAGES</p>
            <p className="mt-2 text-text-secondary text-sm">Fetching your conversations…</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <MarketplaceLayout>
      <div className="bg-bg-secondary theme-transition py-8">

        {/* Ambient bg */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* ── Page header ── */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary theme-transition">Messages</h1>
                <p className="text-text-secondary text-lg theme-transition">
                  Communicate with buyers and sellers about your deals.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {totalUnread > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-accent/15 text-accent border border-accent/30">
                    {totalUnread} unread
                  </span>
                )}
                <button
                  onClick={() => refetch()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition disabled:opacity-60"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
                  Refresh
                </button>
                <Link
                  href={startDealHref}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-accent/10"
                  style={ACCENT_OUTLINE}
                >
                  <FiPlus size={14} />
                  {hasLiveDeal ? 'Open Deal' : 'Start Deal'}
                </Link>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm theme-transition">
                <FiAlertCircle size={16} className="flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={refetch} className="underline hover:no-underline text-xs">Retry</button>
              </div>
            )}
          </div>

          {/* ── Main panel ── */}
          <div className="bg-card-bg border border-border rounded-2xl shadow-xl overflow-hidden theme-transition"
               style={{ height: 'calc(100vh - 240px)', minHeight: 520 }}>
            <div className="flex h-full">

              {/* ── Sidebar (chat list) ── */}
              <div className="w-72 flex-shrink-0 border-r border-border flex flex-col theme-transition">

                {/* Search */}
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
                    <input
                      type="text"
                      placeholder="Search conversations…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-lg border border-input-border bg-input-bg text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-input-focus transition-all theme-transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                      >
                        <FiX size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* List header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                  <span className="text-sm font-semibold text-text-primary theme-transition">Conversations</span>
                  <span className="text-xs text-text-tertiary">
                    {filteredChats.length}{searchQuery ? ` of ${chats.length}` : ''}
                  </span>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto">
                  {loading && chats.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-accent border-r-accent mx-auto mb-3" />
                      <p className="text-text-secondary text-sm">Loading…</p>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-text-tertiary text-sm">
                      {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredChats.map(chat => (
                        <ChatItem
                          key={chat._id}
                          chat={chat}
                          selected={selectedChat?._id === chat._id}
                          onSelect={() => handleSelect(chat)}
                          onArchive={() => handleArchive(chat)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Main chat area ── */}
              <div className="flex-1 flex flex-col min-w-0">
                {selectedChat ? (
                  <>
                    {/* Chat header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card-bg theme-transition flex-shrink-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={selectedChat.otherUser} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-text-primary truncate theme-transition">
                              {selectedChat.otherUser.username}
                            </h3>
                            {selectedChat.order?.status && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                ORDER_STATUS_CLASSES[selectedChat.order.status] ?? 'text-gray-400 bg-gray-400/10'
                              }`}>
                                {selectedChat.order.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5 flex-wrap">
                            <span className="font-medium truncate max-w-[200px]">{selectedChat.listing.title}</span>
                            {selectedChat.deal ? (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-text-primary">
                                  {formatCents(selectedChat.deal.amountCents)}
                                </span>
                              </>
                            ) : (selectedChat.order?.amount ?? selectedChat.listing.price) && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-text-primary">
                                  ${selectedChat.order?.amount != null
                                    ? (selectedChat.order.amount / 100).toFixed(2)
                                    : selectedChat.listing.price}
                                </span>
                              </>
                            )}
                            {selectedChat.order?._id && (
                              <>
                                <span>•</span>
                                <span className="text-text-tertiary font-mono">
                                  #{selectedChat.order._id.slice(-6)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {selectedChat.order?._id && (
                          <button
                            onClick={() => router.push(`/marketplace/orders/${selectedChat.order!._id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-xs font-medium transition-all theme-transition"
                          >
                            View Order
                          </button>
                        )}
                        <button
                          onClick={() => handleArchive(selectedChat)}
                          title="Archive conversation"
                          className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-btn-secondary-bg transition-colors"
                        >
                          <FiArchive size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Pinned deal summary */}
                    {selectedChat.deal && (
                      <div
                        className="flex items-center justify-between gap-3 px-5 py-2 border-b border-border flex-shrink-0"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-primary) 6%, transparent)' }}
                      >
                        <div className="flex items-center gap-2 min-w-0 text-xs">
                          <DealStatusBadge status={selectedChat.deal.status} />
                          <span className="truncate text-text-secondary">{selectedChat.deal.title}</span>
                          <span className="font-semibold text-text-primary flex-shrink-0">
                            {formatCents(selectedChat.deal.amountCents)}
                          </span>
                        </div>
                        <Link
                          href={`/marketplace/deal/${selectedChat.deal._id}`}
                          className="mp-btn mp-btn-sm !h-7 !text-[11px] flex-shrink-0"
                          style={ACCENT_OUTLINE}
                        >
                          View Deal Room
                        </Link>
                      </div>
                    )}

                    {/* Firebase chat interface */}
                    <div className="flex-1 relative overflow-hidden">
                      <div className="absolute inset-0">
                        <FirebaseChatInterface
                          chatId={selectedChat.firebaseChatId}
                          currentUser={currentUser}
                          otherUser={selectedChat.otherUser}
                          orderId={selectedChat.order?._id}
                          dealId={selectedChat.deal?._id}
                          renderMessage={renderDealMessage}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* No chat selected */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    {chats.length === 0 ? (
                      /* Empty state — no chats */
                      <>
                        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
                          <FiMessageSquare size={36} />
                        </div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2 theme-transition">No conversations yet</h3>
                        <p className="text-text-secondary text-sm max-w-sm mb-6 theme-transition">
                          When you place an order or receive an offer, your conversations will appear here.
                          Start exploring listings to connect with sellers!
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => router.push('/marketplace')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-btn-primary-text font-semibold text-sm transition-all theme-transition"
                          >
                            <FiShoppingBag size={14} /> Browse Marketplace
                          </button>
                          <button
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition"
                          >
                            <FiRefreshCw size={13} /> Refresh
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Chats exist but none selected */
                      <>
                        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
                          <FiMessageSquare size={36} />
                        </div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2 theme-transition">Select a conversation</h3>
                        <p className="text-text-secondary text-sm max-w-sm theme-transition">
                          Choose a conversation from the list to start messaging. All your order-related chats are listed on the left.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default Messages;
