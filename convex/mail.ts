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

function emailConfigurationError() {
  return new Error(
    "Email delivery is not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM, or set SMTP_HOST, SMTP_USER, SMTP_PASS, and AUTH_EMAIL_FROM.",
  );
}

async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const from = env.AUTH_EMAIL_FROM;
  if (!from) throw emailConfigurationError();

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [args.to], subject: args.subject, text: args.text, html: args.html }),
    });
    if (!response.ok) {
      throw new Error(`Resend could not deliver the email (${response.status}).`);
    }
    return;
  }

  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  if (!host || !user || !pass) throw emailConfigurationError();

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
  await transporter.sendMail({ from, ...args });
}

export const sendAuthCode = internalAction({
  args: authCodeArgs,
  returns: v.null(),
  handler: async (_ctx, args) => {
    const subject =
      args.purpose === "verification"
        ? "Your RIPATS verification code"
        : "Reset your RIPATS password";
    const description =
      args.purpose === "verification"
        ? "Use this code to verify your RIPATS email address."
        : "Use this code to reset your RIPATS password.";

    await sendEmail({
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
    await sendEmail({
      to: args.to,
      subject: `New RIPATS access request · ${args.researchCode}`,
      text: `Hello ${args.ownerName}, ${args.requesterName} requested access to ${args.researchTitle} (${args.researchCode}) for ${args.durationHours} hours. Purpose: ${args.purpose}. Review it in RIPATS at ${args.reviewRoute}.`,
      html: `<p>Hello ${args.ownerName},</p><p><strong>${args.requesterName}</strong> requested access to <strong>${args.researchTitle}</strong> (${args.researchCode}) for ${args.durationHours} hours.</p><p><strong>Purpose:</strong> ${args.purpose}</p><p>Open RIPATS to review and approve or decline this request.</p>`,
    });
    return null;
  },
});

export const sendAccessGrantNotice = internalAction({
  args: {
    to: v.string(),
    requesterName: v.string(),
    researchTitle: v.string(),
    researchCode: v.string(),
    accessCode: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const expiry = new Date(args.expiresAt).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    });
    await sendEmail({
      to: args.to,
      subject: `RIPATS access approved · ${args.researchCode}`,
      text: `Hello ${args.requesterName}, your request to access ${args.researchTitle} (${args.researchCode}) was approved. Your activation code is ${args.accessCode}. Enter it in My access requests to activate this device. Access expires ${expiry}.`,
      html: `<p>Hello ${args.requesterName},</p><p>Your request to access <strong>${args.researchTitle}</strong> (${args.researchCode}) was approved.</p><p>Your activation code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${args.accessCode}</p><p>Enter this code in <strong>My access requests</strong> to activate this device. Access expires ${expiry}.</p>`,
    });
    return null;
  },
});
