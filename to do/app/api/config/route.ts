export const dynamic = "force-dynamic";

// 팀 보드(public/team.html)가 Supabase 접속 정보를 받아가는 경로.
// publishable 키는 공개용이라 클라이언트에 내려줘도 안전.
export async function GET() {
  return Response.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  });
}
