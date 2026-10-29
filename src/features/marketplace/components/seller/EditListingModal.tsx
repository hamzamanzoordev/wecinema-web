"use client";
// src/components/marketplace/seller/EditListingModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';

interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  type?: string;
  category?: string;
  tags?: string[];
  mediaUrls?: string[];
  status: string;
}

export interface EditListingData {
  title: string;
  description: string;
  price: number;
  mediaFiles?: File[];
}

interface EditListingModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditListingData) => void;
  loading: boolean;
}

interface FileEntry {
  file: File;
  previewUrl: string;
}

const MAX_FILES = 5;

const EditListingModal: React.FC<EditListingModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSave,
  loading
}) => {
  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description,
    price: listing.price.toString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newFiles, setNewFiles] = useState<FileEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: listing.title,
        description: listing.description,
        price: listing.price.toString(),
      });
      setErrors({});
      setNewFiles([]);
    }
  }, [listing, isOpen]);

  // Revoke object URLs on unmount / modal close
  useEffect(() => {
    if (!isOpen) {
      newFiles.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    }
  }, [isOpen]); // eslint-disable-line

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    setNewFiles((prev) => {
      const slots = MAX_FILES - prev.length;
      if (slots <= 0) return prev;
      const added = files.slice(0, slots).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...added];
    });
  }, []);

  const removeNewFile = useCallback((index: number) => {
    setNewFiles((prev) => {
      URL.revokeObjectURL(prev[index]?.previewUrl ?? '');
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ''; }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        newErrors.price = 'Price must be a valid number greater than 0';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave({
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      ...(newFiles.length && { mediaFiles: newFiles.map((e) => e.file) }),
    });
  };

  if (!isOpen) return null;

  const inputBase = 'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all bg-input-bg text-text-primary placeholder-text-tertiary';
  const inputError = 'border-danger/30 bg-danger-bg';
  const inputNormal = 'border-border hover:border-border';

  const existingMedia = listing.mediaUrls ?? [];

  return (
    <div
      className="mp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-listing-modal-title"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="mp-modal" style={{ maxWidth: '520px' }}>

        {/* Header */}
        <div className="mp-modal-header">
          <div>
            <h3 id="edit-listing-modal-title" className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)' }}>
              Edit Listing
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Update your listing details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mp-btn mp-btn-ghost mp-btn-sm !rounded-full !p-0 w-8 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="mp-modal-body">
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Listing Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`${inputBase} ${errors.title ? inputError : inputNormal}`}
                    placeholder="Enter a catchy title for your listing"
                  />
                  {errors.title ? (
                    <p className="mt-2 text-sm text-danger flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.title}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-text-tertiary">Make it descriptive and attractive</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className={`${inputBase} ${errors.description ? inputError : inputNormal}`}
                    placeholder="Describe your listing in detail..."
                  />
                  {errors.description ? (
                    <p className="mt-2 text-sm text-danger flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.description}
                    </p>
                  ) : (
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-text-tertiary">Describe what you're offering</p>
                      <p className={`text-xs ${
                        formData.description.length < 10 ? 'text-danger' :
                        formData.description.length < 50 ? 'text-warning' :
                        'text-success'
                      }`}>
                        {formData.description.length} characters
                      </p>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-text-tertiary">$</span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`${inputBase} pl-10 ${errors.price ? inputError : inputNormal}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price ? (
                    <p className="mt-2 text-sm text-danger flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.price}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-text-tertiary">Enter the price in USD</p>
                  )}
                </div>

                {/* Media section */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Media Files
                  </label>

                  {/* Existing media preview */}
                  {existingMedia.length > 0 && newFiles.length === 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-text-tertiary mb-2">Current media ({existingMedia.length} file{existingMedia.length !== 1 ? 's' : ''})</p>
                      <div className="flex flex-wrap gap-2">
                        {existingMedia.map((url, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-bg-secondary flex-shrink-0">
                            <img
                              src={url}
                              alt={`Media ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New files selected */}
                  {newFiles.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs text-warning">New media will replace existing files on save.</p>
                      {newFiles.map((entry, index) => (
                        <div
                          key={entry.previewUrl}
                          className="flex items-center gap-2 bg-bg-secondary border border-border rounded-lg px-3 py-2"
                        >
                          {entry.file.type.startsWith('image/') ? (
                            <img src={entry.previewUrl} alt={entry.file.name} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-bg-tertiary rounded flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{entry.file.name}</p>
                            <p className="text-xs text-text-tertiary">{(entry.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewFile(index)}
                            disabled={loading}
                            className="text-text-tertiary hover:text-danger transition-colors flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File picker */}
                  {newFiles.length < MAX_FILES && (
                    <label
                      htmlFor="edit-media-upload"
                      className="flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-xl bg-bg-secondary hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer text-sm text-text-secondary hover:text-accent"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {existingMedia.length > 0 && newFiles.length === 0
                        ? 'Replace media files…'
                        : `Add files (${newFiles.length}/${MAX_FILES})`}
                      <input
                        id="edit-media-upload"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        className="sr-only"
                      />
                    </label>
                  )}
                  <p className="mt-1 text-xs text-text-tertiary">Images &amp; videos, up to {MAX_FILES} files. Uploading new files replaces existing media.</p>
                </div>
              </div>
          </div>

          {/* Footer */}
          <div className="mp-modal-footer justify-between">
            <p className="text-xs hidden sm:block" style={{ color: 'var(--color-text-tertiary)' }}>
              * required
            </p>
            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mp-btn mp-btn-secondary flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="mp-btn mp-btn-primary flex-1 sm:flex-none"
              >
                {loading ? (
                  <>
                    <FiLoader size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <FiCheck size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditListingModal;
