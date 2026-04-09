import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@repo/db/client";
import { z } from "zod";

// ── Input validation schema ───────────────────────────────────────────────────
const SignupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters")
      .regex(/^[\p{L}\s'-]+$/u, "Name contains invalid characters"),
    email: z
      .string()
      .email("Invalid email address")
      .max(254, "Email too long")
      .transform((v) => v.toLowerCase().trim()),
    phone: z
      .string()
      .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    // ── 1. Parse & validate body ─────────────────────────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstError?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;

    // ── 2. Check duplicates ──────────────────────────────────────────────────
    const existingUser = await db.user.findUnique({
      where: { number: phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this phone number already exists" },
        { status: 409 }
      );
    }

    // ── 3. Hash password & create user ───────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12); // cost factor 12

    const user = await db.user.create({
      data: {
        name,
        email,
        number: phone,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
