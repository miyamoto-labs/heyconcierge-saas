import { NextRequest, NextResponse } from "next/server";
import { getAllSkills, createSkill, getCategories } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

// GET /api/skills - List all skills with filters
export async function GET(request: NextRequest) {
  try {
    // Ensure database is seeded
    seedDatabase();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const sort = (searchParams.get("sort") as "downloads" | "rating" | "newest") || "downloads";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const skills = getAllSkills({ category, search, sort, limit });
    const categories = ["All", ...getCategories()];

    return NextResponse.json({
      skills,
      categories,
      total: skills.length,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}

// POST /api/skills - Create new skill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["id", "name", "description", "author_id", "category"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const skill = createSkill({
      id: body.id,
      name: body.name,
      description: body.description,
      long_description: body.long_description || null,
      author_id: body.author_id,
      category: body.category,
      tags: body.tags || [],
      price: body.price || 0,
      verified: body.verified || false,
      version: body.version || "1.0.0",
      success_rate: body.success_rate || 0,
      install_command: body.install_command || `openclaw skill install ${body.id}`,
      requirements: body.requirements || [],
      endpoints: body.endpoints || [],
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}
