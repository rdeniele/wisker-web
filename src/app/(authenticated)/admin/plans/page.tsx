"use client";
import React, { useState, useEffect } from "react";

interface Plan {
  id: string;
  name: string;
  planType: string;
  displayName: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  dailyCredits: number;
  notesLimit: number;
  subjectsLimit: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  isMostPopular: boolean;
  discountPercent: number | null;
  discountLabel: string | null;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans/admin");
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan({ ...plan });
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    setSaving(true);
    try {
      const response = await fetch("/api/plans/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });

      const data = await response.json();
      if (data.success) {
        await fetchPlans();
        setEditingPlan(null);
        alert("Plan updated successfully!");
      } else {
        alert("Failed to update plan: " + data.error);
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Error saving plan");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
  };

  const updateEditingPlan = (field: keyof Plan, value: Plan[keyof Plan]) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, [field]: value });
  };

  const addFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, ""],
    });
  };

  const updateFeature = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({ ...editingPlan, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    if (!editingPlan) return;
    const newFeatures = editingPlan.features.filter((_, i) => i !== index);
    setEditingPlan({ ...editingPlan, features: newFeatures });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-gray-600 mt-2">
            Manage subscription plans, pricing, and features
          </p>
        </div>

        {/* Plans List */}
        <div className="space-y-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              {editingPlan?.id === plan.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editingPlan.displayName}
                        onChange={(e) =>
                          updateEditingPlan("displayName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plan Type
                      </label>
                      <input
                        type="text"
                        value={editingPlan.planType}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Price (₱)
                      </label>
                      <input
                        type="number"
                        value={editingPlan.monthlyPrice}
                        onChange={(e) =>
                          updateEditingPlan(
                            "monthlyPrice",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Yearly Price (₱)
                      </label>
                      <input
                        type="number"
                        value={editingPlan.yearlyPrice}
                        onChange={(e) =>
                          updateEditingPlan(
                            "yearlyPrice",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Credits
                      </label>
                      <input
                        type="number"
                        value={editingPlan.dailyCredits}
                        onChange={(e) =>
                          updateEditingPlan(
                            "dailyCredits",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes Limit (-1 = unlimited)
                      </label>
                      <input
                        type="number"
                        value={editingPlan.notesLimit}
                        onChange={(e) =>
                          updateEditingPlan(
                            "notesLimit",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subjects Limit (-1 = unlimited)
                      </label>
                      <input
                        type="number"
                        value={editingPlan.subjectsLimit}
                        onChange={(e) =>
                          updateEditingPlan(
                            "subjectsLimit",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        value={editingPlan.sortOrder}
                        onChange={(e) =>
                          updateEditingPlan("sortOrder", parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Percent
                      </label>
                      <input
                        type="number"
                        value={editingPlan.discountPercent || ""}
                        onChange={(e) =>
                          updateEditingPlan(
                            "discountPercent",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="e.g., 50 for 50% off"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Label
                      </label>
                      <input
                        type="text"
                        value={editingPlan.discountLabel || ""}
                        onChange={(e) =>
                          updateEditingPlan(
                            "discountLabel",
                            e.target.value || null
                          )
                        }
                        placeholder="e.g., 50% OFF for Early Users"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPlan.isActive}
                        onChange={(e) =>
                          updateEditingPlan("isActive", e.target.checked)
                        }
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active
                      </span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPlan.isMostPopular}
                        onChange={(e) =>
                          updateEditingPlan("isMostPopular", e.target.checked)
                        }
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Most Popular
                      </span>
                    </label>
                  </div>

                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Features
                      </label>
                      <button
                        onClick={addFeature}
                        className="text-sm text-orange-500 hover:text-orange-600"
                      >
                        + Add Feature
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editingPlan.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) =>
                              updateFeature(index, e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Feature description"
                          />
                          <button
                            onClick={() => removeFeature(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {plan.displayName}
                        {plan.isMostPopular && (
                          <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded">
                            Most Popular
                          </span>
                        )}
                        {!plan.isActive && (
                          <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{plan.planType}</p>
                    </div>
                    <button
                      onClick={() => handleEdit(plan)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Monthly</p>
                      <p className="text-lg font-semibold">
                        ₱{plan.monthlyPrice}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Yearly</p>
                      <p className="text-lg font-semibold">
                        ₱{plan.yearlyPrice}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Daily Credits</p>
                      <p className="text-lg font-semibold">
                        {plan.dailyCredits}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Notes/Subjects</p>
                      <p className="text-lg font-semibold">
                        {plan.notesLimit === -1
                          ? "∞"
                          : plan.notesLimit}
                        {" / "}
                        {plan.subjectsLimit === -1
                          ? "∞"
                          : plan.subjectsLimit}
                      </p>
                    </div>
                  </div>

                  {plan.discountLabel && (
                    <div className="mb-4">
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                        {plan.discountLabel} ({plan.discountPercent}%)
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Features:
                    </p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
