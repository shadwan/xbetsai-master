import { Section, Text, Button, Hr } from "@react-email/components";
import * as React from "react";
import Layout, { brandColor, textColor, mutedColor } from "./components/Layout";

interface PasswordResetEmailProps {
  name: string;
  resetCode: string;
  resetUrl: string;
}

export default function PasswordResetEmail({
  name = "there",
  resetCode = "123456",
  resetUrl = "https://xbetsai.com/reset",
}: PasswordResetEmailProps) {
  return (
    <Layout preview="Reset your xBetsAI password">
      <Text
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: textColor,
          margin: "0 0 16px",
        }}
      >
        Reset Your Password
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: textColor,
          lineHeight: "24px",
          margin: "0 0 16px",
        }}
      >
        Hey {name}, we received a request to reset your password. Use the code
        below or click the button to set a new password.
      </Text>
      <Section
        style={{
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
          padding: "24px",
          textAlign: "center" as const,
          margin: "24px 0",
        }}
      >
        <Text
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: brandColor,
            letterSpacing: "4px",
            margin: 0,
            fontFamily: "monospace",
          }}
        >
          {resetCode}
        </Text>
      </Section>
      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Button
          href={resetUrl}
          style={{
            backgroundColor: brandColor,
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 600,
            padding: "12px 32px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Reset Password
        </Button>
      </Section>
      <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "20px",
          margin: 0,
        }}
      >
        If you didn&apos;t request this, you can safely ignore this email. This
        code expires in 15 minutes.
      </Text>
    </Layout>
  );
}
