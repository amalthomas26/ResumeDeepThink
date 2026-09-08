import { useCallback, useRef, useState, type DragEvent } from 'react';
import { useCheckStore, selectFile, selectResumeType, selectError, selectPhase } from '../store/check-store';
import { useShallow } from 'zustand/react/shallow';

/**
 * Upload screen — minimal drag-and-drop onto the canvas.
 * Per design-and-wireframe.md: "No hero illustration, no marketing copy here."
 */
export function UploadScreen() {
  const file = useCheckStore(selectFile);
  const resumeType = useCheckStore(selectResumeType);
  const error = useCheckStore(selectError);
  const phase = useCheckStore(selectPhase);
  const { setFile, setResumeType, startCheck } = useCheckStore(
    useShallow((s) => ({
      setFile: s.setFile,
      setResumeType: s.setResumeType,
      startCheck: s.startCheck,
    })),
  );

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = phase === 'uploading';

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        setFile(droppedFile);
      }
    },
    [setFile],
  );

  const handleFileSelect = useCallback(() => {
    const input = fileInputRef.current;
    if (input?.files?.[0]) {
      setFile(input.files[0]);
    }
  }, [setFile]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      startCheck();
    },
    [startCheck],
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Minimal branding */}
        <div className="text-center mb-8">
          <span className="font-mono text-xs font-semibold text-ink-faint uppercase tracking-widest">
            ResumePro
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed
              transition-all duration-200
              ${isDragging
                ? 'drop-zone-active border-pine'
                : file
                  ? 'border-pine/40 bg-pine-light/30'
                  : 'border-border hover:border-ink-faint bg-paper'
              }
              ${isUploading ? 'pointer-events-none opacity-70' : ''}
              px-8 py-16 text-center
            `}
            role="button"
            tabIndex={0}
            aria-label="Drop your resume here or click to browse"
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              className="sr-only"
              disabled={isUploading}
              id="file-upload"
            />

            {file ? (
              <div>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pine-light flex items-center justify-center">
                  <span className="text-pine text-xl">✓</span>
                </div>
                <p className="font-serif text-lg font-semibold text-ink">
                  {file.name}
                </p>
                <p className="font-mono text-sm text-ink-faint mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <p className="text-xs text-ink-faint mt-3 font-serif">
                  Click or drop another file to replace
                </p>
              </div>
            ) : (
              <div>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-canvas flex items-center justify-center border border-border">
                  <svg
                    className="w-6 h-6 text-ink-faint"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <p className="font-serif text-lg text-ink-muted">
                  Drop your resume here
                </p>
                <p className="text-sm text-ink-faint mt-1 font-serif">
                  or click to browse · PDF or DOCX, max 5MB
                </p>
              </div>
            )}
          </div>

          {/* Resume type selector */}
          <div className="mt-5">
            <label
              htmlFor="resume-type"
              className="block text-sm font-semibold text-ink-muted mb-2 font-serif"
            >
              Target Profile
            </label>
            <select
              id="resume-type"
              value={resumeType}
              onChange={(e) => setResumeType(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-paper font-serif text-sm text-ink
                         focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         appearance-none cursor-pointer"
            >
              <option value="">Auto-Detect (keyword density match)</option>
              <option value="tech">Technology / Software Engineering</option>
              <option value="finance">Finance / Banking / Accounting</option>
              <option value="support">Customer Support / Operations</option>
              <option value="general">General Professional</option>
            </select>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-rust-light border border-rust/20 text-sm text-rust font-serif">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || isUploading}
            className="mt-6 w-full py-3.5 rounded-xl font-serif text-base font-bold
                       bg-pine text-paper
                       hover:bg-pine/90 active:bg-pine/80
                       disabled:bg-ink-faint disabled:cursor-not-allowed
                       transition-colors duration-150
                       cursor-pointer"
          >
            {isUploading ? 'Uploading…' : 'Score Resume'}
          </button>
        </form>
      </div>
    </div>
  );
}
