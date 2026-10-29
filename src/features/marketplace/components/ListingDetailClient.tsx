"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import {
  FaArrowLeft, FaSpinner, FaExclamationCircle, FaTag,
  FaStar, FaEye, FaHeart, FaShoppingCart, FaChevronLeft, FaChevronRight, FaHandshake,
} from 'react-icons/fa';

import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import { useAuth } from '@/features/auth/context/AuthContext';
import { api } from '@/features/auth/services/apiClient';

// ─── Types ────────────────────────────────────────────────────

interface Seller {
  _id: string;
  username: string;
  avatar?: string;
  sellerRating?: number;
  email?: string;
}

interface Listing {
  _id: string;
  title: string;
  description?: string;
  price: number;          // in DOLLARS (seller-set)
  formattedPrice?: string;
  currency?: string;
  type?: string;
  category?: string;
  status?: string;
  tags?: string[];
  mediaUrls?: string[];
  thumbnail?: string;
  seller?: Seller;
  sellerId?: Seller;
  views?: number;
  favoriteCount?: number;
  purchaseCount?: number;
  isDigital?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function fmtStatus(s?: string) {
  if (!s) return '';
  return s.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url);
}

// ─── Media Gallery ────────────────────────────────────────────

function MediaGallery({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0);

  if (!urls.length) {
    return (
      <div className="w-full h-64 bg-bg-secondary border border-border rounded-2xl flex items-center justify-center">
        <span className="text-text-tertiary text-sm">No media</span>
      </div>
    );
  }

  const current = urls[idx] ?? '';

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-border">
        {isVideo(current) ? (
          <video
            key={current}
            src={current}
            controls
            className="w-full max-h-[480px] object-contain"
          />
        ) : (
          <div className="relative w-full aspect-video">
            <Image
              src={current}
              alt={`Media ${idx + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-contain"
              priority={idx === 0}
            />
          </div>
        )}

        {/* Prev/Next arrows */}
        {urls.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center disabled:opacity-30 transition-colors"
            >
              <FaChevronLeft size={12} />
            </button>
            <button
              onClick={() => setIdx(i => Math.min(urls.length - 1, i + 1))}
              disabled={idx === urls.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center disabled:opacity-30 transition-colors"
            >
              <FaChevronRight size={12} />
            </button>
          </>
        )}

        {/* Counter */}
        {urls.length > 1 && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
            {idx + 1} / {urls.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                i === idx ? 'border-accent' : 'border-border hover:border-text-secondary'
              }`}
            >
              {isVideo(url) ? (
                <div className="w-full h-full bg-bg-secondary flex items-center justify-center">
                  <span className="text-xs text-text-tertiary">▶</span>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

const ListingDetailClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authUser } = useAuth();

  const [listing,  setListing]  = useState<Listing | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [buying,   setBuying]   = useState(false);

  const fetchListing = useCallback(async () => {
    if (!id) { setError('Listing ID missing'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/marketplace/listings/${id}`);
      const data = res?.listing ?? res?.data?.listing ?? res?.data ?? res;
      if (data?._id) {
        setListing(data);
      } else {
        setError(res?.error ?? 'Listing not found');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Failed to load listing';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  // Direct purchase — creates a pending_payment order via offer service
  const handleBuyNow = async () => {
    if (!authUser) { router.push('/login'); return; }
    setBuying(true);
    try {
      const res: any = await api.post('/marketplace/offers/create-direct-payment', { listingId: id });
      // Backend returns { clientSecret, orderId }
      const orderId = res?.data?.orderId ?? res?.orderId;
      if (orderId) {
        router.push(`/marketplace/orders/${orderId}`);
      } else {
        toast.error('Could not initiate payment');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to start purchase');
    } finally {
      setBuying(false);
    }
  };

  const seller = listing?.seller ?? listing?.sellerId;
  const isOwnListing = !!authUser && seller && (
    seller._id === (authUser._id ?? (authUser as any).id ?? (authUser as any).userId)
  );

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <MarketplaceLayout>
      <div className="flex items-center justify-center bg-bg-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-text-primary font-medium">Loading listing…</p>
        </div>
      </div>
    </MarketplaceLayout>
  );

  // ── Error ──────────────────────────────────────────────────
  if (error || !listing) return (
    <MarketplaceLayout>
      <div className="max-w-sm mx-auto mt-24 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <FaExclamationCircle className="text-red-500 text-xl" />
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-1">Listing Not Found</h3>
        <p className="text-sm text-text-secondary mb-5">
          {error ?? 'This listing does not exist or has been removed.'}
        </p>
        <button
          onClick={() => router.push('/marketplace')}
          className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-btn-primary-text font-semibold rounded-xl text-sm transition-colors"
        >
          Browse Marketplace
        </button>
      </div>
    </MarketplaceLayout>
  );

  // ── Main ───────────────────────────────────────────────────
  return (
    <MarketplaceLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <FaArrowLeft size={12} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: Media + Description ── */}
          <div className="lg:col-span-3 space-y-5">
            <MediaGallery urls={listing.mediaUrls ?? []} />

            {/* Description */}
            {listing.description && (
              <div className="bg-card-bg border border-border rounded-2xl p-5">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
                  Description
                </h3>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 bg-bg-secondary border border-border rounded-full text-xs text-text-secondary"
                  >
                    <FaTag size={9} /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Info + Actions ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Title + price card */}
            <div className="bg-card-bg border border-border rounded-2xl p-5 space-y-4">
              <div>
                {listing.category && (
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    {listing.category}
                  </span>
                )}
                <h1 className="text-xl font-bold text-text-primary mt-1 leading-snug">
                  {listing.title}
                </h1>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-primary">
                  ${(listing.price ?? 0).toFixed(2)}
                </span>
                <span className="text-sm text-text-tertiary">{listing.currency ?? 'USD'}</span>
              </div>

              {/* Status */}
              {listing.status && listing.status !== 'active' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                  {fmtStatus(listing.status)}
                </span>
              )}

              {/* CTA */}
              {!isOwnListing && listing.status === 'active' && (
                <button
                  onClick={handleBuyNow}
                  disabled={buying}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover text-btn-primary-text font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {buying
                    ? <><FaSpinner className="animate-spin" /> Processing…</>
                    : <><FaShoppingCart /> Buy Now · ${(listing.price ?? 0).toFixed(2)}</>
                  }
                </button>
              )}

              {!isOwnListing && listing.status === 'active' && (
                <button
                  onClick={() => router.push(authUser ? `/marketplace/deals/new?listing=${listing._id}` : '/login')}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-accent text-accent hover:bg-accent/10 font-semibold rounded-xl transition-colors"
                >
                  <FaHandshake /> Make an Offer
                </button>
              )}

              {isOwnListing && (
                <div className="text-center py-2 text-sm text-text-tertiary border border-border rounded-xl">
                  This is your listing
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <FaEye />,          label: 'Views',     value: listing.views ?? 0 },
                { icon: <FaHeart />,        label: 'Favorites', value: listing.favoriteCount ?? 0 },
                { icon: <FaShoppingCart />, label: 'Purchases', value: listing.purchaseCount ?? 0 },
              ].map(s => (
                <div key={s.label} className="bg-card-bg border border-border rounded-xl p-3 text-center">
                  <div className="text-text-tertiary flex justify-center mb-1">{s.icon}</div>
                  <p className="text-base font-bold text-text-primary">{s.value}</p>
                  <p className="text-xs text-text-tertiary">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Seller */}
            {seller && (
              <div className="bg-card-bg border border-border rounded-2xl p-5">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Seller</h3>
                <div className="flex items-center gap-3">
                  {seller.avatar ? (
                    <Image
                      src={seller.avatar}
                      alt={seller.username}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                      {seller.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-text-primary">{seller.username}</p>
                    {seller.sellerRating != null && seller.sellerRating > 0 && (
                      <div className="flex items-center gap-1 text-sm text-yellow-500 mt-0.5">
                        <FaStar size={11} />
                        <span>{seller.sellerRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="bg-card-bg border border-border rounded-2xl p-5 space-y-0">
              <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Details</h3>
              {[
                { label: 'Type',    value: fmtStatus(listing.type) },
                { label: 'Listed',  value: fmtDate(listing.createdAt) },
                { label: 'Updated', value: fmtDate(listing.updatedAt) },
                { label: 'Digital', value: listing.isDigital ? 'Yes' : 'No' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                  <span className="text-text-secondary">{row.label}</span>
                  <span className="font-medium text-text-primary">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default ListingDetailClient;
