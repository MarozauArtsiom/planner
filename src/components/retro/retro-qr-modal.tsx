"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";

interface Props {
  inviteToken: string;
  boardTitle: string;
  open: boolean;
  onClose: () => void;
}

export function RetroQrModal({
  inviteToken,
  boardTitle,
  open,
  onClose,
}: Props) {
  const t = useTranslations("retro");
  const [svg, setSvg] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const link = `${window.location.origin}/retro/${inviteToken}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(link);
    QRCode.toString(link, {
      type: "svg",
      margin: 1,
      width: 300,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setSvg)
      .catch(() => setSvg(null));
  }, [inviteToken, open]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              {t("shareBoardTitle")}
            </h3>
            <p className="mt-0.5 truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {boardTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          {t("shareBoardDesc")}
        </p>

        {svg ? (
          <div
            className="mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center rounded-xl bg-white p-3 ring-1 ring-zinc-200 dark:ring-zinc-700"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <span className="text-sm text-zinc-400">…</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={url}
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {copied ? t("linkCopied") : t("copyInviteLink")}
          </button>
        </div>
      </div>
    </div>
  );
}
