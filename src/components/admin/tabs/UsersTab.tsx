"use client";

import React from "react";
import Link from "next/link";
import { KpiCard, Panel, Unavailable } from "@/components/admin/ui";
import { RankedBars, TimeChart } from "@/components/admin/charts";
import {
  KpiGrid,
  RecentUsersList,
  TopUsersList,
  type TabProps,
} from "@/components/admin/tabs/parts";
import { fmtDate, fmtDec, fmtInt, fmtPct } from "@/lib/admin-format";

const providerLabel = (p: string) =>
  ({ email: "Email & password", google: "Google", apple: "Apple", github: "GitHub" })[p] ?? p;

export default function UsersTab({ data }: TabProps) {
  const { users, series, range } = data;
  const g = range.granularity;

  return (
    <div className="space-y-8">
      <KpiGrid>
        <KpiCard label="New users" value={fmtInt(users.signups.current)} delta={users.signups}
          note={users.growthRate !== null ? `+${fmtPct(users.growthRate, 1)} of starting base` : undefined}
          hint="Accounts created in the period, and that as a share of users at the start of the period." />
        <KpiCard label="Active users" value={fmtInt(users.active.current)} delta={users.active}
          hint="Distinct users with any recorded activity in the period." />
        <KpiCard label="Returning users" value={fmtInt(users.returning.current)} delta={users.returning}
          hint="Active users who signed up before this period started." />
        <KpiCard label="Avg daily active" value={fmtDec(users.avgDau.current)} delta={users.avgDau}
          note={users.stickiness !== null ? `Stickiness ${fmtPct(users.stickiness)}` : "Stickiness needs a 30-day window"}
          hint="Average distinct users per day. Stickiness = DAU ÷ MAU." />
        <KpiCard label="Weekly active (WAU)" value={fmtInt(users.wau)}
          note="Trailing 7 days" hint="Distinct users active in the 7 days ending at the end of the period." />
        <KpiCard label="Monthly active (MAU)" value={fmtInt(users.mau)}
          note="Trailing 30 days" hint="Distinct users active in the 30 days ending at the end of the period." />
        <KpiCard label="Active days per user" value={users.engagement ? fmtDec(users.engagement.avgActiveDays) : "—"}
          note={users.engagement ? `${fmtDec(users.engagement.avgActions)} actions per active user` : "No activity in this period"}
          hint="Average number of distinct days each active user was active in the period." />
        <KpiCard label="Total users" value={fmtInt(users.total.current)} delta={users.total} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeChart title="New users" subtitle="Accounts created" kind="bar" data={series}
          series={[{ key: "signups", label: "New users" }]} granularity={g} />
        <TimeChart title="Active users" subtitle="Distinct users active in each period" data={series}
          series={[{ key: "active", label: "Active users" }]} granularity={g} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Most active users" subtitle="By content actions in this period">
          <TopUsersList users={users.topUsers} />
        </Panel>
        <Panel title="Recently active" subtitle="Latest recorded activity, any time">
          <RecentUsersList users={users.recentlyActive} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Sign-up source" subtitle="How accounts created in this period signed up">
          {users.sources === null ? (
            <p className="text-sm text-gray-500">Couldn&apos;t read sign-up data from the auth service.</p>
          ) : users.sources.length === 0 ? (
            <p className="text-sm text-gray-500">No accounts were created in this period.</p>
          ) : (
            <RankedBars items={users.sources.map((s) => ({ label: providerLabel(s.provider), value: s.count }))} />
          )}
        </Panel>
        <Panel title="Account health" subtitle="All accounts, from the auth service">
          {users.accounts === null ? (
            <p className="text-sm text-gray-500">Not available.</p>
          ) : (
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Accounts", users.accounts.total, "Registered with the auth service"],
                ["Unverified", users.accounts.unverified, "Never confirmed their email"],
                ["Never entered", users.accounts.withoutProfile, "Signed up but never completed a login"],
              ].map(([label, value, hint]) => (
                <div key={label as string} className="rounded-2xl bg-sand p-3" title={hint as string}>
                  <dd className="font-display text-2xl font-semibold text-ink tabular-nums">{fmtInt(value as number)}</dd>
                  <dt className="text-xs font-bold text-gray-600">{label}</dt>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Manage individual accounts in <Link href="/admin/users" className="link">Users</Link>.
          </p>
        </Panel>
      </div>

      <Unavailable title="Location and device">
        Not collected: the app doesn&apos;t store a country, IP address or device at sign-up, so these can&apos;t be
        reported. Sign-up source is limited to the auth provider
        {users.trackingSince ? `; visit tracking began ${fmtDate(users.trackingSince + "T00:00:00Z")}, earlier activity is inferred from content creation` : ""}.
      </Unavailable>
    </div>
  );
}
