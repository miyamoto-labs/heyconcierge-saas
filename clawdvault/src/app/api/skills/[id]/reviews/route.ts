import { NextRequest, NextResponse } from "next/server";
import { getSkillReviews, addReview, getSkillById } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

// GET /api/skills/[id]/reviews - Get reviews for a skill
export async function GET(
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

    const reviews = getSkillReviews(id);

    return NextResponse.json({
      reviews,
      total: reviews.length,
      skill_id: id,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/skills/[id]/reviews - Add a review
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

    const body = await request.json();

    if (!body.user_id || !body.rating) {
      return NextResponse.json(
        { error: "user_id and rating are required" },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const review = addReview({
      skill_id: id,
      user_id: body.user_id,
      rating: body.rating,
      comment: body.comment || null,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error adding review:", error);
    return NextResponse.json(
      { error: "Failed to add review" },
      { status: 500 }
    );
  }
}
