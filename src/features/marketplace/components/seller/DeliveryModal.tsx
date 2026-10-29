"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FiCheck, FiInfo, FiLoader, FiX } from 'react-icons/fi';
import { toast } from '@/lib/toast';

// ─── Types ────────────────────────────────────────────────────

interface DeliveryOrder {
  _id:           string;
  orderNumber:   string;
  status:        string;
  listingId:     { title: string } | string;
  buyerId:       { username: string; email?: string };
  revisions?:    number;
  maxRevisions?: number;
  buyerNotes?:   string;
  requirements?: string;
}

interface DeliveryData {
  orderId:       string;
  message:       string;
  attachments:   File[];
  isFinal:       boolean;
  revisionsLeft?: number;
}

interface DeliveryModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  order:         DeliveryOrder;
  onDeliver:     (data: DeliveryData) => Promise<void>;
  isLoading?:    boolean;
  validateFile?: (file: File) => string | null;
}

// ─── Pure helpers ─────────────────────────────────────────────

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
  'mp4', 'mov', 'avi', 'webm', 'mkv',
  'pdf', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'mp3', 'wav', 'ogg', 'm4a',
  'zip', 'rar', '7z',
]);

const ACCEPT_STRING = [...ALLOWED_EXTENSIONS].map(ext => `.${ext}`).join(',');

function defaultValidateFile(file: File): string | null {
  if (file.size > 100 * 1024 * 1024) return `"${file.name}" is too large (max 100MB)`;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) return `"${file.name}" has an unsupported file type`;
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileIcon(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼️';
  if (['mp4','mov','avi','webm','mkv'].includes(ext))       return '🎥';
  if (['mp3','wav','ogg','m4a'].includes(ext))              return '🎵';
  if (ext === 'pdf')                                         return '📄';
  if (['doc','docx','txt'].includes(ext))                   return '📝';
  if (['xls','xlsx','csv'].includes(ext))                   return '📊';
  if (['zip','rar','7z'].includes(ext))                     return '📦';
  return '📎';
}

function getListingTitle(order: DeliveryOrder): string {
  if (order.listingId && typeof order.listingId === 'object') {
    return order.listingId.title ?? `Order #${order.orderNumber}`;
  }
  return `Order #${order.orderNumber}`;
}

function getRevisionsRemaining(order: DeliveryOrder): number | null {
  if (order.maxRevisions !== undefined && order.revisions !== undefined) {
    return order.maxRevisions - order.revisions;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────

const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  order,
  onDeliver,
  isLoading = false,
  validateFile,
}) => {
  const [message,         setMessage]         = useState('');
  const [attachments,     setAttachments]     = useState<File[]>([]);
  const [isFinalDelivery, setIsFinalDelivery] = useState(true);
  const [errors,          setErrors]          = useState<{ message?: string; attachments?: string }>({});
  const [uploadProgress,  setUploadProgress]  = useState<number[]>([]);
  const [isUploading,     setIsUploading]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setAttachments([]);
      setErrors({});
      setUploadProgress([]);
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = validateFile ?? defaultValidateFile;

  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    const validationErrors: string[] = [];
    files.forEach(file => {
      const err = validate(file);
      if (err) validationErrors.push(err);
      else     validFiles.push(file);
    });
    if (validationErrors.length > 0) toast.error(`Validation failed: ${validationErrors.join(', ')}`);
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      setUploadProgress(prev => [...prev, ...Array(validFiles.length).fill(0)]);
      setErrors(prev => ({ ...prev, attachments: undefined }));
      toast.success(`Added ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  const removeAttachment = (index: number) => {
    const name = attachments[index]?.name ?? '';
    setAttachments(prev    => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
    toast(`Removed "${name}"`, { icon: 'ℹ️' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!message.trim())     newErrors.message     = 'Please add a delivery message';
    if (!attachments.length) newErrors.attachments = 'Please add at least one file';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please complete all required fields');
      return;
    }
    try {
      await onDeliver({
        orderId:      order._id,
        message:      message.trim(),
        attachments,
        isFinal:      isFinalDelivery,
        revisionsLeft: order.maxRevisions !== undefined && order.revisions !== undefined
          ? order.maxRevisions - order.revisions
          : undefined,
      });
      toast.success('Work delivered successfully! ✅');
    } catch (err: any) {
      setErrors(prev => ({ ...prev, message: err.message ?? 'Failed to deliver. Please try again.' }));
    }
  };

  const revisionsRemaining = getRevisionsRemaining(order);
  const listingTitle       = getListingTitle(order);
  const busy               = isLoading || isUploading;

  return (
    <div
      className="mp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-modal-title"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="mp-modal" style={{ maxWidth: '640px' }}>

        {/* ── Header ── */}
        <div className="mp-modal-header">
          <div className="flex-1 min-w-0">
            <h3 id="delivery-modal-title" className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)' }}>
              Deliver Work
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              To {order.buyerId?.username || order.buyerId?.email || 'buyer'} · Order #{order.orderNumber}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <p style={{ color: 'var(--color-text-tertiary)' }}>Listing</p>
                <p className="font-medium truncate mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{listingTitle}</p>
              </div>
              <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <p style={{ color: 'var(--color-text-tertiary)' }}>Revisions</p>
                <p className="font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {order.revisions ?? 0} / {order.maxRevisions ?? 3}
                  {revisionsRemaining !== null && revisionsRemaining > 0 && (
                    <span className="ml-1.5" style={{ color: 'var(--color-success)' }}>({revisionsRemaining} left)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="mp-btn mp-btn-ghost mp-btn-sm !rounded-full !p-0 w-8 h-8 self-start flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="mp-modal-body space-y-4">

            {/* Delivery message */}
            <div>
              <label className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}>
                Delivery Message <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                value={message}
                onChange={e => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors(prev => ({ ...prev, message: undefined }));
                }}
                placeholder={`Hi ${order.buyerId?.username || 'there'}, here's your delivery...`}
                rows={4}
                className="mp-textarea"
                style={errors.message ? { borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)' } : {}}
                disabled={busy}
              />
              {errors.message ? (
                <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>{errors.message}</p>
              ) : (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  Explain what you've delivered, include any instructions, and mention important files.
                </p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}>
                Attachments <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>

              {/* Drop zone */}
              <div
                className="rounded-xl p-6 text-center transition-colors"
                style={{
                  border: `2px dashed ${errors.attachments ? 'var(--color-danger)' : 'var(--color-border-primary)'}`,
                  backgroundColor: errors.attachments ? 'var(--color-danger-bg)' : 'var(--color-bg-secondary)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.6 : 1,
                }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={busy}
                  accept={ACCEPT_STRING}
                />
                <div className="text-3xl mb-2">📎</div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {isUploading ? 'Uploading files…' : 'Click or drag files here'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Images, Videos, Documents, Audio, Archives · up to 100MB each
                </p>
              </div>

              {errors.attachments && (
                <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>{errors.attachments}</p>
              )}

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Files to deliver ({attachments.length})
                  </p>
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-divider)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg flex-shrink-0">{getFileIcon(file)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{file.name}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="mp-btn mp-btn-ghost mp-btn-sm !p-0 w-7 h-7 !rounded-full flex-shrink-0"
                        disabled={busy}
                        aria-label={`Remove ${file.name}`}
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final delivery toggle */}
            <div className="p-4 rounded-xl"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-divider)' }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Final Delivery</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {isFinalDelivery
                      ? 'Mark as complete. Buyer can request revisions if available.'
                      : 'Mark as draft for review before final submission.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFinalDelivery(v => !v)}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  disabled={busy}
                  style={{ backgroundColor: isFinalDelivery ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)' }}
                  aria-pressed={isFinalDelivery}
                >
                  <span className="sr-only">Toggle final delivery</span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                      isFinalDelivery ? 'translate-x-5' : 'translate-x-0'
                    }`}
                    style={{ backgroundColor: '#fff' }}
                  />
                </button>
              </div>

              {revisionsRemaining !== null && (
                <div className="mt-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-divider)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="font-medium">Revisions:</span>{' '}
                      {order.revisions ?? 0} used, {revisionsRemaining} remaining
                    </p>
                    {revisionsRemaining === 0 && (
                      <p className="text-xs" style={{ color: 'var(--color-danger)' }}>No revisions left, final.</p>
                    )}
                    {revisionsRemaining > 0 && !isFinalDelivery && (
                      <span className="mp-badge mp-badge-warning text-[10px]">Draft</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Buyer notes */}
            {(order.buyerNotes || order.requirements) && (
              <div className="mp-alert mp-alert-info">
                <FiInfo size={15} className="flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">Order Details</p>
                  {order.requirements && (
                    <div>
                      <p className="text-xs font-medium opacity-75">Requirements:</p>
                      <p className="text-xs">{order.requirements}</p>
                    </div>
                  )}
                  {order.buyerNotes && (
                    <div>
                      <p className="text-xs font-medium opacity-75">Buyer Notes:</p>
                      <p className="text-xs">{order.buyerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="mp-modal-footer flex-col-reverse sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="mp-btn mp-btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !attachments.length || !message.trim()}
              className="mp-btn mp-btn-primary flex-1"
            >
              {busy ? (
                <>
                  <FiLoader size={15} className="animate-spin" />
                  {isUploading ? 'Uploading…' : 'Delivering…'}
                </>
              ) : (
                <>
                  <FiCheck size={15} />
                  Deliver Work
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default DeliveryModal;
