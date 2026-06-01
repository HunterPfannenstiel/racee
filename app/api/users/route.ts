import { NextResponse } from "next/server";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";

const userRepo = new PrismaUserRepository();

export async function GET() {
  const users = await userRepo.findAll();
  return NextResponse.json(users.map(u => ({ id: u.userId, name: u.name, isAdmin: u.isAdmin })));
}
