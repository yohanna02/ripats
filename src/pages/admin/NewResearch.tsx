import { NewResearchPage } from "../../features/research/screens";

export default function NewResearch({ archive = false }: { archive?: boolean }) {
  return <NewResearchPage admin archive={archive} />;
}
