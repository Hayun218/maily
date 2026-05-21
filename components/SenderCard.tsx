"use client";

import { useState } from "react";
import type { SenderInfo } from "@/lib/detector";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getInitial(name: string): string {
  return (name[0] ?? "?").toUpperCase();
}

function getDomainColor(domain: string): string {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-green-100 text-green-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
    "bg-indigo-100 text-indigo-700",
    "bg-rose-100 text-rose-700",
  ];
  let hash = 0;
  for (const ch of domain) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

interface Props {
  sender: SenderInfo;
  onUnsubscribed: (email: string) => void;
}

export default function SenderCard({ sender, onUnsubscribed }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [errMsg, setErrMsg] = useState("");

  const canUnsubscribe = !!(sender.unsubscribeUrl || sender.unsubscribeEmail);

  async function handleUnsubscribe() {
    setStatus("loading");
    setErrMsg("");

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unsubscribeUrl: sender.unsubscribeUrl,
          unsubscribeEmail: sender.unsubscribeEmail,
          senderEmail: sender.email,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("done");
        setTimeout(() => onUnsubscribed(sender.email), 800);
      } else {
        setStatus("error");
        setErrMsg(data.error ?? "수신거부 실패");
      }
    } catch {
      setStatus("error");
      setErrMsg("네트워크 오류");
    }
  }

  const colorClass = getDomainColor(sender.domain);

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
        status === "done"
          ? "opacity-50 scale-95 border-slate-100"
          : "border-slate-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${colorClass}`}
        >
          {getInitial(sender.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{sender.name}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {sender.email}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <MailIcon />
              {sender.count}통
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">
              {formatDate(sender.latestDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4">
        {status === "done" ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-green-50 py-2 text-sm font-medium text-green-700">
            <CheckIcon />
            수신거부 완료
          </div>
        ) : canUnsubscribe ? (
          <button
            onClick={handleUnsubscribe}
            disabled={status === "loading"}
            className="w-full rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {status === "loading" ? "처리 중..." : "원클릭 수신거부"}
          </button>
        ) : (
          <a
            href={`mailto:${sender.email}?subject=Unsubscribe`}
            className="block w-full rounded-xl border border-slate-200 py-2 text-center text-sm text-slate-500 transition hover:bg-slate-50"
          >
            직접 연락하기
          </a>
        )}

        {status === "error" && errMsg && (
          <p className="mt-2 text-xs text-red-500 text-center">{errMsg}</p>
        )}
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
