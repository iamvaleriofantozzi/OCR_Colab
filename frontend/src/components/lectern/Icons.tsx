// Minimal stroke-based icons for Lectern
import React from "react";

const Icon: React.FC<{ d: string | string[]; size?: number; stroke?: number; className?: string }> = ({
  d,
  size = 16,
  stroke = 1.6,
  className,
  ...rest
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export const UploadIcon: React.FC<any> = (p) => <Icon {...p} d={["M12 3v13", "M7 8l5-5 5 5", "M4 21h16"]} />;
export const FileIcon: React.FC<any> = (p) => <Icon {...p} d={["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5"]} />;
export const ImageIcon: React.FC<any> = (p) => <Icon {...p} d={["M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M21 16l-5-5L5 21"]} />;
export const LinkIcon: React.FC<any> = (p) => <Icon {...p} d={["M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1", "M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"]} />;
export const SearchIcon: React.FC<any> = (p) => <Icon {...p} d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"]} />;
export const XIcon: React.FC<any> = (p) => <Icon {...p} d={["M18 6L6 18", "M6 6l12 12"]} />;
export const CheckIcon: React.FC<any> = (p) => <Icon {...p} d="M20 6L9 17l-5-5" />;
export const CopyIcon: React.FC<any> = (p) => <Icon {...p} d={["M8 4h11a2 2 0 0 1 2 2v11", "M16 8H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z"]} />;
export const DownloadIcon: React.FC<any> = (p) => <Icon {...p} d={["M12 3v13", "M7 11l5 5 5-5", "M4 21h16"]} />;
export const EditIcon: React.FC<any> = (p) => <Icon {...p} d={["M11 4H4v16h16v-7", "M18.4 2.6a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4z"]} />;
export const SettingsIcon: React.FC<any> = (p) => <Icon {...p} d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"]} />;
export const SunIcon: React.FC<any> = (p) => <Icon {...p} d={["M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z", "M12 1v2", "M12 21v2", "M4.2 4.2l1.4 1.4", "M18.4 18.4l1.4 1.4", "M1 12h2", "M21 12h2", "M4.2 19.8l1.4-1.4", "M18.4 5.6l1.4-1.4"]} />;
export const MoonIcon: React.FC<any> = (p) => <Icon {...p} d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />;
export const PlusIcon: React.FC<any> = (p) => <Icon {...p} d={["M12 5v14", "M5 12h14"]} />;
export const ClockIcon: React.FC<any> = (p) => <Icon {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"]} />;
export const LayersIcon: React.FC<any> = (p) => <Icon {...p} d={["M12 2L2 7l10 5 10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]} />;
export const ArrowRightIcon: React.FC<any> = (p) => <Icon {...p} d={["M5 12h14", "M13 5l7 7-7 7"]} />;
export const ChevronRightIcon: React.FC<any> = (p) => <Icon {...p} d="M9 6l6 6-6 6" />;
export const ChevronLeftIcon: React.FC<any> = (p) => <Icon {...p} d="M15 6l-6 6 6 6" />;
export const SparkleIcon: React.FC<any> = (p) => <Icon {...p} d={["M12 3v3", "M12 18v3", "M3 12h3", "M18 12h3", "M5.6 5.6l2.1 2.1", "M16.3 16.3l2.1 2.1", "M5.6 18.4l2.1-2.1", "M16.3 7.7l2.1-2.1"]} />;
export const DocIcon: React.FC<any> = (p) => <Icon {...p} d={["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5", "M9 13h6", "M9 17h6", "M9 9h2"]} />;
export const TableIcon: React.FC<any> = (p) => <Icon {...p} d={["M3 6h18", "M3 12h18", "M3 18h18", "M9 3v18", "M15 3v18"]} />;
export const PauseIcon: React.FC<any> = (p) => <Icon {...p} d={["M6 4h4v16H6z", "M14 4h4v16h-4z"]} />;
export const MoreIcon: React.FC<any> = (p) => <Icon {...p} d={["M5 12h.01", "M12 12h.01", "M19 12h.01"]} />;
export const TrashIcon: React.FC<any> = (p) => <Icon {...p} d={["M3 6h18", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"]} />;
export const FolderIcon: React.FC<any> = (p) => <Icon {...p} d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />;
export const EyeIcon: React.FC<any> = (p) => <Icon {...p} d={["M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]} />;
