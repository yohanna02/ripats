import { RegistryPage } from "../../features/research/screens";

export default function ResearchRegistry({
  archive = false,
}: {
  archive?: boolean;
}) {
  return <RegistryPage admin archive={archive} />;
}
