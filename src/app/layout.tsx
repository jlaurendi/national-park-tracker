import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { MigrationDialog } from "@/components/account/MigrationDialog";
import { TripVisitsDialog } from "@/components/trips/TripVisitsDialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Park Tracker",
    template: "%s · Park Tracker",
  },
  description:
    "Track your visits to all 63 US national parks — plan trips, set goals, earn badges, and build a photo scrapbook.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreProvider>
          <AppShell>{children}</AppShell>
          <MigrationDialog />
          <TripVisitsDialog />
        </StoreProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
