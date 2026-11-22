import { Plus } from "lucide-react";
import { getArtists, getLabel } from "@/lib/queries";
import { Artwork, Empty, PageHeader } from "@/lib/ui";
import { createArtist } from "../releases/actions";
import { ArtistForm } from "./ArtistForm";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const { label } = await getLabel();
  if (!label) return <Empty text="No label workspace on this account." />;

  const artists = await getArtists(label.id);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Roster"
        title="Artists"
        description="Everyone signed to the label, with their catalogue count."
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-line">
          {artists.length === 0 ? (
            <Empty text="No artists on the roster yet. Add your first one on the right." />
          ) : (
            <ul className="divide-y divide-line">
              {artists.map((a) => (
                <li key={a.id} className="flex items-center gap-3.5 px-5 py-4">
                  <Artwork url={a.image_url} alt={a.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="truncate text-xs text-mute">
                      {a.bio ?? "No bio yet"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-mute ring-1 ring-white/10 ring-inset">
                    {a.releases?.length ?? 0} release{(a.releases?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-fit rounded-xl border border-line bg-ink-soft p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-lime" />
            <h2 className="text-sm font-medium">Add an artist</h2>
          </div>
          <p className="mt-1.5 text-xs text-mute">
            They will appear in the release form so you can credit them properly.
          </p>
          <ArtistForm action={createArtist} />
        </div>
      </div>
    </div>
  );
}
