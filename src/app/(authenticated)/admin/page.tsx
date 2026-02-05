"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  earlyUsers: number;
  freeUsers: number;
  proUsers: number;
  premiumUsers: number;
  activeSubscriptions: number;
  marketingOptIns: number;
  totalRevenue: number;
  recentUsers: Array<{
    email: string;
    planType: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (!data.success) {
        if (data.error === "Unauthorized") {
          setError("Access denied. Admin privileges required.");
          return;
        }
        setError(data.error || "Failed to load stats");
        return;
      }

      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4 text-center">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Access Denied
          </h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage users, subscriptions, and view analytics
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Manage</p>
                <h3 className="text-xl font-bold text-gray-900">Users</h3>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </Link>

          <Link
            href="/admin/plans"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Manage</p>
                <h3 className="text-xl font-bold text-gray-900">Plans</h3>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </Link>

          <Link
            href="/admin/promo-codes"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Manage</p>
                <h3 className="text-xl font-bold text-gray-900">Promo Codes</h3>
              </div>
              <div className="text-4xl">🎟️</div>
            </div>
          </Link>

          <button
            onClick={fetchStats}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Action</p>
                <h3 className="text-xl font-bold text-gray-900">Refresh</h3>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Users</p>
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalUsers}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Early Users (50% OFF)</p>
              <span className="text-2xl">⭐</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {stats.earlyUsers} / 50
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {50 - stats.earlyUsers} spots remaining
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.activeSubscriptions}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Marketing Opt-ins</p>
              <span className="text-2xl">📧</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {stats.marketingOptIns}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats.marketingOptIns / stats.totalUsers) * 100)}% of
              users
            </p>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Plan Distribution
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Free</span>
                  <span className="text-sm font-semibold">
                    {stats.freeUsers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{
                      width: `${(stats.freeUsers / stats.totalUsers) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Pro</span>
                  <span className="text-sm font-semibold">
                    {stats.proUsers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${(stats.proUsers / stats.totalUsers) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Premium</span>
                  <span className="text-sm font-semibold">
                    {stats.premiumUsers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${(stats.premiumUsers / stats.totalUsers) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Recent Users
            </h3>
            <div className="space-y-3">
              {stats.recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No users yet</p>
              ) : (
                stats.recentUsers.map((user, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.planType === "PRO"
                          ? "bg-orange-100 text-orange-700"
                          : user.planType === "PREMIUM"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.planType}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              💡 Early User Program
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              The first 50 users get automatic 50% discount on all paid plans.
              Track progress above.
            </p>
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Manage Users →
            </Link>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-900 mb-2">
              📧 Marketing Emails
            </h3>
            <p className="text-sm text-green-800 mb-3">
              {stats.marketingOptIns} users opted in for marketing emails.
              Export their emails from the Users page.
            </p>
            <Link
              href="/admin/users"
              className="text-sm text-green-600 hover:text-green-700 font-semibold"
            >
              View Email List →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
