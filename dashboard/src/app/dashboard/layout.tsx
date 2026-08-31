import type { Metadata } from "next";
import DashboardShell from "./dashboard-shell";

export const metadata: Metadata = {
  title: "Rescue Operations — Disaster Response Dashboard",
  description: "Coordinator dashboard for emergency requests",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}