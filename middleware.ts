import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublic = createRouteMatcher([
  "/",
  "/features",
  "/sign-in",
  "/sign-up",
  "/api/(.*)",
  "/subscribe",
]);

const isAuth = createRouteMatcher(["/sign-in", "/sign-up"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();

  // Redirect authenticated users away from auth pages
  if (isAuth(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/app");
  }

  // Redirect unauthenticated users to sign-in for protected routes
  if (!isPublic(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
