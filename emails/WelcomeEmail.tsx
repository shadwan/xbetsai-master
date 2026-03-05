import { Section, Text, Button, Hr } from "@react-email/components";
import * as React from "react";
import Layout, { brandColor, textColor, mutedColor } from "./components/Layout";

interface WelcomeEmailProps {
  name: string;
  appUrl: string;
}

export default function WelcomeEmail({
  name = "there",
  appUrl = "https://xbetsai.com",
}: WelcomeEmailProps) {
  return (
    <Layout preview={`Welcome to xBetsAI, ${name}!`}>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: textColor,
          margin: "0 0 16px",
        }}
      >
        Welcome to xBetsAI!
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: textColor,
          lineHeight: "24px",
          margin: "0 0 16px",
        }}
      >
        Hey {name}, thanks for signing up! You now have access to AI-powered
        sports betting intelligence that helps you make smarter decisions.
      </Text>
      <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
      <Text
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: textColor,
          margin: "0 0 12px",
        }}
      >
        Here&apos;s what you can do:
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; Browse real-time odds across major sportsbooks
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; Get AI-driven insights and arbitrage opportunities
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 24px",
        }}
      >
        &bull; Subscribe for premium features and alerts
      </Text>
      <Section style={{ textAlign: "center" as const }}>
        <Button
          href={appUrl}
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
          Get Started
        </Button>
      </Section>
    </Layout>
  );
}
