import { testDatabaseConnection } from "../../../lib/db";

export const prerender = false;

export async function GET() {
  try {
    const result = await testDatabaseConnection();
    return new Response(JSON.stringify({ status: "ok", result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ status: "error", message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
