import { Section, Text, Button, Hr } from "@react-email/components";
import * as React from "react";
import Layout, { brandColor, textColor, mutedColor } from "./components/Layout";

interface SubscriptionCanceledEmailProps {
  name: string;
  endDate: string;
  resubscribeUrl: string;
}

export default function SubscriptionCanceledEmail({
  name = "there",
  endDate = "April 4, 2026",
  resubscribeUrl = "https://xbetsai.com/subscribe",
}: SubscriptionCanceledEmailProps) {
  return (
    <Layout preview="Your xBetsAI subscription has been canceled">
      <Text
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: textColor,
          margin: "0 0 16px",
        }}
      >
        Subscription Canceled
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: textColor,
          lineHeight: "24px",
          margin: "0 0 16px",
        }}
      >
        Hey {name}, your subscription has been canceled. You&apos;ll continue to
        have access to premium features until{" "}
        <strong>{endDate}</strong>.
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
        What you&apos;ll lose access to:
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; Real-time arbitrage alerts
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; AI-powered predictions and analysis
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 24px",
        }}
      >
        &bull; Positive EV bet finder
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: textColor,
          lineHeight: "24px",
          margin: "0 0 24px",
        }}
      >
        Changed your mind? You can resubscribe anytime to get back full access
        instantly.
      </Text>
      <Section style={{ textAlign: "center" as const }}>
        <Button
          href={resubscribeUrl}
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
          Resubscribe Now
        </Button>
      </Section>
    </Layout>
  );
}
