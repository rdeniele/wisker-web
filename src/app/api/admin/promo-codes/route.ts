import { NextRequest, NextResponse } from "next/server";
import {
  createPromoCode,
  getAllPromoCodes,
  updatePromoCode,
  deletePromoCode,
  PromoCodeData,
} from "@/service/promo.service";
import { getAdminUser } from "@/lib/admin-auth";

// GET - Get all promo codes
export async function GET() {
  try {
    const { isAdmin } = await getAdminUser();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const promoCodes = await getAllPromoCodes();
    return NextResponse.json({ promoCodes });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo codes" },
      { status: 500 }
    );
  }
}

// POST - Create new promo code
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await getAdminUser();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (
      !data.code ||
      !data.description ||
      !data.discountType ||
      data.discountValue === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const promoData: PromoCodeData = {
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      applicablePlans: data.applicablePlans || [],
    };

    const result = await createPromoCode(promoData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ promoCode: result.promoCode }, { status: 201 });
  } catch (error) {
    console.error("Error creating promo code:", error);
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}

// PATCH - Update promo code
export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin } = await getAdminUser();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Promo code ID is required" },
        { status: 400 }
      );
    }

    // Convert expiresAt to Date if provided
    if (data.expiresAt) {
      data.expiresAt = new Date(data.expiresAt);
    }

    const result = await updatePromoCode(id, data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ promoCode: result.promoCode });
  } catch (error) {
    console.error("Error updating promo code:", error);
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    );
  }
}

// DELETE - Delete promo code
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin } = await getAdminUser();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Promo code ID is required" },
        { status: 400 }
      );
    }

    const result = await deletePromoCode(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}
