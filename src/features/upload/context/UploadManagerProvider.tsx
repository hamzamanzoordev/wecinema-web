"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AppError } from "@/features/auth/services/apiClient";
import * as draftsApi from "@/features/upload/api/drafts";
import {
  MultipartUploader, type UploaderSnapshot, type UploaderState,
} from "@/features/upload/engine/multipartUploader";
import { uploadStore, type StoredUploadJob } from "@/features/upload/engine/uploadStore";

/**
 * App-wide upload manager. Mounted in Providers, so uploads keep running while
 * the creator browses anywhere, and the header avatar can show their progress.
 *
 * Each job is backed by a server draft (created before the first byte moves)
 * and an IndexedDB row holding the File, so a reload resumes where it left off.
 */

export const VIDEO_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export type UploadJobState = UploaderState | "needs-file";

export interface UploadJob {
  draftId: string;
  /** The user who started it. Jobs are only shown while that user is signed in. */
  owner: string;
  fileName: string;
  totalBytes: number;
  loadedBytes: number;
  state: UploadJobState;
  speedBps: number;
  etaSec: number | null;
  retrying: boolean;
  error: string | null;
}

export type UploadRingState = "idle" | "active" | "waiting" | "done";

interface UploadManagerValue {
  jobs: UploadJob[];
  /** Create the draft and start uploading. Resolves to the draft id. */
  startUpload: (file: File) => Promise<string>;
  /** Supply the file again for an upload whose stored copy was unavailable. */
  resumeWithFile: (draftId: string, file: File) => Promise<void>;
  pause: (draftId: string) => void;
  resume: (draftId: string) => void;
  /** Stop the upload and delete its draft. */
  cancel: (draftId: string) => Promise<void>;
  /** Forget a finished job (it stays a draft on the server). */
  dismiss: (draftId: string) => void;
  getJob: (draftId: string) => UploadJob | undefined;
  /** The local File, when this browser still has it — for instant previews. */
  getFile: (draftId: string) => File | undefined;
  totalProgress: number;
  activeCount: number;
  ringState: UploadRingState;
}

const NOOP_VALUE: UploadManagerValue = {
  jobs: [],
  startUpload: () => Promise.reject(new Error("Uploads are unavailable")),
  resumeWithFile: () => Promise.reject(new Error("Uploads are unavailable")),
  pause: () => {},
  resume: () => {},
  cancel: () => Promise.resolve(),
  dismiss: () => {},
  getJob: () => undefined,
  getFile: () => undefined,
  totalProgress: 0,
  activeCount: 0,
  ringState: "idle",
};

const UploadManagerContext = createContext<UploadManagerValue>(NOOP_VALUE);

export const useUploads = () => useContext(UploadManagerContext);

const ACTIVE_STATES = new Set<UploadJobState>(["preparing", "uploading", "completing"]);
const WAITING_STATES = new Set<UploadJobState>(["paused", "offline", "needs-auth", "needs-file"]);
const DONE_FLASH_MS = 3000;

export const isJobInProgress = (state: UploadJobState) => ACTIVE_STATES.has(state) || WAITING_STATES.has(state);

const uploaderApi = {
  listParts: draftsApi.listParts,
  signParts: draftsApi.signParts,
  complete: draftsApi.completeUpload,
};

function readDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (value?: number) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => done(undefined), 3000);
    el.preload = "metadata";
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : undefined);
    el.onerror = () => done(undefined);
    el.src = url;
  });
}

export function sameFile(file: File, expected: { name: string; size: number; lastModified?: number }) {
  return (
    file.name === expected.name &&
    file.size === expected.size &&
    (expected.lastModified == null || file.lastModified === expected.lastModified)
  );
}

export function UploadManagerProvider({ children }: { children: ReactNode }) {
  const { authUser, status } = useAuth();
  const userId = status === "authenticated" ? authUser?._id ?? null : null;

  const [jobs, setJobs] = useState<Record<string, UploadJob>>({});
  const [doneFlash, setDoneFlash] = useState(false);

  const uploaders = useRef(new Map<string, MultipartUploader>());
  const files = useRef(new Map<string, File>());
  const pending = useRef(new Map<string, Partial<UploadJob>>());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredFor = useRef<string | null>(null);

  // Progress events arrive many times a second; batch them into ~4 renders/s.
  const patchJob = useCallback((draftId: string, patch: Partial<UploadJob>, immediate = false) => {
    pending.current.set(draftId, { ...pending.current.get(draftId), ...patch });
    const flush = () => {
      flushTimer.current = null;
      const batch = pending.current;
      pending.current = new Map();
      setJobs((prev) => {
        const next = { ...prev };
        for (const [id, p] of batch) if (next[id]) next[id] = { ...next[id]!, ...p };
        return next;
      });
    };
    if (immediate) {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flush();
    } else if (!flushTimer.current) {
      flushTimer.current = setTimeout(flush, 250);
    }
  }, []);

  const handleFinished = useCallback((draftId: string, fileName: string) => {
    void uploadStore.deleteJob(draftId);
    setDoneFlash(true);
    toast.success(
      <span>
        <strong>{fileName}</strong> uploaded, ready to publish.{" "}
        <Link href={`/upload/video/${draftId}`} style={{ color: "var(--color-accent-primary)", fontWeight: 600 }}>
          Edit details
        </Link>
      </span>,
      { duration: 6000 },
    );
  }, []);

  const attach = useCallback((draftId: string, file: File, partSize: number) => {
    uploaders.current.get(draftId)?.dispose();
    files.current.set(draftId, file);

    let lastState: UploaderState | null = null;
    const uploader = new MultipartUploader({
      draftId,
      file,
      partSize,
      api: uploaderApi,
      onChange: (s: UploaderSnapshot) => {
        const changed = s.state !== lastState;
        lastState = s.state;
        patchJob(draftId, {
          state: s.state,
          loadedBytes: s.loadedBytes,
          totalBytes: s.totalBytes,
          speedBps: s.speedBps,
          etaSec: s.etaSec,
          retrying: s.retrying,
          error: s.error,
        }, changed);
        if (changed && s.state === "completed") handleFinished(draftId, file.name);
        if (changed && s.state === "failed") toast.error(s.error ?? `Upload of ${file.name} failed`);
      },
    });
    uploaders.current.set(draftId, uploader);
    void uploader.start();
    return uploader;
  }, [patchJob, handleFinished]);

  const addJob = useCallback((job: UploadJob) => {
    setJobs((prev) => ({ ...prev, [job.draftId]: job }));
  }, []);

  const blankJob = (
    owner: string, draftId: string, fileName: string, totalBytes: number, state: UploadJobState,
  ): UploadJob => ({
    draftId, owner, fileName, totalBytes, loadedBytes: 0, state,
    speedBps: 0, etaSec: null, retrying: false, error: null,
  });

  // ── Start ────────────────────────────────────────────────────

  const startUpload = useCallback(async (file: File) => {
    if (!userId) throw new Error("Sign in to upload");
    if (!file.type.startsWith("video/")) throw new Error("Please choose a video file");
    if (file.size > VIDEO_MAX_BYTES) throw new Error("Video must be under 2 GB");

    const duration = await readDuration(file);
    const draft = await draftsApi.createDraft({
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      ...(duration ? { duration } : {}),
    });

    const stored: StoredUploadJob = {
      draftId: draft._id,
      userId,
      fileName: file.name,
      size: file.size,
      lastModified: file.lastModified,
      type: file.type,
      file,
      createdAt: Date.now(),
    };
    // Don't hold the navigation to the editor for a large IndexedDB write.
    void uploadStore.putJob(stored);

    addJob(blankJob(userId, draft._id, file.name, file.size, "preparing"));
    attach(draft._id, file, draft.upload.partSize);
    return draft._id;
  }, [userId, addJob, attach]);

  const resumeWithFile = useCallback(async (draftId: string, file: File) => {
    if (!userId) throw new Error("Sign in to continue uploading");
    const draft = await draftsApi.getDraft(draftId);
    if (draft.upload.state !== "uploading") {
      throw new Error(draft.upload.state === "uploaded" ? "This upload already finished" : "This upload expired");
    }
    if (!sameFile(file, { name: draft.upload.fileName ?? "", size: draft.upload.fileSize ?? -1 })) {
      throw new Error(`Choose the same file you started with: ${draft.upload.fileName}`);
    }
    void uploadStore.putJob({
      draftId, userId, fileName: file.name, size: file.size, lastModified: file.lastModified,
      type: file.type, file, createdAt: Date.now(),
    });
    addJob(blankJob(userId, draftId, file.name, file.size, "preparing"));
    attach(draftId, file, draft.upload.partSize);
  }, [userId, addJob, attach]);

  // ── Controls ─────────────────────────────────────────────────

  const pause = useCallback((draftId: string) => uploaders.current.get(draftId)?.pause(), []);
  const resume = useCallback((draftId: string) => uploaders.current.get(draftId)?.resume(), []);

  const forget = useCallback((draftId: string) => {
    uploaders.current.get(draftId)?.dispose();
    uploaders.current.delete(draftId);
    files.current.delete(draftId);
    setJobs((prev) => {
      const next = { ...prev };
      delete next[draftId];
      return next;
    });
  }, []);

  const cancel = useCallback(async (draftId: string) => {
    uploaders.current.get(draftId)?.cancel();
    forget(draftId);
    await Promise.all([uploadStore.deleteJob(draftId), uploadStore.deleteForm(draftId)]);
    try {
      await draftsApi.deleteDraft(draftId);
    } catch (err) {
      if (!(err instanceof AppError && err.status === 404)) throw err;
    }
  }, [forget]);

  const dismiss = forget;

  // ── Restore after reload / sign-in; park on sign-out ─────────

  useEffect(() => {
    if (status === "loading") return;

    if (!userId) {
      // Signed out (or the session could not be refreshed). Stop quietly —
      // the uploads resume from IndexedDB after the next sign-in. Their jobs
      // stay in state but are filtered out of view by owner.
      for (const uploader of uploaders.current.values()) uploader.dispose();
      uploaders.current.clear();
      files.current.clear();
      restoredFor.current = null;
      return;
    }

    // Uploads parked on a 401 carry on with the new session.
    for (const uploader of uploaders.current.values()) {
      if (uploader.state === "needs-auth") uploader.resume();
    }

    if (restoredFor.current === userId) return;
    restoredFor.current = userId;

    let cancelled = false;
    (async () => {
      const stored = await uploadStore.listJobs(userId);
      for (const job of stored) {
        if (cancelled || uploaders.current.has(job.draftId)) continue;
        let draft: draftsApi.VideoDraft;
        try {
          draft = await draftsApi.getDraft(job.draftId);
        } catch (err) {
          if (err instanceof AppError && err.status === 404) void uploadStore.deleteJob(job.draftId);
          continue;
        }
        if (cancelled) return;
        if (draft.upload.state !== "uploading") {
          void uploadStore.deleteJob(job.draftId);
          continue;
        }
        if (job.file) {
          addJob(blankJob(userId, job.draftId, job.fileName, job.size, "preparing"));
          attach(job.draftId, job.file, draft.upload.partSize);
        } else {
          addJob(blankJob(userId, job.draftId, job.fileName, job.size, "needs-file"));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [status, userId, addJob, attach]);

  useEffect(() => () => {
    for (const uploader of uploaders.current.values()) uploader.dispose();
  }, []);

  // ── Derived ──────────────────────────────────────────────────

  const jobList = useMemo(
    () => (userId ? Object.values(jobs).filter((j) => j.owner === userId) : []),
    [jobs, userId],
  );
  const inProgress = jobList.filter((j) => isJobInProgress(j.state));
  const activeCount = inProgress.length;
  const totalBytes = inProgress.reduce((a, j) => a + j.totalBytes, 0);
  const totalProgress = totalBytes > 0 ? (inProgress.reduce((a, j) => a + j.loadedBytes, 0) / totalBytes) * 100 : 0;
  const anyActive = inProgress.some((j) => ACTIVE_STATES.has(j.state));

  useEffect(() => {
    if (!doneFlash) return;
    const t = setTimeout(() => setDoneFlash(false), DONE_FLASH_MS);
    return () => clearTimeout(t);
  }, [doneFlash]);

  const ringState: UploadRingState =
    activeCount > 0 ? (anyActive ? "active" : "waiting") : doneFlash ? "done" : "idle";

  // Closing the tab mid-upload loses only the in-flight parts, but say so.
  useEffect(() => {
    if (!anyActive) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Upload in progress. It will resume when you come back.";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyActive]);

  const getJob = useCallback(
    (draftId: string) => (jobs[draftId]?.owner === userId ? jobs[draftId] : undefined),
    [jobs, userId],
  );
  const getFile = useCallback((draftId: string) => files.current.get(draftId), []);

  const value = useMemo<UploadManagerValue>(() => ({
    jobs: jobList,
    startUpload,
    resumeWithFile,
    pause,
    resume,
    cancel,
    dismiss,
    getJob,
    getFile,
    totalProgress,
    activeCount,
    ringState,
  }), [jobList, startUpload, resumeWithFile, pause, resume, cancel, dismiss, getJob, getFile, totalProgress, activeCount, ringState]);

  return <UploadManagerContext.Provider value={value}>{children}</UploadManagerContext.Provider>;
}
