import React from "react";
import type { Metadata } from "next";
import { SubmitStoryClient } from "./SubmitStoryClient";

export const metadata: Metadata = {
  title: "Submit a Story",
  description:
    "Share important news, student experiences and meaningful developments within our communities for editorial review.",
};

export default function SubmitStoryPage() {
  return <SubmitStoryClient />;
}
