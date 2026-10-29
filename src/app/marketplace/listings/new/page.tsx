"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiDollarSign,
  FiFolder,
  FiLoader,
  FiTag,
  FiType,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import { createListing } from '@/features/marketplace/api/marketplace.service';
import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import type { CreateListingPayload, ListingType } from '@/types/marketplace.types';
import { trackListingCreated } from '@/lib/analytics/track';

// ─── Constants ────────────────────────────────────────────────

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'for_sale',          label: 'For Sale' },
  { value: 'commission',        label: 'Commission' },
  { value: 'adaptation_rights', label: 'Adaptation Rights' },
  { value: 'licensing',         label: 'License' },
];

const MAX_FILES    = 5;
const MAX_TAGS     = 10;
const MAX_DESC_LEN = 1000;

// ─── Types ────────────────────────────────────────────────────

interface FileEntry {
  file: File;
  previewUrl: string;
}

type FormErrors = Partial<Record<'title' | 'description' | 'price' | 'type' | 'media', string>>;

// ─── Shared class fragments ───────────────────────────────────

const INPUT_BASE =
  'w-full px-4 py-3 rounded-lg text-sm border outline-none transition-colors theme-transition ' +
  'bg-input-bg border-input-border text-text-primary placeholder:text-text-tertiary ' +
  'focus:ring-2 focus:ring-accent/40 focus:border-input-focus';

const INPUT_ERROR = 'border-danger bg-danger-bg';

// ─── Component ────────────────────────────────────────────────

const CreateListing: React.FC = () => {
  const router = useRouter();
  // UploadProgressContext stub (not in wecinema-web — using local state instead)
  const [uploadProgress, setUploadProgress] = useState(0);
  const startUpload = (_name?: string, _opts?: Record<string, string>) => {};
  const updateProgress = setUploadProgress;
  const finishUpload = () => {};

  // ── Form fields ──
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [price,       setPrice]       = useState('');
  const [type,        setType]        = useState<ListingType>('for_sale');
  const [category,    setCategory]    = useState('');
  const [tags,        setTags]        = useState<string[]>([]);
  const [tagInput,    setTagInput]    = useState('');

  // ── File upload ──
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Thumbnail ──
  const [thumbnailEntry, setThumbnailEntry] = useState<FileEntry | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // ── UI state ──
  const [errors,     setErrors]     = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      fileEntries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
      if (thumbnailEntry) URL.revokeObjectURL(thumbnailEntry.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation ───────────────────────────────────────────────

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!title.trim())                next.title = 'Title is required.';
    else if (title.trim().length < 5) next.title = 'Title must be at least 5 characters.';
    if (description.length > MAX_DESC_LEN)
      next.description = `Must be ${MAX_DESC_LEN} characters or fewer.`;
    const num = parseFloat(price);
    if (!price)                         next.price = 'Price is required.';
    else if (isNaN(num) || num < 0.5)   next.price = 'Minimum price is $0.50.';
    else if (num > 100_000)             next.price = 'Maximum price is $100,000.';
    if (!type)                          next.type = 'Select a listing type.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearError = useCallback((field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // ── File handling ─────────────────────────────────────────────

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    setFileEntries((prev) => {
      const slots = MAX_FILES - prev.length;
      if (slots <= 0) return prev;
      const added = files.slice(0, slots).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...added];
    });
    clearError('media');
  }, [clearError]);

  const removeFile = useCallback((index: number) => {
    setFileEntries((prev) => {
      URL.revokeObjectURL(prev[index]?.previewUrl ?? '');
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ''; }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbnailEntry) URL.revokeObjectURL(thumbnailEntry.previewUrl);
    setThumbnailEntry({ file, previewUrl: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const removeThumbnail = () => {
    if (thumbnailEntry) URL.revokeObjectURL(thumbnailEntry.previewUrl);
    setThumbnailEntry(null);
  };

  // ── Tag handling ──────────────────────────────────────────────

  const commitTag = useCallback(() => {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    setTags((prev) => [...prev, tag]);
    setTagInput('');
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitTag(); }
  };

  // ── Submit ────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (submitting) return;

    const payload: CreateListingPayload = {
      title:       title.trim(),
      description: description.trim(),
      price:       parseFloat(price),
      type,
      ...(category.trim()    && { category: category.trim() }),
      ...(tags.length        && { tags }),
      ...(fileEntries.length && { mediaFiles: fileEntries.map((e) => e.file) }),
      ...(thumbnailEntry     && { thumbnailFile: thumbnailEntry.file }),
    };

    const hasFiles = fileEntries.length > 0 || !!thumbnailEntry;
    const barName  = thumbnailEntry?.file.name ?? fileEntries[0]?.file.name ?? title.trim();

    if (hasFiles) {
      // Start global bar and navigate away — upload continues in background
      startUpload(barName, {
        uploadingLabel: 'Uploading listing…',
        doneLabel: 'Listing created successfully',
      });
      router.push('/marketplace');

      createListing(payload, updateProgress)
        .then(() => {
          trackListingCreated({ type: payload.type, price: payload.price });
          window.dispatchEvent(new CustomEvent('listing-created'));
          finishUpload();
        })
        .catch(() => {
          finishUpload();
        });
    } else {
      // No files — fast JSON request, wait for it
      setSubmitting(true);
      setSubmitError('');

      createListing(payload)
        .then(() => {
          trackListingCreated({ type: payload.type, price: payload.price });
          router.push('/marketplace');
        })
        .catch((err: unknown) => {
          setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
          setSubmitting(false);
        });
    }
  };

  // ── Derived ───────────────────────────────────────────────────

  const isBusy      = submitting;
  const submitLabel = submitting ? 'Creating listing…' : 'Create Listing';

  // ─────────────────────────────────────────────────────────────
  return (
    <MarketplaceLayout>
      <div className="bg-bg-secondary theme-transition py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back nav */}
          <button
            type="button"
            onClick={() => router.push('/marketplace')}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 text-sm font-medium transition-colors theme-transition"
          >
            <FiArrowLeft size={18} aria-hidden="true" />
            Back to Marketplace
          </button>

          <div className="bg-card-bg border border-card-border rounded-2xl shadow-md theme-transition p-8">

            {/* Page header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-text-primary mb-2 theme-transition">
                Create New Listing
              </h1>
              <p className="text-text-secondary text-base theme-transition">
                Sell your digital content to the community
              </p>
            </div>

            {/* Global error banner */}
            {submitError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 bg-danger-bg border border-danger/30 rounded-lg p-4 theme-transition"
              >
                <FiAlertCircle className="text-danger shrink-0 mt-0.5" size={18} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-danger">Could not create listing</p>
                  <p className="text-sm text-danger/80 mt-0.5">{submitError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError('')}
                  aria-label="Dismiss error"
                  className="text-danger/60 hover:text-danger transition-colors shrink-0"
                >
                  <FiX size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">

              {/* ── Basic Information ─────────────────────── */}
              <section className="bg-bg-secondary border border-border rounded-xl p-6 theme-transition">
                <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-3 theme-transition">
                  <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FiType className="text-accent" size={16} aria-hidden="true" />
                  </span>
                  Basic Information
                </h2>

                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label
                      htmlFor="listing-title"
                      className="block text-sm font-medium text-text-secondary mb-1.5 theme-transition"
                    >
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      id="listing-title"
                      type="text"
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
                      maxLength={120}
                      placeholder="Enter a compelling title for your listing…"
                      className={`${INPUT_BASE} ${errors.title ? INPUT_ERROR : ''}`}
                    />
                    {errors.title && (
                      <p role="alert" className="text-danger text-xs mt-1.5">{errors.title}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="listing-description"
                      className="block text-sm font-medium text-text-secondary mb-1.5 theme-transition"
                    >
                      Description
                    </label>
                    <textarea
                      id="listing-description"
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); clearError('description'); }}
                      rows={4}
                      maxLength={MAX_DESC_LEN}
                      placeholder="Describe your content in detail. What makes it unique?"
                      className={`${INPUT_BASE} resize-none ${errors.description ? INPUT_ERROR : ''}`}
                    />
                    <div className="flex justify-between items-center mt-1.5">
                      {errors.description
                        ? <p role="alert" className="text-danger text-xs">{errors.description}</p>
                        : <span />
                      }
                      <p className={`text-xs ml-auto ${description.length > MAX_DESC_LEN * 0.9 ? 'text-warning' : 'text-text-tertiary'} theme-transition`}>
                        {description.length} / {MAX_DESC_LEN}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Pricing & Type ────────────────────────── */}
              <section className="bg-bg-secondary border border-border rounded-xl p-6 theme-transition">
                <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-3 theme-transition">
                  <span className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <FiDollarSign className="text-success" size={16} aria-hidden="true" />
                  </span>
                  Pricing &amp; Type
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Price */}
                  <div>
                    <label
                      htmlFor="listing-price"
                      className="block text-sm font-medium text-text-secondary mb-1.5 theme-transition"
                    >
                      Price (USD) <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm select-none pointer-events-none theme-transition">
                        $
                      </span>
                      <input
                        id="listing-price"
                        type="number"
                        value={price}
                        onChange={(e) => { setPrice(e.target.value); clearError('price'); }}
                        min="0.50"
                        max="100000"
                        step="0.01"
                        placeholder="0.00"
                        className={`${INPUT_BASE} pl-8 ${errors.price ? INPUT_ERROR : ''}`}
                      />
                    </div>
                    {errors.price && (
                      <p role="alert" className="text-danger text-xs mt-1.5">{errors.price}</p>
                    )}
                  </div>

                  {/* Type */}
                  <div>
                    <label
                      htmlFor="listing-type"
                      className="block text-sm font-medium text-text-secondary mb-1.5 theme-transition"
                    >
                      Listing Type <span className="text-danger">*</span>
                    </label>
                    <select
                      id="listing-type"
                      value={type}
                      onChange={(e) => { setType(e.target.value as ListingType); clearError('type'); }}
                      className={`${INPUT_BASE} ${errors.type ? INPUT_ERROR : ''}`}
                    >
                      {LISTING_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {errors.type && (
                      <p role="alert" className="text-danger text-xs mt-1.5">{errors.type}</p>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="mt-5">
                  <label
                    htmlFor="listing-category"
                    className="block text-sm font-medium text-text-secondary mb-1.5 theme-transition"
                  >
                    Category{' '}
                    <span className="text-text-tertiary font-normal theme-transition">(optional)</span>
                  </label>
                  <input
                    id="listing-category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Video Production, Script Writing, Music Composition"
                    className={INPUT_BASE}
                  />
                </div>
              </section>

              {/* ── Tags ──────────────────────────────────── */}
              <section className="bg-bg-secondary border border-border rounded-xl p-6 theme-transition">
                <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-3 theme-transition">
                  <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FiTag className="text-accent" size={16} aria-hidden="true" />
                  </span>
                  Tags &amp; Keywords
                  <span className="ml-auto text-sm font-normal text-text-tertiary theme-transition">
                    {tags.length} / {MAX_TAGS}
                  </span>
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      disabled={tags.length >= MAX_TAGS}
                      placeholder={
                        tags.length >= MAX_TAGS
                          ? 'Maximum tags reached'
                          : 'Type a tag and press Enter…'
                      }
                      className={`flex-1 ${INPUT_BASE} disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    <button
                      type="button"
                      onClick={commitTag}
                      disabled={!tagInput.trim() || tags.length >= MAX_TAGS}
                      className="px-5 py-3 rounded-lg text-sm font-medium bg-btn-secondary-bg text-btn-secondary-text hover:bg-btn-secondary-hover border border-border transition-colors theme-transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium theme-transition"
                        >
                          <FiTag size={11} aria-hidden="true" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            aria-label={`Remove tag "${tag}"`}
                            className="hover:text-accent/70 ml-0.5 transition-colors"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* ── Thumbnail ─────────────────────────────── */}
              <section className="bg-bg-secondary border border-border rounded-xl p-6 theme-transition">
                <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-3 theme-transition">
                  <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FiUpload className="text-accent" size={16} aria-hidden="true" />
                  </span>
                  Thumbnail
                  <span className="ml-auto text-sm font-normal text-text-tertiary theme-transition">
                    optional
                  </span>
                </h2>

                {thumbnailEntry ? (
                  <div className="flex items-center gap-4 bg-card-bg border border-card-border rounded-xl px-4 py-3 theme-transition">
                    <img
                      src={thumbnailEntry.previewUrl}
                      alt="Thumbnail preview"
                      className="w-20 h-14 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate theme-transition">
                        {thumbnailEntry.file.name}
                      </p>
                      <p className="text-xs text-text-tertiary theme-transition">
                        {(thumbnailEntry.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      disabled={isBusy}
                      aria-label="Remove thumbnail"
                      className="text-text-tertiary hover:text-danger transition-colors disabled:opacity-40 shrink-0 theme-transition"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="thumbnail-upload"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-bg-primary hover:border-accent hover:bg-accent/5 transition-colors theme-transition cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-bg-secondary group-hover:bg-accent/10 flex items-center justify-center mb-2 transition-colors theme-transition">
                      <FiUpload className="text-text-tertiary group-hover:text-accent transition-colors" size={20} aria-hidden="true" />
                    </div>
                    <p className="text-text-primary font-medium text-sm mb-1 theme-transition">
                      Click to upload thumbnail
                    </p>
                    <p className="text-text-tertiary text-xs theme-transition">
                      Any image, auto-converted to WebP on upload
                    </p>
                    <input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      ref={thumbnailInputRef}
                      className="sr-only"
                    />
                  </label>
                )}
              </section>

              {/* ── Media Files ───────────────────────────── */}
              <section className="bg-bg-secondary border border-border rounded-xl p-6 theme-transition">
                <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-3 theme-transition">
                  <span className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <FiUpload className="text-warning" size={16} aria-hidden="true" />
                  </span>
                  Media Files
                  <span className="ml-auto text-sm font-normal text-text-tertiary theme-transition">
                    {fileEntries.length} / {MAX_FILES}
                  </span>
                </h2>

                {/* Drop zone */}
                {fileEntries.length < MAX_FILES && (
                  <label
                    htmlFor="media-upload"
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-bg-primary hover:border-accent hover:bg-accent/5 transition-colors theme-transition cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-full bg-bg-secondary group-hover:bg-accent/10 flex items-center justify-center mb-3 transition-colors theme-transition">
                      <FiUpload className="text-text-tertiary group-hover:text-accent transition-colors" size={24} aria-hidden="true" />
                    </div>
                    <p className="text-text-primary font-medium text-sm mb-1 theme-transition">
                      Click to upload files
                    </p>
                    <p className="text-text-tertiary text-xs theme-transition">
                      Images &amp; videos, up to {MAX_FILES} files
                    </p>
                    <input
                      id="media-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileInputChange}
                      ref={fileInputRef}
                      className="sr-only"
                    />
                  </label>
                )}

                {errors.media && (
                  <p role="alert" className="text-danger text-xs mt-2">{errors.media}</p>
                )}

                {/* File list */}
                {fileEntries.length > 0 && (
                  <ul className="mt-4 space-y-2.5">
                    {fileEntries.map((entry, index) => (
                      <li
                        key={entry.previewUrl}
                        className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl px-4 py-3 theme-transition"
                      >
                        {/* Thumbnail */}
                        {entry.file.type.startsWith('image/') ? (
                          <img
                            src={entry.previewUrl}
                            alt={entry.file.name}
                            className="w-12 h-12 object-cover rounded-lg shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-bg-secondary rounded-lg flex items-center justify-center shrink-0 theme-transition">
                            <FiFolder className="text-text-tertiary" size={20} aria-hidden="true" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate theme-transition">
                            {entry.file.name}
                          </p>
                          <p className="text-xs text-text-tertiary theme-transition">
                            {(entry.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={isBusy}
                          aria-label={`Remove ${entry.file.name}`}
                          className="text-text-tertiary hover:text-danger transition-colors disabled:opacity-40 shrink-0 theme-transition"
                        >
                          <FiX size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Actions ───────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-border theme-transition">
                <button
                  type="button"
                  onClick={() => router.push('/marketplace')}
                  disabled={isBusy}
                  className="px-8 py-3 rounded-lg text-sm font-medium border border-border bg-btn-secondary-bg text-btn-secondary-text hover:bg-btn-secondary-hover focus:ring-2 focus:ring-accent/40 outline-none transition-colors theme-transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-8 py-3 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover disabled:bg-text-tertiary text-btn-primary-text focus:ring-2 focus:ring-accent/40 outline-none transition-colors theme-transition disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
                >
                  {isBusy ? (
                    <>
                      <FiLoader className="animate-spin" size={15} aria-hidden="true" />
                      {submitLabel}
                    </>
                  ) : (
                    <>
                      <FiUpload size={15} aria-hidden="true" />
                      Create Listing
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default CreateListing;
