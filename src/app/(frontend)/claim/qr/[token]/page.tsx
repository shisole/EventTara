import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import QRClaimClient from "./QRClaimClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();

  const { data: code } = await supabase
    .from("qr_claim_codes")
    .select("serial_number, qr_claim_batches(name, quantity, badges(title))")
    .eq("token", token)
    .single();

  const batch = code?.qr_claim_batches as {
    name: string;
    quantity: number;
    badges: { title: string } | null;
  } | null;

  return {
    title: batch?.badges?.title ? `Claim ${batch.badges.title}` : "Claim Badge",
    description: batch
      ? `Claim your exclusive "${batch.badges?.title}" badge from ${batch.name}.`
      : "Scan this QR code to claim your exclusive badge.",
  };
}

export default async function QRClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: code, error } = await supabase
    .from("qr_claim_codes")
    .select(
      "id, token, serial_number, claimed_by, claimed_at, qr_claim_batches(name, quantity, badges(id, title, description, image_url, category, rarity))",
    )
    .eq("token", token)
    .single();

  if (error || !code) {
    notFound();
  }

  const batch = code.qr_claim_batches as {
    name: string;
    quantity: number;
    badges: {
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      category: string;
      rarity: string;
    } | null;
  } | null;

  if (!batch?.badges) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md dark:bg-gray-900">
        <QRClaimClient
          token={token}
          serialNumber={code.serial_number}
          batchQuantity={batch.quantity}
          batchName={batch.name}
          badge={batch.badges}
          isClaimed={!!code.claimed_by}
        />
      </div>
    </div>
  );
}
