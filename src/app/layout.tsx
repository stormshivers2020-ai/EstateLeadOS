import type { Metadata } from "next";
import { LocalStateHydrator } from "@/components/platform/LocalStateHydrator";
import { AppProviders } from "@/components/providers/AppProviders";
import { APP_NAME, POWERED_BY, TAGLINE } from "@/lib/constants/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Powered by ${POWERED_BY}`,
    template: `%s | ${APP_NAME}`,
  },
  description: TAGLINE,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <AppProviders>
          <LocalStateHydrator />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
