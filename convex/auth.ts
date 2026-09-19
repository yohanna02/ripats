import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = params.email;
        const name = params.name;
        if (typeof email !== "string" || typeof name !== "string") {
          throw new Error("Name and email are required.");
        }
        return { email: email.trim().toLowerCase(), name: name.trim() };
      },
    }),
  ],
});
