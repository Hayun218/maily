"use client";

import { useEffect, useState, useCallback } from "react";
import SenderCard from "@/components/SenderCard";
import type { SenderInfo } from "@/lib/detector";
import Link from "next/link";

type ScanState =
  | { status: "scanning" }
  | { status: "done"; senders: SenderInfo[]; total: number }
  | { status: "error"; message: string };

export default function Dashboard() {
  const [state, setState] = useState<ScanState>({ status: "scanning" });
  const [query, setQuery] = useState("");

  const scan = useCallback(async () => {
    setState({ status: "scanning" });
    try {
      const res = await fetch("/api/scan");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        setState({ status: "error", message: data.error ?? "스캔 실패" });
      } else {
        setState({
          status: "done",
          senders: data.senders,
          total: data.total,
        });
      }
    } catch {
      setState({ status: "error", message: "네트워크 오류가 발생했습니다." });
    }
  }, []);

  useEffect(() => {
    scan();
  }, [scan]);

  function handleUnsubscribed(email: string) {
    setState((prev) => {
      if (prev.status !== "done") return prev;
      return {
        ...prev,
        senders: prev.senders.filter((s) => s.email !== email),
      };
    });
  }

  const filtered =
    state.status === "done"
      ? state.senders.filter(
          (s) =>
            !query ||
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.email.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-slate-900">
            📬 Maily
          </Link>

          {state.status === "done" && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {state.total}통 스캔 →{" "}
                <strong className="text-slate-800">
                  {state.senders.length}개
                </strong>{" "}
                구독 발견
              </span>
              <button
                onClick={scan}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                다시 스캔
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Scanning */}
        {state.status === "scanning" && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
            <p className="text-slate-500">받은편지함 스캔 중...</p>
            <p className="text-xs text-slate-400">최대 1분 정도 걸릴 수 있습니다</p>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-slate-700">{state.message}</p>
            <button
              onClick={scan}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-white hover:bg-slate-700"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Results */}
        {state.status === "done" && (
          <>
            {state.senders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-2">
                <p className="text-2xl">🎉</p>
                <p className="font-medium text-slate-800">구독 메일이 없어요!</p>
                <p className="text-sm text-slate-500">
                  받은편지함이 깨끗합니다.
                </p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="mb-6">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="발신자 검색..."
                    className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {filtered.length === 0 ? (
                  <p className="text-center text-slate-400 py-16">
                    검색 결과 없음
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((sender) => (
                      <SenderCard
                        key={sender.email}
                        sender={sender}
                        onUnsubscribed={handleUnsubscribed}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
