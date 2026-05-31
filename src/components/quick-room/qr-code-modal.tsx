"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";

interface Props {
  accessCode: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Модал с QR-кодом для шеринга комнаты на офисном экране.
 * Использует `qrcode` пакет для локальной генерации SVG-строки.
 */
export function QrCodeModal({ accessCode, open, onClose }: Props) {
  const t = useTranslations("quickRoom");
  const [svg, setSvg] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    const link = `${window.location.origin}/poker/${accessCode}`;
    setUrl(link);
    QRCode.toString(link, {
      type: "svg",
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setSvg)
      .catch(() => setSvg(null));
  }, [accessCode, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t("qrTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {svg ? (
          <div
            className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center rounded-xl bg-white p-3 ring-1 ring-zinc-200 dark:ring-zinc-700"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <span className="text-sm text-zinc-400">…</span>
          </div>
        )}

        <p className="mt-4 text-center font-mono text-lg font-bold tracking-wider text-zinc-900 dark:text-zinc-50">
          {accessCode}
        </p>
        <p className="mt-1 text-center text-[11px] break-all text-zinc-400 dark:text-zinc-500">
          {url}
        </p>
      </div>
    </div>
  );
}
