import { useRealtimeKitMeeting } from "@cloudflare/realtimekit-react";
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui";

export default function SFUCallUI() {
  const { meeting } = useRealtimeKitMeeting();
  return <RtkMeeting mode="fill" meeting={meeting} showSetupScreen={true} />;
}
