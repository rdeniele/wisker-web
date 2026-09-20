"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  planType: string;
  subscriptionStatus: string | null;
  dailyCredits: number;
  creditsUsedToday: number;
  isEarlyUser: boolean;
  earlyUserNumber: number | null;
  adminDiscountPercent: number | null;
  adminNotes: string | null;
  marketingOptIn: boolean;
  createdAt: string;
  subscriptionEndDate: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      // Error fetching users
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleSave = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          planType: editingUser.planType,
          subscriptionStatus: editingUser.subscriptionStatus,
          adminDiscountPercent: editingUser.adminDiscountPercent,
          adminNotes: editingUser.adminNotes,
          isEarlyUser: editingUser.isEarlyUser,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers();
        setEditingUser(null);
        alert("User updated successfully!");
      } else {
        alert("Failed to update user: " + data.error);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user");
    } finally {
      setSaving(false);
    }
  };

  const handleExportEmails = () => {
    const emails = users
      .filter((u) => u.marketingOptIn)
      .map((u) => u.email)
      .join("\n");

    const blob = new Blob([emails], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wisker-marketing-emails-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPlan =
      filterPlan === "all" || user.planType === filterPlan.toUpperCase();
    return matchesSearch && matchesPlan;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage user subscriptions and discounts
              </p>
            </div>
            <Link
              href="/admin"
              className="btn btn-secondary btn-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field !w-auto"
            />

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="field !w-auto"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>

            <button
              onClick={handleExportEmails}
              className="btn btn-accent btn-sm"
            >
              📧 Export Marketing Emails (
              {users.filter((u) => u.marketingOptIn).length})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            user.planType === "PRO"
                              ? "bg-orange-100 text-orange-700"
                              : user.planType === "PREMIUM"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.planType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.subscriptionStatus === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.subscriptionStatus || "inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.creditsUsedToday} / {user.dailyCredits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1 flex-wrap">
                          {user.isEarlyUser && (
                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                              ⭐ Early #{user.earlyUserNumber}
                            </span>
                          )}
                          {user.adminDiscountPercent && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              -{user.adminDiscountPercent}%
                            </span>
                          )}
                          {user.marketingOptIn && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              📧
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-ink/45 flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-[24px] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Edit User: {editingUser.email}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Type
                  </label>
                  <select
                    value={editingUser.planType}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        planType: e.target.value,
                      })
                    }
                    className="field"
                  >
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Status
                  </label>
                  <select
                    value={editingUser.subscriptionStatus || "inactive"}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        subscriptionStatus: e.target.value,
                      })
                    }
                    className="field"
                  >
                    <option value="inactive">Inactive</option>
                    <option value="active">Active</option>
                    <option value="canceled">Canceled</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Discount (%)
                  </label>
                  <input
                    type="number"
                    value={editingUser.adminDiscountPercent || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        adminDiscountPercent: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="0-100"
                    min="0"
                    max="100"
                    className="field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Give this user a custom discount percentage
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingUser.isEarlyUser}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          isEarlyUser: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mark as Early User (50% OFF)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={editingUser.adminNotes || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        adminNotes: e.target.value || null,
                      })
                    }
                    placeholder="Internal notes about this user..."
                    rows={3}
                    className="field"
                  />
                </div>

                <div className="bg-sand p-4 rounded-2xl">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    User Info
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Credits:</span>{" "}
                      <span className="font-medium">
                        {editingUser.creditsUsedToday} /{" "}
                        {editingUser.dailyCredits}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Marketing:</span>{" "}
                      <span className="font-medium">
                        {editingUser.marketingOptIn ? "✅ Yes" : "❌ No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Early User:</span>{" "}
                      <span className="font-medium">
                        {editingUser.isEarlyUser
                          ? `⭐ #${editingUser.earlyUserNumber}`
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Joined:</span>{" "}
                      <span className="font-medium">
                        {new Date(editingUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary btn-sm flex-1"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  disabled={saving}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
