import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img,
  Preview,
  Font,
} from "@react-email/components";
import * as React from "react";

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

const brandColor = "#6366f1";
const bgColor = "#f9fafb";
const cardBg = "#ffffff";
const textColor = "#111827";
const mutedColor = "#6b7280";

export default function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: bgColor,
          fontFamily: "Inter, Arial, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          {/* Header */}
          <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
            <Text
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: brandColor,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              xBetsAI
            </Text>
          </Section>

          {/* Card */}
          <Section
            style={{
              backgroundColor: cardBg,
              borderRadius: "12px",
              padding: "40px 32px",
              border: "1px solid #e5e7eb",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ marginTop: "32px", textAlign: "center" as const }}>
            <Hr style={{ borderColor: "#e5e7eb", margin: "0 0 16px" }} />
            <Text
              style={{
                color: mutedColor,
                fontSize: "12px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              xBetsAI &middot; AI-Powered Sports Betting Intelligence
            </Text>
            <Text
              style={{
                color: mutedColor,
                fontSize: "12px",
                lineHeight: "20px",
                margin: "4px 0 0",
              }}
            >
              You&apos;re receiving this because you have an account at xBetsAI.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export { brandColor, bgColor, cardBg, textColor, mutedColor };
