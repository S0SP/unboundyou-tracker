import { withAuth } from "next-auth/middleware";

// NextAuth middleware helper
const authProxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

// Support both named and default exports for robustness under the new Next.js 16 proxy convention
export { authProxy as default, authProxy as proxy };

// Path protection matches
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
