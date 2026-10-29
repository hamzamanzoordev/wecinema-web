"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MarketplaceLayout from "@/features/marketplace/components/MarketplaceLayout";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api, AppError } from "@/features/auth/services/apiClient";
import { toast } from "@/lib/toast";
import { createDeal } from "../api/deal.service";
import { DealFilmHeader } from "../components/DealFilmHeader";
import { DealPageHeader } from "../components/DealPageHeader";
import { DealEmptyState, DealRoomSkeleton } from "../components/DealStates";
import { DealTermsForm } from "../components/DealTermsForm";
import { OfferComparison } from "../components/OfferComparison";
import { dealErrorMessage } from "../hooks/useDeals";
import { defaultTerms } from "../lib/constants";
import type { Deal, DealTerms } from "../types/deal.types";

/** Loose listing shape — /marketplace/listings/:id responses vary by route version. */
interface ListingLike {
  _id: string;
  title: string;
  description?: string;
  price?: number; // dollars
  type?: string;
  category?: string;
  status?: string;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  createdAt?: string;
  seller?: { _id: string; username: string; avatar?: string | null };
  sellerId?: { _id: string; username: string; avatar?: string | null } | string;
}

function unwrapListing(res: unknown): ListingLike | null {
  const r = res as { listing?: ListingLike; data?: { listing?: ListingLike } & ListingLike } | ListingLike | null;
  const candidate =
    (r as { listing?: ListingLike })?.listing ??
    (r as { data?: { listing?: ListingLike } })?.data?.listing ??
    (r as { data?: ListingLike })?.data ??
    (r as ListingLike);
  return candidate && typeof candidate === "object" && "_id" in candidate ? candidate : null;
}

export default function NewDealView({ listingId }: { listingId?: string }) {
  const router = useRouter();
  const { authUser } = useAuth();
  const [listing, setListing] = useState<ListingLike | null>(null);
  const [loading, setLoading] = useState(!!listingId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [offerCents, setOfferCents] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    api
      .get<unknown>(`/marketplace/listings/${encodeURIComponent(listingId)}`)
      .then((res) => {
        if (cancelled) return;
        const found = unwrapListing(res);
        if (found) setListing(found);
        else setLoadError("Listing not found");
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof AppError ? err.message : "Failed to load listing");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const seller = listing?.seller ?? (typeof listing?.sellerId === "object" ? listing.sellerId : undefined);
  const isOwnListing = !!authUser && !!seller && seller._id === authUser._id;
  const listPriceCents = Math.round((listing?.price ?? 0) * 100);

  const initialTerms = useMemo<DealTerms>(() => defaultTerms(listing?.type, listPriceCents), [listing?.type, listPriceCents]);

  // A draft "deal" so the film header renders exactly as it will in the Deal Room.
  const preview = useMemo<Pick<Deal, "listing" | "buyer" | "seller" | "terms"> | null>(() => {
    if (!listing) return null;
    const year = listing.createdAt ? new Date(listing.createdAt).getFullYear() : null;
    return {
      listing: {
        _id: listing._id,
        title: listing.title,
        description: listing.description ?? "",
        posterUrl: listing.thumbnailUrl ?? listing.thumbnail ?? null,
        genre: listing.category ?? null,
        year: year && Number.isFinite(year) ? year : null,
        listingType: listing.type ?? "licensing",
        listPriceCents,
      },
      seller: { _id: seller?._id ?? "", username: seller?.username ?? "Seller", avatar: seller?.avatar ?? null },
      buyer: { _id: authUser?._id ?? "", username: authUser?.username ?? "You", avatar: authUser?.avatar ?? null },
      terms: initialTerms,
    };
  }, [listing, seller, authUser, listPriceCents, initialTerms]);

  const handleSubmit = async (terms: DealTerms) => {
    if (!listing || submitting) return;
    setSubmitting(true);
    try {
      const res = await createDeal({ listingId: listing._id, terms });
      toast.success("Offer sent");
      router.replace(`/marketplace/deal/${res.data._id}`);
    } catch (err) {
      const existing = err instanceof AppError ? err.body?.existingDealId : undefined;
      if (err instanceof AppError && err.code === "DEAL_EXISTS" && typeof existing === "string") {
        toast("You already have an open deal on this listing. Opening it now.");
        router.push(`/marketplace/deal/${existing}`);
        return;
      }
      toast.error(dealErrorMessage(err, "Could not send your offer. Please try again."));
      setSubmitting(false);
    }
  };

  const body = () => {
    if (!listingId) {
      return (
        <DealEmptyState
          title="Choose a listing first"
          text="Open a listing and select “Make an Offer” to start a deal."
          action={{ href: "/marketplace/browse", label: "Browse Listings" }}
        />
      );
    }
    if (loading) return <DealRoomSkeleton />;
    if (!listing || !preview) {
      return (
        <DealEmptyState
          title="Listing unavailable"
          text={loadError ?? "This listing doesn't exist or has been removed."}
          action={{ href: "/marketplace/browse", label: "Browse Listings" }}
        />
      );
    }
    if (isOwnListing) {
      return (
        <DealEmptyState
          title="This is your listing"
          text="You can't make an offer on a listing you created."
          action={{ href: `/marketplace/listings/${listing._id}`, label: "View Listing" }}
        />
      );
    }
    if (listing.status && listing.status !== "active") {
      return (
        <DealEmptyState
          title="Listing not available"
          text="This listing isn't accepting offers right now."
          action={{ href: "/marketplace/browse", label: "Browse Listings" }}
        />
      );
    }

    return (
      <>
        <DealFilmHeader deal={preview} />
        <OfferComparison
          currentCents={listPriceCents}
          counterCents={offerCents === undefined ? initialTerms.amountCents : offerCents}
          currentLabel="Listed Price"
          counterLabel="Your Offer"
        />
        <DealTermsForm
          key={listing._id}
          initialTerms={initialTerms}
          title="Offer Terms"
          submitLabel="Send Offer"
          busy={submitting}
          onAmountChange={setOfferCents}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          footnote="No payment is taken until both sides agree on terms."
        />
      </>
    );
  };

  return (
    <MarketplaceLayout>
      <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
        <DealPageHeader title="Make an Offer" subtitle="Propose your terms and negotiate directly with the creator." />
        {body()}
      </div>
    </MarketplaceLayout>
  );
}
