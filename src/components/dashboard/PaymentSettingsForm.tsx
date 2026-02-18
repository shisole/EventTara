"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

interface PaymentSettingsFormProps {
  profileId: string;
  paymentInfo: {
    gcash_number?: string;
    maya_number?: string;
  };
}

export default function PaymentSettingsForm({ profileId, paymentInfo }: PaymentSettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [gcashNumber, setGcashNumber] = useState(paymentInfo.gcash_number || "");
  const [mayaNumber, setMayaNumber] = useState(paymentInfo.maya_number || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    await supabase
      .from("organizer_profiles")
      .update({
        payment_info: {
          gcash_number: gcashNumber,
          maya_number: mayaNumber,
        },
      })
      .eq("id", profileId);

    setLoading(false);
    setSuccess(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input id="gcash" label="GCash Number" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} placeholder="09XX XXX XXXX" />
      <Input id="maya" label="Maya Number" value={mayaNumber} onChange={(e) => setMayaNumber(e.target.value)} placeholder="09XX XXX XXXX" />

      {success && <p className="text-sm text-forest-500">Payment settings saved!</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Payment Settings"}
      </Button>
    </form>
  );
}
