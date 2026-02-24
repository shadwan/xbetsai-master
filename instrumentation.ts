export const runtime = "nodejs";

export async function register(): Promise<void> {
	if (process.env.NEXT_RUNTIME !== "nodejs") return;
	const { bootstrap } = await import("@/src/lib/realtime/bootstrap");
	await bootstrap();
}
