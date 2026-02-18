"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import PhotoUploader from "./PhotoUploader";

interface OrganizerProfileFormProps {
  profile: {
    id: string;
    org_name: string;
    description: string | null;
    logo_url: string | null;
  } | null;
}

export default function OrganizerProfileForm({ profile }: OrganizerProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [orgName, setOrgName] = useState(profile?.org_name || "");
  const [description, setDescription] = useState(profile?.description || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(profile?.logo_url || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    if (profile) {
      await supabase
        .from("organizer_profiles")
        .update({ org_name: orgName, description, logo_url: logoUrl })
        .eq("id", profile.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("organizer_profiles").insert({
        user_id: user!.id,
        org_name: orgName,
        description,
        logo_url: logoUrl,
      });
      await supabase.from("users").update({ role: "organizer" }).eq("id", user!.id);
    }

    setLoading(false);
    setSuccess(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input id="orgName" label="Organization Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Trail Runners PH" required />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-coral-500 focus:ring-2 focus:ring-coral-200 outline-none transition-colors"
          placeholder="Tell adventurers about your organization..."
        />
      </div>

      <PhotoUploader bucket="organizers" path="logos" value={logoUrl} onChange={setLogoUrl} label="Logo" />

      {success && <p className="text-sm text-forest-500">Profile saved!</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
