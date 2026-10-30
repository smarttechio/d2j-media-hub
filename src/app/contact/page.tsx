import React from "react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db";
import { ContactClient } from "./ContactClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions, editorial feedback, corrections, story leads and partnership enquiries for D2J Media Hub.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string }>;
}) {
  const { enquiry = "" } = await searchParams;
  const settings = getSiteSettings();
  return <ContactClient initialEnquiry={enquiry} settings={settings} />;
}
