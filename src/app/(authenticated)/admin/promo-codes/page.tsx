"use client";

import React, { useState, useEffect } from "react";

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  applicablePlans: string[];
  createdAt: string;
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "MONTHS_FREE",
    discountValue: 0,
    maxUses: "",
    expiresAt: "",
    applicablePlans: [] as string[],
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch("/api/admin/promo-codes");
      const data = await response.json();
      if (response.ok) {
        setPromoCodes(data.promoCodes);
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...(editingPromo ? { id: editingPromo.id } : {}),
      code: formData.code.toUpperCase(),
      description: formData.description,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      expiresAt: formData.expiresAt || null,
      applicablePlans: formData.applicablePlans,
    };

    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: editingPromo ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchPromoCodes();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save promo code");
      }
    } catch (error) {
      console.error("Error saving promo code:", error);
      alert("Failed to save promo code");
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxUses: promo.maxUses?.toString() || "",
      expiresAt: promo.expiresAt
        ? new Date(promo.expiresAt).toISOString().split("T")[0]
        : "",
      applicablePlans: promo.applicablePlans,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;

    try {
      const response = await fetch(`/api/admin/promo-codes?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPromoCodes();
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: promo.id,
          isActive: !promo.isActive,
        }),
      });

      if (response.ok) {
        fetchPromoCodes();
      }
    } catch (error) {
      console.error("Error toggling promo code:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "MONTHS_FREE",
      discountValue: 0,
      maxUses: "",
      expiresAt: "",
      applicablePlans: [],
    });
    setEditingPromo(null);
    setShowCreateForm(false);
  };

  const handlePlanToggle = (planType: string) => {
    setFormData((prev) => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(planType)
        ? prev.applicablePlans.filter((p) => p !== planType)
        : [...prev.applicablePlans, planType],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Promo Codes</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Create New Promo Code
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingPromo ? "Edit" : "Create"} Promo Code
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Promo Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="EARLYCAT50"
                  required
                  disabled={!!editingPromo}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="3 months free for Product Hunt users"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="MONTHS_FREE">Months Free</option>
                    <option value="PERCENTAGE">Percentage Off</option>
                    <option value="FIXED_AMOUNT">Fixed Amount Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={
                      formData.discountType === "MONTHS_FREE"
                        ? "3"
                        : formData.discountType === "PERCENTAGE"
                          ? "50"
                          : "100"
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max Uses (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Unlimited if empty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Expires At (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Applicable Plans (empty = all plans)
                </label>
                <div className="flex gap-4">
                  {["PRO", "PREMIUM"].map((plan) => (
                    <label key={plan} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.applicablePlans.includes(plan)}
                        onChange={() => handlePlanToggle(plan)}
                      />
                      <span>{plan}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {editingPromo ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promo Codes Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium">Code</th>
              <th className="text-left p-4 font-medium">Description</th>
              <th className="text-left p-4 font-medium">Discount</th>
              <th className="text-left p-4 font-medium">Usage</th>
              <th className="text-left p-4 font-medium">Expires</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((promo) => (
              <tr key={promo.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-mono font-bold">{promo.code}</td>
                <td className="p-4">{promo.description}</td>
                <td className="p-4">
                  {promo.discountType === "MONTHS_FREE"
                    ? `${promo.discountValue} months`
                    : promo.discountType === "PERCENTAGE"
                      ? `${promo.discountValue}%`
                      : `$${promo.discountValue}`}
                </td>
                <td className="p-4">
                  {promo.currentUses}
                  {promo.maxUses ? ` / ${promo.maxUses}` : " / ∞"}
                </td>
                <td className="p-4">
                  {promo.expiresAt
                    ? new Date(promo.expiresAt).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(promo)}
                    className={`px-2 py-1 rounded text-sm ${
                      promo.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {promo.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {promoCodes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No promo codes yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
