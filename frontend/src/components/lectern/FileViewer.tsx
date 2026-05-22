import React, { useState, useEffect } from "react";
import { fetchWithRetry } from "@/utils/api";
import { lecternStyles as ls, lecternDark as ds } from "./styles";

interface FileViewerProps {
  file?: File | null;
  jobId?: string | null;
  isDark?: boolean;
  scale?: number;
  scanning?: boolean;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  file,
  jobId,
  isDark = false,
  scale = 1,
  scanning = false,
}) => {
  const s = isDark ? ds : ls;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      setError(null);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  useEffect(() => {
    if (jobId && !file) {
      setLoading(true);
      setError(null);
      fetchWithRetry(`/api/v1/jobs/${jobId}/file`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to load file");
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setObjectUrl(url);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
      return () => {
        setObjectUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      };
    }
  }, [jobId, file]);

  const isPdf =
    file?.type === "application/pdf" ||
    objectUrl?.toLowerCase().endsWith(".pdf") ||
    file?.name.toLowerCase().endsWith(".pdf");

  if (loading) {
    return (
      <div
        style={{
          width: 360 * scale,
          height: 480 * scale,
          display: "grid",
          placeItems: "center",
          color: s.ink3,
          fontSize: 13,
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        Loading document…
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div
        style={{
          width: 360 * scale,
          height: 480 * scale,
          display: "grid",
          placeItems: "center",
          color: s.ink3,
          fontSize: 13,
          fontFamily: '"Inter", system-ui, sans-serif',
          border: `1px dashed ${s.border}`,
          borderRadius: 4,
        }}
      >
        {error || "No document to display"}
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    width: 360 * scale,
    height: 480 * scale,
    borderRadius: 4,
    overflow: "auto",
    boxShadow: "0 1px 0 rgba(26,24,20,0.04), 0 8px 24px -8px rgba(26,24,20,0.12)",
    border: `1px solid ${s.border}`,
    background: s.surface,
    position: "relative",
  };

  const inner = isPdf ? (
    <iframe
      src={objectUrl}
      width="100%"
      height="100%"
      style={{ display: "block", border: "none" }}
      title="PDF preview"
    />
  ) : (
    <img
      src={objectUrl}
      alt="Document"
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        objectFit: "contain",
      }}
    />
  );

  return (
    <div style={containerStyle}>
      {inner}
      {scanning && (
        <>
          <div
            className="lec-scan"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 2,
              background: s.accent,
              boxShadow: `0 0 14px ${s.accent}, 0 0 4px ${s.accent}`,
              zIndex: 2,
            }}
          />
          <div
            className="lec-scan"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 80,
              background: `linear-gradient(180deg, transparent, ${s.accent}15)`,
              marginTop: -80,
              zIndex: 2,
            }}
          />
        </>
      )}
    </div>
  );
};
