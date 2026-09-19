import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import type {
  EmailConfig,
  GenericActionCtxWithAuthConfig,
} from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

type EmailRequest = Parameters<EmailConfig["sendVerificationRequest"]>[0];
type AuthContext = GenericActionCtxWithAuthConfig<DataModel>;

async function sendAuthCode(
  { identifier, token }: EmailRequest,
  ctx?: AuthContext,
  purpose: "verification" | "reset" = "verification",
) {
  if (!ctx) {
    throw new Error("SMTP email delivery requires a Convex action context.");
  }
  await ctx.runAction(internal.mail.sendAuthCode, {
    to: identifier,
    token,
    purpose,
  });
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = params.email;
        const name = params.name;
        if (typeof email !== "string")
          throw new Error("An email address is required.");
        const cleanName =
          typeof name === "string" ? name.trim() : "RIPATS user";
        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
          throw new Error("Enter a valid email address.");
        if (params.flow === "signUp" && cleanName === "")
          throw new Error("Name is required.");
        return { email: normalizedEmail, name: cleanName };
      },
      verify: Email({
        async sendVerificationRequest(params, ctx?: AuthContext) {
          await sendAuthCode(params, ctx, "verification");
        },
      }),
      reset: Email({
        async sendVerificationRequest(params, ctx?: AuthContext) {
          await sendAuthCode(params, ctx, "reset");
        },
      }),
    }),
  ],
});
