import { Section, Text, Button, Hr } from "@react-email/components";
import * as React from "react";
import Layout, { textColor, mutedColor } from "./components/Layout";

interface PaymentFailedEmailProps {
  name: string;
  amount: string;
  updateBillingUrl: string;
}

export default function PaymentFailedEmail({
  name = "there",
  amount = "$29.99",
  updateBillingUrl = "https://xbetsai.com/settings/billing",
}: PaymentFailedEmailProps) {
  return (
    <Layout preview="Action required: Your payment failed">
      <Section
        style={{
          backgroundColor: "#fef2f2",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#dc2626",
            margin: 0,
          }}
        >
          Payment Failed &mdash; Action Required
        </Text>
      </Section>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: textColor,
          margin: "0 0 16px",
        }}
      >
        Payment Issue
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: textColor,
          lineHeight: "24px",
          margin: "0 0 16px",
        }}
      >
        Hey {name}, we were unable to process your payment of{" "}
        <strong>{amount}</strong>. Please update your billing information to
        avoid any interruption to your service.
      </Text>
      <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        Common reasons for payment failure:
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; Expired credit or debit card
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 8px",
        }}
      >
        &bull; Insufficient funds
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "24px",
          margin: "0 0 24px",
        }}
      >
        &bull; Card issuer declined the transaction
      </Text>
      <Section style={{ textAlign: "center" as const }}>
        <Button
          href={updateBillingUrl}
          style={{
            backgroundColor: "#dc2626",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 600,
            padding: "12px 32px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Update Billing Info
        </Button>
      </Section>
      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "20px",
          margin: "24px 0 0",
          textAlign: "center" as const,
        }}
      >
        We&apos;ll automatically retry the payment in a few days.
      </Text>
    </Layout>
  );
}
