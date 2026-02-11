import { NextRequest, NextResponse } from "next/server";
import { incrementDownloads, getSkillById, createPurchase } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

// POST /api/skills/[id]/install - Track an install
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    seedDatabase();
    
    const { id } = await params;
    const skill = getSkillById(id);

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    // Get user wallet from body
    let walletAddress: string | undefined;
    try {
      const body = await request.json();
      walletAddress = body.wallet_address;
    } catch {
      // Body is optional
    }

    // For paid skills, create a purchase record
    if (skill.price > 0 && walletAddress) {
      createPurchase({
        skill_id: id,
        wallet_address: walletAddress.toLowerCase(),
        price: skill.price,
        tx_hash: null, // Will be updated after actual payment
        chain: 'base', // Default chain
      });
    }

    incrementDownloads(id, walletAddress);

    // Get updated skill
    const updatedSkill = getSkillById(id);

    return NextResponse.json({
      success: true,
      skill_id: id,
      downloads: updatedSkill?.downloads,
      price: skill.price,
      requires_payment: skill.price > 0,
    });
  } catch (error) {
    console.error("Error tracking install:", error);
    return NextResponse.json(
      { error: "Failed to track install" },
      { status: 500 }
    );
  }
}
