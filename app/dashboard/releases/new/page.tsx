import { getArtists, getLabel } from "@/lib/queries";
import { PageHeader } from "@/lib/ui";
import { NewReleaseForm } from "./NewReleaseForm";

export const dynamic = "force-dynamic";

export default async function NewReleasePage() {
  const { label } = await getLabel();
  const artists = label ? await getArtists(label.id) : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Catalogue"
        title="New release"
        description="Draft your release now — you can add audio and artwork before delivery."
      />
      <NewReleaseForm artists={artists.map((a) => ({ id: a.id, name: a.name }))} />
    </div>
  );
}
