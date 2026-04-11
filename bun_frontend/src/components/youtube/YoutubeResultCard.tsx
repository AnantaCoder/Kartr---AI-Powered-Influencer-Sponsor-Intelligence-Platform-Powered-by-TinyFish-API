import type { YoutubeResult } from "@/features/schemas/youtubeSchema"
import dummyimg from "@/assets/auth/analytics_img2.png";

type Props = {
  result: YoutubeResult
}

const YoutubeResultCard: React.FC<Props> = ({ result }: Props) => {
  const {
    thumbnail_url,
    title,
    description,
    view_count,
    like_count,
    analysis,
  } = result || {}

  const isSponsored = analysis?.is_sponsored
  const sponsorName = analysis?.sponsor_name
  const sponsorIndustry = analysis?.sponsor_industry
  const influencerNiche = analysis?.influencer_niche
  const keyTopics = analysis?.key_topics || []

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md">

      {/* THUMBNAIL */}
      <div className="w-full bg-gray-100">
        <img
          src={thumbnail_url || dummyimg}
          alt={title || "YouTube thumbnail"}
          className="w-full h-60 object-cover"
          onError={(e) => {
            e.currentTarget.src = dummyimg
          }}
        />
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-3 text-sm text-gray-800">

        {/* TITLE */}
        <p className="text-center text-base font-semibold leading-snug">
          {title || "Untitled Video"}
        </p>

        {/* STATS */}
        <div className="flex justify-center gap-6 text-gray-600 text-xs">
          <span>
            👀 {typeof view_count === "number" ? view_count.toLocaleString() : "—"}
          </span>
          <span>
            👍 {typeof like_count === "number" ? like_count.toLocaleString() : "—"}
          </span>
        </div>

        {/* DESCRIPTION */}
        {description && (
          <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* ANALYSIS */}
        <div className="pt-2 space-y-2">

          {/* SPONSOR INFO */}
          {isSponsored && (
            <div className="rounded-lg bg-purple-50 p-3 text-xs">
              <p className="font-semibold text-purple-700">
                Sponsored Content
              </p>

              <p>
                <span className="font-medium">Brand:</span>{" "}
                {sponsorName || "Unknown"}
              </p>

              <p>
                <span className="font-medium">Industry:</span>{" "}
                {sponsorIndustry || "Not specified"}
              </p>
            </div>
          )}

          {/* NICHE */}
          {influencerNiche && (
            <p className="text-xs">
              <span className="font-semibold">Niche:</span>{" "}
              {influencerNiche}
            </p>
          )}

          {/* KEY TOPICS */}
          {keyTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {keyTopics.map((topic: string, index: number) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default YoutubeResultCard
