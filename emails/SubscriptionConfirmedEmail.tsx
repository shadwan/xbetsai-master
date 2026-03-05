import { Section, Text, Button, Hr } from "@react-email/components";
import * as React from "react";
import Layout, { brandColor, textColor, mutedColor } from "./components/Layout";

interface SubscriptionConfirmedEmailProps {
  name: string;
  planName: string;
  appUrl: string;
}

export default function SubscriptionConfirmedEmail({
  name = "there",
  planName = "Pro",
  appUrl = "https://xbetsai.com",
}: SubscriptionConfirmedEmailProps) {
  return (
    <Layout preview={`Your ${planName} subscription is active!`}>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: textColor,
          margin: "0 0 16px",
        }}
      >
        Subscription Confirmed!
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: textColor,
          lineHeight: "24px",
          margin: "0 0 16px",
        }}
      >
        Hey {name}, your <strong>{planName}</strong> subscription is now active.
        You have full access to all premium features.
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
        What you get with {planName}:
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; Real-time arbitrage alerts across all sportsbooks
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; AI-powered betting predictions and analysis
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; Positive EV bet finder with customizable thresholds
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 24px",
        }}
      >
        &bull; Priority customer support
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
          Explore Premium Features
        </Button>
      </Section>
    </Layout>
  );
}
