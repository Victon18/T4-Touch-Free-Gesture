import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@repo/db/client";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, confirmPassword } = await req.json();

    if (!name || !email || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        number: phone,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this phone number already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
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
