"use client";

import React, { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { PlanChip, Segmented, StatusChip } from "@/components/admin/ui";
import { fmtDate, fmtDateTime, fmtPeso, planLabel } from "@/lib/admin-format";
import { readJson } from "@/lib/http";
import type { getUserDetail } from "@/service/admin-users.service";

type Detail = Awaited<ReturnType<typeof getUserDetail>>;
type View = "details" | "activity" | "manage";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="mt-0.5 break-words text-sm font-semibold text-ink">{children}</dd>
  </div>
);

export default function UserDetailModal({
  userId,
  onClose,
  onChanged,
}: {
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("details");
  const [busy, setBusy] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const [form, setForm] = useState({
    planType: "FREE",
    subscriptionStatus: "inactive",
    adminDiscountPercent: "",
    isEarlyUser: false,
    adminNotes: "",
  });
  const [grant, setGrant] = useState({ planType: "PRO", months: "1" });
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
      const json = await readJson<{ success: boolean; data?: Detail; error?: { message?: string } }>(res);
      if (!res.ok || !json?.success || !json.data) throw new Error(json?.error?.message || "Couldn't load this user.");
      setDetail(json.data);
      setError(null);
      setForm({
        planType: json.data.subscription.planType,
        subscriptionStatus: json.data.subscription.status ?? "inactive",
        adminDiscountPercent: json.data.profile.adminDiscountPercent?.toString() ?? "",
        isEarlyUser: json.data.profile.isEarlyUser,
        adminNotes: json.data.profile.adminNotes ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this user.");
    }
  }, [userId]);

  useEffect(() => {
    setDetail(null);
    setView("details");
    void load();
  }, [load]);

  const call = async (
    run: () => Promise<Response>,
    okMessage: string,
    parse: (json: { success?: boolean; error?: string | { message?: string } } | null) => string | null,
  ) => {
    setBusy(true);
    try {
      const res = await run();
      const json = await readJson<{ success?: boolean; error?: string | { message?: string } }>(res);
      const failure = !res.ok || !json?.success ? (parse(json) ?? "Something went wrong.") : null;
      if (failure) {
        showToast(failure, "error");
        return;
      }
      showToast(okMessage, "success");
      await load();
      onChanged();
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };
  const errText = (j: { error?: string | { message?: string } } | null) =>
    typeof j?.error === "string" ? j.error : (j?.error?.message ?? null);

  const save = () =>
    call(
      () =>
        fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            planType: form.planType,
            subscriptionStatus: form.subscriptionStatus,
            adminDiscountPercent: form.adminDiscountPercent === "" ? null : Number(form.adminDiscountPercent),
            isEarlyUser: form.isEarlyUser,
            adminNotes: form.adminNotes || null,
          }),
        }),
      "User updated",
      errText,
    );

  const grantSub = () =>
    call(
      () =>
        fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, planType: grant.planType, durationMonths: Number(grant.months) || 1 }),
        }),
      "Free subscription granted",
      errText,
    );

  const setSuspended = (suspend: boolean) =>
    call(
      () =>
        fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(suspend ? { action: "suspend", reason: reason.trim() || undefined } : { action: "reactivate" }),
        }),
      suspend ? "Account suspended" : "Account reactivated",
      errText,
    ).then(() => {
      setConfirmSuspend(false);
      setReason("");
    });

  const p = detail?.profile;
  const sub = detail?.subscription;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        size="lg"
        title={p?.email ?? "User"}
        description={p ? `Joined ${fmtDate(p.createdAt)}` : undefined}
        locked={busy}
      >
        <div className="space-y-5 px-5 pb-6 sm:px-7">
          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {error}
            </div>
          )}
          {!detail && !error && (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}

          {detail && p && sub && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <PlanChip plan={sub.planType} />
                <StatusChip
                  user={{
                    suspendedAt: p.suspendedAt,
                    subscriptionStatus: sub.status,
                    planType: sub.planType,
                    planExpired: sub.expired,
                  }}
                />
                {p.isAdmin && <span className="chip chip-accent !px-2.5 !py-0.5 !text-xs">Admin</span>}
                {p.isEarlyUser && <span className="chip !px-2.5 !py-0.5 !text-xs">Early user #{p.earlyUserNumber}</span>}
              </div>

              <Segmented
                label="User sections"
                value={view}
                onChange={setView}
                options={[
                  { value: "details", label: "Details" },
                  { value: "activity", label: "Activity" },
                  { value: "manage", label: "Manage" },
                ]}
              />

              {view === "details" && (
                <div className="space-y-6">
                  <section aria-labelledby="ud-acct">
                    <h3 id="ud-acct" className="mb-2 font-bold text-ink">Account</h3>
                    <dl className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                      <Field label="User ID"><span className="font-mono text-xs">{p.id}</span></Field>
                      <Field label="Sign-up method">{detail.auth?.provider ?? "Unknown"}</Field>
                      <Field label="Email verified">{detail.auth ? (detail.auth.emailConfirmedAt ? fmtDate(detail.auth.emailConfirmedAt) : "Not verified") : "Unknown"}</Field>
                      <Field label="Last sign-in">{detail.auth?.lastSignInAt ? fmtDateTime(detail.auth.lastSignInAt) : "Unknown"}</Field>
                      <Field label="Last activity">{p.lastActivityDate ? fmtDateTime(p.lastActivityDate) : "None recorded"}</Field>
                      <Field label="Active days (30d)">{detail.usage.activeDaysLast30}</Field>
                      <Field label="Streak">{p.currentStreak} current · {p.longestStreak} longest</Field>
                      <Field label="Marketing emails">{p.marketingOptIn ? "Opted in" : "Opted out"}</Field>
                      {p.suspendedAt && <Field label="Suspended">{fmtDateTime(p.suspendedAt)}{p.suspendedReason ? ` · ${p.suspendedReason}` : ""}</Field>}
                    </dl>
                  </section>

                  <section aria-labelledby="ud-sub">
                    <h3 id="ud-sub" className="mb-2 font-bold text-ink">Subscription</h3>
                    <dl className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                      <Field label="Plan">{planLabel(sub.planType)}</Field>
                      <Field label="Status">{sub.status ?? "inactive"}</Field>
                      <Field label="Billing period">{sub.period ?? "—"}</Field>
                      <Field label="Term">{sub.startDate ? `${fmtDate(sub.startDate)} → ${fmtDate(sub.endDate)}` : "No dated term"}</Field>
                      <Field label="Promo code">{sub.appliedPromoCode ? `${sub.appliedPromoCode}${sub.promoEndDate ? ` (until ${fmtDate(sub.promoEndDate)})` : ""}` : "None"}</Field>
                      <Field label="Admin discount">{p.adminDiscountPercent ? `${p.adminDiscountPercent}%` : "None"}</Field>
                      <Field label="Credits today">{sub.creditsUsedToday} / {sub.dailyCredits}</Field>
                      <Field label="Limits">{sub.notesLimit === -1 ? "Unlimited" : sub.notesLimit} notes · {sub.subjectsLimit === -1 ? "Unlimited" : sub.subjectsLimit} subjects</Field>
                    </dl>
                  </section>

                  <section aria-labelledby="ud-use">
                    <h3 id="ud-use" className="mb-2 font-bold text-ink">Usage</h3>
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        ["Subjects", detail.usage.subjects],
                        ["Notes", detail.usage.notes],
                        ["Study tools", detail.usage.tools],
                        ["Failed notes", detail.usage.failedNotes],
                        ["Feedback sent", detail.usage.feedbackCount],
                        ["AI operations", detail.usage.aiOperations],
                      ].map(([label, value]) => (
                        <div key={label as string} className="rounded-2xl bg-sand p-3 text-center">
                          <dd className="font-display text-2xl font-semibold tabular-nums text-ink">{value as number}</dd>
                          <dt className="text-xs font-bold text-gray-600">{label}</dt>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <section aria-labelledby="ud-pay">
                    <h3 id="ud-pay" className="mb-2 font-bold text-ink">Payments</h3>
                    {detail.payments.length === 0 ? (
                      <p className="text-sm text-gray-500">No payments recorded for this user.</p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {detail.payments.map((pay) => (
                          <li key={pay.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-sm">
                            <span className="font-bold text-ink">{fmtPeso(pay.amount)} <span className="font-medium text-gray-500">· {pay.status.toLowerCase()}</span></span>
                            <span className="text-xs text-gray-500">
                              {pay.planType ? `${planLabel(pay.planType)} ` : ""}{pay.billingPeriod ?? ""} · {fmtDateTime(pay.occurredAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}

              {view === "activity" && (
                <div className="space-y-6">
                  <section aria-labelledby="ud-tl">
                    <h3 id="ud-tl" className="mb-2 font-bold text-ink">Activity history</h3>
                    <p className="mb-2 text-xs text-gray-500">What they did, not what they wrote: note and subject titles are private.</p>
                    <ol className="divide-y divide-line">
                      {detail.activity.map((a, i) => (
                        <li key={i} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                          <span className="min-w-0 font-semibold text-ink">{a.label}</span>
                          <span className="shrink-0 text-xs text-gray-500">{fmtDateTime(a.at)}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                  <section aria-labelledby="ud-audit">
                    <h3 id="ud-audit" className="mb-2 font-bold text-ink">Admin changes</h3>
                    {detail.audit.length === 0 ? (
                      <p className="text-sm text-gray-500">No admin has changed this account.</p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {detail.audit.map((e) => (
                          <li key={e.id} className="py-2 text-sm">
                            <p className="font-semibold text-ink">{e.action}</p>
                            <p className="text-xs text-gray-500">{e.actorEmail} · {fmtDateTime(e.createdAt)}</p>
                            {e.metadata ? (
                              <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-sand p-2 text-xs text-gray-700">{JSON.stringify(e.metadata, null, 1)}</pre>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}

              {view === "manage" && (
                <div className="space-y-7">
                  <section className="space-y-4" aria-labelledby="ud-edit">
                    <h3 id="ud-edit" className="font-bold text-ink">Plan and notes</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-sm font-bold text-gray-700">
                        Plan
                        <select className="field mt-1" value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value })}>
                          <option value="FREE">Free</option>
                          <option value="PRO">Pro</option>
                          <option value="PREMIUM">Premium</option>
                        </select>
                      </label>
                      <label className="text-sm font-bold text-gray-700">
                        Subscription status
                        <select className="field mt-1" value={form.subscriptionStatus} onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value })}>
                          <option value="inactive">Inactive</option>
                          <option value="active">Active</option>
                          <option value="canceled">Canceled</option>
                          <option value="past_due">Past due</option>
                        </select>
                      </label>
                      <label className="text-sm font-bold text-gray-700">
                        Admin discount (%)
                        <input type="number" min={0} max={100} className="field mt-1" value={form.adminDiscountPercent}
                          onChange={(e) => setForm({ ...form, adminDiscountPercent: e.target.value })} placeholder="0–100" />
                      </label>
                      <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold text-gray-700">
                        <input type="checkbox" className="h-5 w-5 rounded" checked={form.isEarlyUser}
                          onChange={(e) => setForm({ ...form, isEarlyUser: e.target.checked })} />
                        Early user (50% off)
                      </label>
                    </div>
                    <label className="block text-sm font-bold text-gray-700">
                      Internal notes
                      <textarea rows={3} className="field mt-1" value={form.adminNotes}
                        onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} placeholder="Only admins see this" />
                    </label>
                    <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
                      {busy ? "Saving…" : "Save changes"}
                    </button>
                  </section>

                  <section className="space-y-3 border-t border-line pt-6" aria-labelledby="ud-grant">
                    <h3 id="ud-grant" className="font-bold text-ink">Grant a free subscription</h3>
                    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                      <select aria-label="Plan to grant" className="field" value={grant.planType} onChange={(e) => setGrant({ ...grant, planType: e.target.value })}>
                        <option value="PRO">Pro</option>
                        <option value="PREMIUM">Premium</option>
                      </select>
                      <select aria-label="Months" className="field" value={grant.months} onChange={(e) => setGrant({ ...grant, months: e.target.value })}>
                        {[1, 3, 6, 12].map((m) => (
                          <option key={m} value={m}>{m} month{m === 1 ? "" : "s"}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={grantSub} disabled={busy}>
                      Grant subscription
                    </button>
                    <p className="text-xs text-gray-500">Overwrites the current plan and the internal notes. Recorded in the audit log.</p>
                  </section>

                  <section className="space-y-3 border-t border-line pt-6" aria-labelledby="ud-susp">
                    <h3 id="ud-susp" className="font-bold text-ink">Account access</h3>
                    {p.suspendedAt ? (
                      <>
                        <p className="text-sm text-gray-600">This account is suspended: the app refuses their requests and they can&apos;t sign in.</p>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSuspended(false)} disabled={busy}>
                          Reactivate account
                        </button>
                      </>
                    ) : p.isAdmin ? (
                      <p className="text-sm text-gray-500">Admin accounts can&apos;t be suspended.</p>
                    ) : (
                      <>
                        <label className="block text-sm font-bold text-gray-700">
                          Reason (optional, kept in the audit log)
                          <input className="field mt-1" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                        </label>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmSuspend(true)} disabled={busy}>
                          Suspend account
                        </button>
                      </>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmSuspend}
        title="Suspend this account?"
        description={`${p?.email ?? "This user"} will be signed out of every request and blocked from signing in until you reactivate them. Their data is kept.`}
        confirmLabel="Suspend"
        busy={busy}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={() => setSuspended(true)}
      />
    </>
  );
}
