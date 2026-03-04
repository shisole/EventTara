"use client";

import { usePathname } from "next/navigation";

import { StravaIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { STRAVA_AUTH_URL, STRAVA_SCOPES } from "@/lib/strava/constants";

interface StravaConnectButtonProps {
  /** URL to redirect back to after Strava OAuth completes. Defaults to current path. */
  returnUrl?: string;
}

export default function StravaConnectButton({ returnUrl }: StravaConnectButtonProps) {
  const pathname = usePathname();

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    if (!clientId) {
      console.error("[Strava] NEXT_PUBLIC_STRAVA_CLIENT_ID is not configured");
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${globalThis.location.origin}/auth/strava/callback`,
      response_type: "code",
      scope: STRAVA_SCOPES.join(","),
      state: JSON.stringify({ flow: "connect", returnUrl: returnUrl ?? pathname }),
      approval_prompt: "auto",
    });

    globalThis.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
  };

  return (
    <Button
      onClick={handleConnect}
      className="bg-[#FC4C02] hover:bg-[#E34402] text-white"
      size="md"
    >
      <StravaIcon className="w-5 h-5 mr-2" />
      Connect with Strava
    </Button>
  );
}
