"use client";
// src/pages/marketplace/shared/Browse.tsx
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import { Listing } from '@/types/marketplace.types';
import {
  FiFilter, FiPlus, FiSearch, FiX, FiCreditCard, FiAlertCircle,
  FiLoader, FiUser, FiPlay, FiClock, FiDollarSign, FiEye, FiVideo,
  FiTrendingUp, FiTrendingDown, FiCalendar, FiType, FiTag, FiDollarSign as FiDollar
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { getListings } from '@/features/marketplace/api/marketplace.service';
import { createDirectPayment } from '@/features/marketplace/api/offer.service';
import { useAuth } from '@/features/auth/context/AuthContext';
import type {
  BillingDetails,
  OfferData,
  PaymentStatus,
} from '@/features/marketplace/components/buyer/PaymentModal';

// These modals are only ever shown after a user interaction (play a
// preview, pay), and PaymentModal alone pulls in the ~230KB
// Stripe Elements SDK. Loading them eagerly (they were previously always
// mounted, just hidden via a `show` prop) meant that JS shipped on every
// visit to this page even for users who never open a modal. Dynamic import
// + gating the JSX behind the same `show*` flags defers the chunk fetch
// until the user actually triggers it.
const VideoPlayerModal = dynamic(() => import('@/features/marketplace/components/shared/VideoPlayerModal'), { ssr: false });
const PaymentModal = dynamic(() => import('@/features/marketplace/components/buyer/PaymentModal'), { ssr: false });

// Constants for placeholder images
const VIDEO_PLACEHOLDER = '/wecinema.webp';
const ERROR_IMAGE = '/wecinema.webp';

// Content type categories
const CONTENT_TYPES = [
  { id: 'sale', label: 'For Sale', icon: '💰', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
  { id: 'commission', label: 'Commission', icon: '🎨', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' },
  { id: 'adaptation', label: 'Adaptation Rights', icon: '📜', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
  { id: 'license', label: 'License', icon: '📋', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600' }
];

// Sort options
const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest', icon: FiCalendar, description: 'Newest first' },
  { id: 'popular', label: 'Popular', icon: FiTrendingUp, description: 'Most viewed' },
  { id: 'price_low', label: 'Price: Low to High', icon: FiTrendingDown, description: 'Lowest price first' },
  { id: 'price_high', label: 'Price: High to Low', icon: FiTrendingUp, description: 'Highest price first' }
];

const Browse: React.FC = () => {
  const { authUser, isAuthenticated } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [, setSelectedListing] = useState<Listing | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string>('');
  const [showVideoPopup, setShowVideoPopup] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoListing, setVideoListing] = useState<Listing | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });
  // New state for image loading errors
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  // Own-listing error popup
  const [showOwnListingError, setShowOwnListingError] = useState(false);
  const router = useRouter();

  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'latest'
  });

  // Video player ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);

  // Fetch listings on filter change
  useEffect(() => {
    fetchListings();
  }, [filters]);

  // Populate billing details from authenticated user
  useEffect(() => {
    if (authUser) {
      setBillingDetails(prev => ({
        ...prev,
        name: (authUser as any).username || 'Customer',
        email: authUser.email || '',
        phone: (authUser as any).phone || ''
      }));
    }
  }, [authUser]);

  // Handle billing details change
  const handleBillingDetailsChange = (details: any) => {
    setBillingDetails(prev => ({
      ...prev,
      ...details
    }));
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError('');
      setImageErrors({});

      const params: any = {};

      if (filters.type) params.type = filters.type;
      if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);
      if (filters.sortBy === 'price_low' || filters.sortBy === 'price_high') {
        params.sortBy = filters.sortBy;
      } else if (filters.sortBy === 'latest') {
        params.sortBy = 'newest';
      }
      // 'popular' is handled client-side via sortListings
      if (searchQuery) params.search = searchQuery;

      console.log('📡 Fetching listings with params:', params);

      const response = await getListings(params);

      const listingsData = response.listings || [];

      console.log('✅ Listings fetched:', listingsData.length);

      // Apply local filtering for active category
      let filteredData = listingsData;

      if (activeCategory && activeCategory !== 'all') {
        filteredData = filteredData.filter((listing: Listing) =>
          listing.type?.toLowerCase() === activeCategory.toLowerCase()
        );
      }

      // Filter by status - only show active listings
      filteredData = filteredData.filter((listing: Listing) =>
        listing.status === 'active'
      );

      const sortedData = sortListings(filteredData, filters.sortBy);

      setListings(sortedData);

    } catch (error: any) {
      console.error('Error fetching listings:', error);
      setError(error.message || 'Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sortListings = (data: Listing[], sortBy: string) => {
    const sortedData = [...data];

    switch (sortBy) {
      case 'latest':
        return sortedData.sort((a, b) =>
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
      case 'price_low':
        return sortedData.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_high':
        return sortedData.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'popular':
        return sortedData.sort((a, b) => {
          const viewsA = a.views || 0;
          const viewsB = b.views || 0;
          return viewsB - viewsA;
        });
      default:
        return sortedData;
    }
  };

  const handleViewDetails = (listingId: string) => {
    router.push(`/marketplace/listings/${listingId}`);
  };

  // Offers are negotiated in the Deals flow — nothing is charged until both
  // sides agree on terms, so there's no payment step here.
  const handleMakeOffer = (listing: Listing) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const sellerId =
      listing.seller?._id ?? (typeof listing.sellerId === 'string' ? listing.sellerId : listing.sellerId?._id);
    if (authUser && sellerId === authUser._id) {
      setShowOwnListingError(true);
      return;
    }
    router.push(`/marketplace/deals/new?listing=${listing._id}`);
  };

  const handleVideoClick = (videoUrl: string, title: string, listing: Listing) => {
    console.log('🎬 Opening video:', videoUrl);
    setSelectedVideo(videoUrl);
    setVideoTitle(title);
    setVideoListing(listing);
    setShowVideoPopup(true);
  };

  const handleCloseVideoPopup = () => {
    setShowVideoPopup(false);
    setSelectedVideo('');
    setVideoTitle('');
    setVideoListing(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Helper functions — parse pathname before checking extension so S3 pre-signed
  // URLs (which have query params like ?X-Amz-Signature=…) are detected correctly.
  const getUrlPathname = (url: string): string => {
    try { return new URL(url).pathname.toLowerCase(); } catch { return url.toLowerCase(); }
  };

  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const pathname = getUrlPathname(url);
    return ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'].some(ext => pathname.endsWith(ext));
  };

  const isImageUrl = (url: string): boolean => {
    if (!url) return false;
    const pathname = getUrlPathname(url);
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].some(ext => pathname.endsWith(ext));
  };

  const getFirstMediaUrl = (mediaUrls: string[]): { url: string; isVideo: boolean; isImage: boolean } => {
    if (!mediaUrls || mediaUrls.length === 0) {
      return { url: '', isVideo: false, isImage: false };
    }

    // Try to find an image first
    for (const url of mediaUrls) {
      if (isImageUrl(url)) {
        return { url, isVideo: false, isImage: true };
      }
    }

    // Then try to find a video
    for (const url of mediaUrls) {
      if (isVideoUrl(url)) {
        return { url, isVideo: true, isImage: false };
      }
    }

    // Return first URL as fallback
    return {
      url: mediaUrls[0] ?? '',
      isVideo: isVideoUrl(mediaUrls[0] ?? ''),
      isImage: isImageUrl(mediaUrls[0] ?? '')
    };
  };

  const getThumbnailUrl = (listing: Listing): string => {
    const listingId = listing._id || 'unknown';

    if (imageErrors[listingId]) {
      return ERROR_IMAGE;
    }

    if (listing.thumbnail && listing.thumbnail.trim() !== '') {
      return listing.thumbnail;
    }

    if (listing.mediaUrls && listing.mediaUrls.length > 0) {
      const { url, isImage } = getFirstMediaUrl(listing.mediaUrls);
      if (isImage) {
        return url;
      }
    }

    return VIDEO_PLACEHOLDER;
  };

  const handleImageError = (listingId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [listingId]: true
    }));
  };

  const getQualityBadge = (quality?: string) => {
    if (!quality) return { color: 'bg-accent text-btn-primary-text', label: '' };

    switch (quality.toLowerCase()) {
      case '4k':
      case 'ultra hd':
        return { color: 'bg-accent text-btn-primary-text', label: '4K' };
      case 'hd':
      case '1080p':
        return { color: 'bg-blue-500 text-white', label: 'HD' };
      default:
        return { color: 'bg-accent text-btn-primary-text', label: '' };
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined
      });
    }
  };

  const handleDirectPayment = async (listing: Listing) => {
    if (!listing._id) return;

    try {
      setPaymentStatus('processing');
      setError('');

      const response = await createDirectPayment({ listingId: listing._id });

      if (!response.data?.clientSecret) {
        throw new Error('No client secret received from server. Please try again.');
      }

      setClientSecret(response.data.clientSecret);

      setOfferData({
        type: 'direct_purchase',
        amount: listing.price,
        orderId: response.data.orderId,
        clientSecret: response.data.clientSecret,
        listing,
      });

      setShowPaymentModal(true);
      setPaymentStatus('idle');

    } catch (error: any) {
      console.error('❌ Error creating direct payment:', error);
      setPaymentStatus('failed');

      if (error?.status === 403 && error?.message?.toLowerCase().includes('own listing')) {
        setShowOwnListingError(true);
        return;
      }

      setError(error.message || error.error || 'Failed to initiate payment');
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      console.log('✅ Payment completed successfully for:', {
        buyerName: (authUser as any)?.username || 'A buyer',
        type: offerData?.type,
        amount: offerData?.amount
      });

    } catch (error) {
      console.error('Error in payment success handling:', error);
    }

    setShowPaymentModal(false);
    setSelectedListing(null);
    setClientSecret('');
    setOfferData(null);
    setPaymentStatus('success');

    router.push('/marketplace/orders');
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setSelectedListing(null);
    setClientSecret('');
    setOfferData(null);
    setPaymentStatus('idle');
    setError('');
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'latest'
    });
    setSearchQuery('');
    setActiveCategory('');
    setError('');
  };

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!loading) {
        fetchListings();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (loading) {
    return (
      <MarketplaceLayout
        title="Browse Independent Films & Scripts for Sale"
        subtitle="Every active listing on the WeCinema marketplace: films, scripts, licensing and adaptation rights, sold directly by their creators."
      >
        <div className="mp-loading-state" style={{ minHeight: "60vh" }}>
          <div className="mp-spinner" style={{ marginBottom: 20 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px", fontFamily: "var(--font-heading)" }}>Loading Marketplace</p>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>Discovering premium video content…</p>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout
      title="Browse Independent Films & Scripts for Sale"
      subtitle="Every active listing on the WeCinema marketplace: films, scripts, licensing and adaptation rights, sold directly by their creators."
    >
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-secondary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 8, paddingBottom: 48 }}>
          {/* Error Banner */}
          {error && (
            <div className="mp-alert mp-alert-danger mb-6" style={{ borderRadius: 14 }}>
              <FiAlertCircle size={18} className="flex-shrink-0" aria-hidden="true" />
              <p style={{ flex: 1, fontSize: 14, fontWeight: 600, margin: 0 }}>{error}</p>
              <button
                onClick={() => setError('')}
                style={{ color: "var(--color-danger)", padding: 4, borderRadius: 6, transition: "all 0.15s ease", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                aria-label="Dismiss error"
              >
                <FiX size={16} />
              </button>
            </div>
          )}

          {/* Header Section */}
          <div style={{ marginBottom: 28, paddingTop: 8 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 24 }}>
              <div>
                <h1 style={{ margin: "0 0 6px", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Video Marketplace
                </h1>
                <p style={{ margin: 0, fontSize: 14.5, color: "var(--color-text-secondary)", maxWidth: 560, lineHeight: 1.6 }}>
                  Discover premium video content. Buy, sell, license, and commission high-quality videos from talented creators.
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => router.push('/marketplace/listings/new')}
                      className="mp-btn mp-btn-primary"
                    >
                      <FiPlus size={16} aria-hidden="true" />
                      Upload Video
                    </button>
                    <button
                      onClick={() => router.push('/marketplace/orders')}
                      className="mp-btn mp-btn-secondary"
                    >
                      <FiCreditCard size={16} aria-hidden="true" />
                      My Orders
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="mp-btn mp-btn-secondary"
                  style={showFilters ? { borderColor: "var(--color-accent-primary)", color: "var(--color-accent-primary)", backgroundColor: "rgba(255,187,0,0.07)" } : {}}
                >
                  <FiFilter size={15} aria-hidden="true" />
                  {showFilters ? 'Hide Filters' : 'Filters'}
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ maxWidth: 640 }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-tertiary)" }}>
                  <FiSearch size={18} aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos by title, description, tags, or creator…"
                  className="mp-input"
                  style={{ paddingLeft: 44, paddingRight: searchQuery ? 44 : 14, fontSize: 14.5, height: 46 }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, transition: "color 0.15s ease", display: "flex", alignItems: "center" }}
                    aria-label="Clear search"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
            {[
              { value: listings.length, label: "Total Listings", icon: <FiVideo size={18} />, iconBg: "rgba(255,187,0,0.1)", iconColor: "var(--color-accent-primary)" },
              { value: listings.filter(l => getFirstMediaUrl(l.mediaUrls || []).isVideo).length, label: "Video Content", icon: <FiPlay size={18} />, iconBg: "rgba(59,130,246,0.1)", iconColor: "#3B82F6" },
              { value: new Set(listings.map(l => (l.sellerId as any)?._id)).size, label: "Active Creators", icon: <FiUser size={18} />, iconBg: "rgba(34,197,94,0.1)", iconColor: "var(--color-success)" },
            ].map((stat, i) => (
              <div key={i} className="mp-stat-card">
                <div className="mp-stat-card-icon" style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}>{stat.icon}</div>
                <div>
                  <p className="mp-stat-card-value">{stat.value}</p>
                  <p className="mp-stat-card-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="mp-card" style={{ marginBottom: 24, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "var(--color-accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FiFilter style={{ color: "#000" }} size={16} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>Advanced Filters</h3>
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-text-tertiary)" }}>Refine your search with precise filters</p>
                  </div>
                </div>
                <button onClick={clearFilters} className="mp-btn mp-btn-ghost" style={{ fontSize: 13, height: 34 }}>
                  Clear all
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                {/* Content Type Filter */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    <FiType size={13} style={{ color: "var(--color-accent-primary)" }} aria-hidden="true" />
                    Content Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="mp-select"
                  >
                    <option value="">All Content Types</option>
                    <option value="sale">For Sale</option>
                    <option value="commission">Commission</option>
                    <option value="adaptation">Adaptation Rights</option>
                    <option value="license">License</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    <FiTag size={13} style={{ color: "var(--color-accent-primary)" }} aria-hidden="true" />
                    Sort By
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {SORT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isActive = filters.sortBy === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setFilters(prev => ({ ...prev, sortBy: option.id }))}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: isActive ? "1.5px solid var(--color-accent-primary)" : "1px solid var(--color-card-border)",
                            backgroundColor: isActive ? "rgba(255,187,0,0.08)" : "var(--color-bg-secondary)",
                            color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Icon size={12} style={{ color: isActive ? "var(--color-accent-primary)" : "var(--color-text-tertiary)" }} aria-hidden="true" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    <FiDollar size={13} style={{ color: "var(--color-accent-primary)" }} aria-hidden="true" />
                    Price Range
                  </label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                      className="mp-input"
                      style={{ flex: 1, fontSize: 13 }}
                      min="0"
                    />
                    <span style={{ color: "var(--color-text-tertiary)", fontSize: 13, flexShrink: 0 }}>–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                      className="mp-input"
                      style={{ flex: 1, fontSize: 13 }}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--color-divider)" }}>
                <button
                  onClick={fetchListings}
                  className="mp-btn mp-btn-primary"
                  style={{ width: "100%", height: 44, fontSize: 14, justifyContent: "center" }}
                >
                  Apply Filters &amp; Refresh Results
                </button>
              </div>
            </div>
          )}

          {/* Results Header */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ padding: "6px 14px", backgroundColor: "var(--color-bg-tertiary)", borderRadius: 9, border: "1px solid var(--color-card-border)" }}>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                  {activeCategory ? (
                    <>Showing <strong style={{ color: "var(--color-text-primary)" }}>{listings.length}</strong> {CONTENT_TYPES.find(t => t.id === activeCategory)?.label.toLowerCase()} listings</>
                  ) : (
                    <>Found <strong style={{ color: "var(--color-text-primary)" }}>{listings.length}</strong> listings{searchQuery && <> for "<strong style={{ color: "var(--color-text-primary)" }}>{searchQuery}</strong>"</>}</>
                  )}
                </p>
              </div>
              {(searchQuery || activeCategory) && (
                <button
                  onClick={() => {
                    if (searchQuery) setSearchQuery('');
                    if (activeCategory) setActiveCategory('');
                  }}
                  className="mp-btn mp-btn-ghost"
                  style={{ height: 32, fontSize: 12.5, gap: 5 }}
                >
                  <FiX size={11} aria-hidden="true" />
                  Clear {searchQuery && activeCategory ? 'all' : searchQuery ? 'search' : 'filter'}
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 500 }}>Sorted by:</span>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700 }}>
                {SORT_OPTIONS.find(s => s.id === filters.sortBy)?.label}
              </span>
            </div>
          </div>

          {/* Listings Grid */}
          {listings.length === 0 ? (
            <div className="mp-card">
              <div className="mp-empty-state">
                <div className="mp-empty-state-icon">
                  <FiVideo size={28} aria-hidden="true" />
                </div>
                <h3 className="mp-empty-state-title">
                  {activeCategory
                    ? `No ${CONTENT_TYPES.find(t => t.id === activeCategory)?.label.toLowerCase()} listings found`
                    : searchQuery || Object.values(filters).some(Boolean)
                    ? 'No listings found'
                    : 'Welcome to Video Marketplace!'
                  }
                </h3>
                <p className="mp-empty-state-text">
                  {activeCategory
                    ? `There are currently no ${CONTENT_TYPES.find(t => t.id === activeCategory)?.label.toLowerCase()} listings. Be the first to create one!`
                    : searchQuery || Object.values(filters).some(Boolean)
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Be the first to upload a video and start selling!'
                  }
                </p>
                {isAuthenticated && (
                  <button
                    onClick={() => router.push('/marketplace/listings/new')}
                    className="mp-btn mp-btn-primary"
                    style={{ height: 42, paddingLeft: 24, paddingRight: 24 }}
                  >
                    <FiPlus size={16} aria-hidden="true" />
                    Upload Your First Video
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map(listing => {
                const { url: mediaUrl, isVideo, isImage } = getFirstMediaUrl(listing.mediaUrls || []);
                const thumbnailUrl = getThumbnailUrl(listing);
                const qualityBadge = getQualityBadge((listing as any).quality);
                const contentType = CONTENT_TYPES.find(t => t.id === listing.type);

                return (
                  <div
                    key={listing._id}
                    className="mp-card mp-card-hover"
                    style={{ overflow: "hidden" }}
                    onMouseEnter={() => setHoveredListing(listing._id)}
                    onMouseLeave={() => setHoveredListing(null)}
                  >
                    {/* Media Thumbnail */}
                    <div className="h-48 bg-bg-secondary relative overflow-hidden theme-transition">
                      {mediaUrl ? (
                        isVideo ? (
                          // Static image thumbnail + play overlay (never render <video> in cards)
                          <div
                            className="relative w-full h-full cursor-pointer"
                            onClick={() => handleVideoClick(mediaUrl, listing.title, listing)}
                          >
                            {listing.thumbnail ? (
                              <img
                                src={listing.thumbnail}
                                alt={listing.title}
                                className="w-full h-full object-cover transition-transform duration-300"
                                style={{ transform: hoveredListing === listing._id ? 'scale(1.05)' : 'scale(1)' }}
                                loading="lazy"
                                onError={() => handleImageError(listing._id)}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.55) 0%, rgba(15,10,40,0.85) 100%)' }}
                              >
                                <FiVideo size={40} color="rgba(216,180,254,0.55)" />
                              </div>
                            )}
                            <div
                              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                              style={{ backgroundColor: hoveredListing === listing._id ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.12)' }}
                            >
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300"
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.92)',
                                  transform: hoveredListing === listing._id ? 'scale(1.1)' : 'scale(1)',
                                }}
                              >
                                <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                                Video
                              </span>
                            </div>
                          </div>
                        ) : isImage ? (
                          // Image thumbnail
                          <div className="relative w-full h-full">
                            <img
                              src={thumbnailUrl}
                              alt={listing.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={() => handleImageError(listing._id)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        ) : (
                          // Generic media
                          <div className="w-full h-full flex items-center justify-center bg-bg-secondary group-hover:opacity-90 transition-all duration-300 theme-transition">
                            <div className="text-center transform group-hover:scale-110 transition-transform duration-300">
                              <svg className="w-12 h-12 text-text-tertiary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm text-text-secondary mt-2 theme-transition">Media File</p>
                            </div>
                          </div>
                        )
                      ) : (
                        // No media
                        <div className="w-full h-full flex items-center justify-center bg-bg-secondary theme-transition">
                          <div className="text-center transform group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-12 h-12 text-text-tertiary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-text-tertiary mt-2 theme-transition">No Media</p>
                          </div>
                        </div>
                      )}

                      {/* Quality Badge */}
                      {qualityBadge.label && (
                        <div className={`absolute top-3 right-3 z-10 px-2 py-1 rounded ${qualityBadge.color} text-xs font-bold shadow-sm`}>
                          {qualityBadge.label}
                        </div>
                      )}

                      {/* Content Type Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          contentType?.color || 'bg-gray-600'
                        } text-white border border-white/30 shadow-sm`}>
                          <span className="mr-1" aria-hidden="true">{contentType?.icon || '📁'}</span>
                          <span className="font-semibold">
                            {contentType?.label || listing.type || 'Sale'}
                          </span>
                        </span>
                      </div>

                      {/* Price Tag */}
                      <div className="absolute bottom-3 left-3">
                        <div className="bg-accent text-btn-primary-text px-3 py-1.5 rounded-lg shadow-lg theme-transition">
                          <p className="text-lg font-bold">{formatCurrency(listing.price)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Listing Info */}
                    <div className="p-5">
                      <div className="mb-4">
                        <h3
                          className="font-semibold text-text-primary mb-2 truncate group-hover:text-accent transition-colors cursor-pointer theme-transition"
                          title={listing.title}
                          onClick={() => handleViewDetails(listing._id)}
                        >
                          {listing.title}
                        </h3>

                        <p className="text-sm text-text-secondary line-clamp-2 mb-3 theme-transition" title={listing.description}>
                          {listing.description}
                        </p>
                      </div>

                      {/* Tags */}
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {listing.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-bg-secondary text-text-secondary border border-border hover:bg-btn-secondary-hover transition-colors cursor-default theme-transition"
                              title={tag}
                            >
                              #{tag}
                            </span>
                          ))}
                          {listing.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-bg-secondary text-text-tertiary border border-border theme-transition">
                              +{listing.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <div style={{ paddingTop: 12, borderTop: "1px solid var(--color-divider)" }}>
                        <button
                          onClick={() => handleMakeOffer(listing)}
                          className="mp-btn mp-btn-primary"
                          style={{ width: "100%", height: 40, justifyContent: "center" }}
                        >
                          <FiDollarSign size={15} aria-hidden="true" />
                          Make an Offer · {formatCurrency(listing.price)}
                        </button>
                      </div>

                      {/* Seller Info */}
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between theme-transition">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden border border-border theme-transition">
                            {(listing.sellerId as any)?.avatar ? (
                              <img
                                src={(listing.sellerId as any).avatar}
                                alt={(listing.sellerId as any).username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32/F3F4F6/9CA3AF?text=U';
                                }}
                              />
                            ) : (
                              <FiUser size={14} className="text-text-secondary" aria-hidden="true" />
                            )}
                          </div>
                          <span className="text-xs text-text-secondary truncate max-w-[100px] font-medium theme-transition">
                            {(listing.sellerId as any)?.username || 'Seller'}
                          </span>
                        </div>

                        {(listing as any).duration && (
                          <div className="text-xs text-text-tertiary flex items-center gap-1 theme-transition">
                            <FiClock size={10} aria-hidden="true" />
                            {(listing as any).duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {listings.length > 0 && listings.length >= 12 && (
            <div style={{ marginTop: 28, textAlign: "center" }}>
              <button
                onClick={fetchListings}
                className="mp-btn mp-btn-secondary"
                style={{ height: 44, paddingLeft: 28, paddingRight: 28, fontSize: 14 }}
              >
                <span>Load More Videos</span>
                <FiPlus size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Call to Action Footer */}
          <div className="mp-card" style={{ marginTop: 40, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(1.2rem, 2vw, 1.5rem)", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                Start Your Video Journey Today
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: 14.5, color: "var(--color-text-secondary)", lineHeight: 1.65 }}>
                Join thousands of creators and buyers in our thriving video marketplace.
                Whether you're looking to sell your work or find the perfect video, we've got you covered.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={() => router.push('/marketplace/listings/new')}
                  className="mp-btn mp-btn-primary"
                  style={{ height: 46, paddingLeft: 28, paddingRight: 28, fontSize: 14 }}
                >
                  Start Selling Videos
                </button>
                <button
                  onClick={() => setShowFilters(true)}
                  className="mp-btn mp-btn-secondary"
                  style={{ height: 46, paddingLeft: 28, paddingRight: 28, fontSize: 14 }}
                >
                  Explore Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Popup Modal */}
      {showVideoPopup && (
        <VideoPlayerModal
          show={showVideoPopup}
          videoUrl={selectedVideo}
          videoTitle={videoTitle}
          videoThumbnail={videoListing ? getThumbnailUrl(videoListing) : ''}
          onClose={handleCloseVideoPopup}
        />
      )}

      {/* Own-listing error popup */}
      {showOwnListingError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowOwnListingError(false)}
        >
          <div
            className="bg-card-bg border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center theme-transition"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-text-primary mb-2 theme-transition">
              Can't Buy Your Own Listing
            </h3>
            <p className="text-sm text-text-secondary theme-transition">
              You cannot make an offer or purchase a listing that you created. Share it with others so they can buy it!
            </p>

            <button
              onClick={() => setShowOwnListingError(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-btn-primary-text text-sm font-semibold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        clientSecret={clientSecret}
        offerData={offerData}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        billingDetails={billingDetails}
        onBillingDetailsChange={handleBillingDetailsChange}
        getThumbnailUrl={getThumbnailUrl}
      />
    </MarketplaceLayout>
  );
};

export default Browse;
