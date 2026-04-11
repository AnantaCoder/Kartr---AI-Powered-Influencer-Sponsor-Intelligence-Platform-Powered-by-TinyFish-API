import React from "react"
import type { YoutubeResult } from "@/features/schemas/youtubeSchema"
import AnalysisDashboard from "./AnalysisDashboard"
import YoutubeResultCard from "./YoutubeResultCard"

interface Props {
  results: YoutubeResult[]
}

const YoutubeResults: React.FC<Props> = ({ results }) => {
  if (results.length === 0) {
    return <p className="text-sm text-gray-500 text-center">No results found</p>
  }

  // If we have results, deciding how to show them. 
  // For a detailed analysis (Deep Dive), the Dashboard is best. 
  // If multiple results come back (e.g. from a search term), we might want Cards.
  // But the current flow is "Paste URL" -> "Analyze", which is 1:1.
  // So we will render the Dashboard for the results.

  return (
    <div className="space-y-12">
      {results.map((result) => (
        <AnalysisDashboard key={result.video_id} result={result} />
      ))}
    </div>
  )
}

export default YoutubeResults
