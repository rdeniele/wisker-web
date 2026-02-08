import { prisma } from "@/lib/prisma";
import { PromoCode } from "@prisma/client";

export interface PromoCodeData {
  code: string;
  description: string;
  discountType: "MONTHS_FREE" | "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxUses?: number | null;
  expiresAt?: Date | null;
  applicablePlans?: string[];
}

export interface ValidatePromoResult {
  valid: boolean;
  promoCode?: {
    id: string;
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
  };
  error?: string;
}

/**
 * Validate a promo code
 */
export async function validatePromoCode(
  code: string,
  planType?: string
): Promise<ValidatePromoResult> {
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!promoCode) {
    return { valid: false, error: "Invalid promo code" };
  }

  if (!promoCode.isActive) {
    return { valid: false, error: "This promo code is no longer active" };
  }

  if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
    return { valid: false, error: "This promo code has expired" };
  }

  if (
    promoCode.maxUses !== null &&
    promoCode.currentUses >= promoCode.maxUses
  ) {
    return { valid: false, error: "This promo code has reached its usage limit" };
  }

  // Check if promo code applies to the selected plan
  if (
    planType &&
    promoCode.applicablePlans.length > 0 &&
    !promoCode.applicablePlans.includes(planType)
  ) {
    return {
      valid: false,
      error: "This promo code is not applicable to the selected plan",
    };
  }

  return {
    valid: true,
    promoCode: {
      id: promoCode.id,
      code: promoCode.code,
      description: promoCode.description,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
    },
  };
}

/**
 * Apply promo code (increment usage count)
 */
export async function applyPromoCode(promoCodeId: string): Promise<void> {
  await prisma.promoCode.update({
    where: { id: promoCodeId },
    data: {
      currentUses: {
        increment: 1,
      },
    },
  });
}

/**
 * Apply promo code by code string (increment usage count)
 */
export async function applyPromoCodeByCode(code: string): Promise<void> {
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!promoCode) {
    throw new Error("Promo code not found");
  }

  await prisma.promoCode.update({
    where: { id: promoCode.id },
    data: {
      currentUses: {
        increment: 1,
      },
    },
  });
}

/**
 * Create a new promo code
 */
export async function createPromoCode(
  data: PromoCodeData
): Promise<{ success: boolean; promoCode?: PromoCode; error?: string }> {
  try {
    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
        applicablePlans: data.applicablePlans || [],
      },
    });

    return { success: true, promoCode };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
      return { success: false, error: "Promo code already exists" };
    }
    return { success: false, error: "Failed to create promo code" };
  }
}

/**
 * Get all promo codes
 */
export async function getAllPromoCodes() {
  return await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Update promo code
 */
export async function updatePromoCode(
  id: string,
  data: Partial<PromoCodeData> & { isActive?: boolean }
) {
  try {
    const updateData: Partial<PromoCode> = {};

    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.discountType !== undefined)
      updateData.discountType = data.discountType;
    if (data.discountValue !== undefined)
      updateData.discountValue = data.discountValue;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.applicablePlans !== undefined)
      updateData.applicablePlans = data.applicablePlans;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    return { success: true, promoCode };
  } catch (_error: unknown) {
    return { success: false, error: "Failed to update promo code" };
  }
}

/**
 * Delete promo code
 */
export async function deletePromoCode(id: string) {
  try {
    await prisma.promoCode.delete({
      where: { id },
    });
    return { success: true };
  } catch (_error: unknown) {
    return { success: false, error: "Failed to delete promo code" };
  }
}
