"use node";

import nodemailer from "nodemailer";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { env } from "./_generated/server";

const authCodeArgs = {
  to: v.string(),
  token: v.string(),
  purpose: v.union(v.literal("verification"), v.literal("reset")),
};

export const sendAuthCode = internalAction({
  args: authCodeArgs,
  returns: v.null(),
  handler: async (_ctx, args) => {
    const host = env.SMTP_HOST;
    const user = env.SMTP_USER;
    const pass = env.SMTP_PASS;
    const from = env.AUTH_EMAIL_FROM;
    if (!host || !user || !pass || !from) {
      throw new Error(
        "SMTP email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and AUTH_EMAIL_FROM.",
      );
    }

    const port = Number(env.SMTP_PORT ?? "465");
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error("SMTP_PORT must be a valid port number.");
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: env.SMTP_SECURE !== "false",
      auth: { user, pass },
    });
    const subject =
      args.purpose === "verification"
        ? "Your RIPATS verification code"
        : "Reset your RIPATS password";
    const description =
      args.purpose === "verification"
        ? "Use this code to verify your RIPATS email address."
        : "Use this code to reset your RIPATS password.";

    await transporter.sendMail({
      from,
      to: args.to,
      subject,
      text: `${description} Your code is ${args.token}. It expires in one hour.`,
      html: `<p>${description}</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${args.token}</p><p>This code expires in one hour. If you did not request this, ignore this email.</p>`,
    });
    return null;
  },
});

export const sendAccessRequestNotice = internalAction({
  args: {
    to: v.string(),
    ownerName: v.string(),
    requesterName: v.string(),
    researchTitle: v.string(),
    researchCode: v.string(),
    purpose: v.string(),
    durationHours: v.number(),
    reviewRoute: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const host = env.SMTP_HOST;
    const user = env.SMTP_USER;
    const pass = env.SMTP_PASS;
    const from = env.AUTH_EMAIL_FROM;
    if (!host || !user || !pass || !from) {
      throw new Error(
        "SMTP email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and AUTH_EMAIL_FROM.",
      );
    }
    const port = Number(env.SMTP_PORT ?? "465");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: env.SMTP_SECURE !== "false",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: args.to,
      subject: `New RIPATS access request · ${args.researchCode}`,
      text: `Hello ${args.ownerName}, ${args.requesterName} requested access to ${args.researchTitle} (${args.researchCode}) for ${args.durationHours} hours. Purpose: ${args.purpose}. Review it in RIPATS at ${args.reviewRoute}.`,
      html: `<p>Hello ${args.ownerName},</p><p><strong>${args.requesterName}</strong> requested access to <strong>${args.researchTitle}</strong> (${args.researchCode}) for ${args.durationHours} hours.</p><p><strong>Purpose:</strong> ${args.purpose}</p><p>Open RIPATS to review and approve or decline this request.</p>`,
    });
    return null;
  },
});
