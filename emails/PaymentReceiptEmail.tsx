import { Section, Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import Layout, { textColor, mutedColor } from "./components/Layout";

interface PaymentReceiptEmailProps {
  name: string;
  amount: string;
  currency: string;
  date: string;
  invoiceId: string;
  planName: string;
  periodStart: string;
  periodEnd: string;
}

export default function PaymentReceiptEmail({
  name = "there",
  amount = "$29.99",
  currency = "USD",
  date = "March 4, 2026",
  invoiceId = "INV-001",
  planName = "Pro",
  periodStart = "Mar 4, 2026",
  periodEnd = "Apr 4, 2026",
}: PaymentReceiptEmailProps) {
  return (
    <Layout preview={`Payment receipt for ${amount}`}>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: textColor,
          margin: "0 0 16px",
        }}
      >
        Payment Receipt
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: textColor,
          lineHeight: "24px",
          margin: "0 0 24px",
        }}
      >
        Hey {name}, here&apos;s your payment confirmation.
      </Text>

      <Section
        style={{
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
          padding: "24px",
          margin: "0 0 24px",
        }}
      >
        <Text
          style={{
            fontSize: "14px",
            color: mutedColor,
            margin: "0 0 4px",
          }}
        >
          Amount Paid
        </Text>
        <Text
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: textColor,
            margin: "0 0 16px",
          }}
        >
          {amount} <span style={{ fontSize: "14px", color: mutedColor }}>{currency}</span>
        </Text>

        <Hr style={{ borderColor: "#d1d5db", margin: "16px 0" }} />

        <table style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0" }}>
                <Text style={{ fontSize: "14px", color: mutedColor, margin: 0 }}>
                  Date
                </Text>
              </td>
              <td style={{ padding: "4px 0", textAlign: "right" as const }}>
                <Text style={{ fontSize: "14px", color: textColor, margin: 0 }}>
                  {date}
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>
                <Text style={{ fontSize: "14px", color: mutedColor, margin: 0 }}>
                  Plan
                </Text>
              </td>
              <td style={{ padding: "4px 0", textAlign: "right" as const }}>
                <Text style={{ fontSize: "14px", color: textColor, margin: 0 }}>
                  {planName}
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>
                <Text style={{ fontSize: "14px", color: mutedColor, margin: 0 }}>
                  Period
                </Text>
              </td>
              <td style={{ padding: "4px 0", textAlign: "right" as const }}>
                <Text style={{ fontSize: "14px", color: textColor, margin: 0 }}>
                  {periodStart} &ndash; {periodEnd}
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>
                <Text style={{ fontSize: "14px", color: mutedColor, margin: 0 }}>
                  Invoice
                </Text>
              </td>
              <td style={{ padding: "4px 0", textAlign: "right" as const }}>
                <Text style={{ fontSize: "14px", color: textColor, margin: 0 }}>
                  {invoiceId}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Text
        style={{
          fontSize: "14px",
          color: mutedColor,
          lineHeight: "20px",
          margin: 0,
        }}
      >
        This is an automated receipt. No action is needed. If you have questions
        about this charge, please contact our support team.
      </Text>
    </Layout>
  );
}
