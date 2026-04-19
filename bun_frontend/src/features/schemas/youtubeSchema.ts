
export type Sponsor = {
  name?: string
  industry?: string
}

export type YoutubeAnalysis = {
  is_sponsored?: boolean
  sponsor_name?: string
  sponsor_industry?: string
  influencer_niche?: string
  content_summary?: string
  sentiment?: string
  key_topics?: string[]
  hook_rating?: "High" | "Medium" | "Low"
  retention_risk?: "High" | "Medium" | "Low"
  brand_safety_score?: number
  cpm_estimate?: string
  video_category?: string
  error?: string
}

export type Recommendation = {
  name: string
  industry?: string
  fit_score: number
  reason: string
  handle?: string
  subscribers?: string
  engagement_rate?: number
  logo_url?: string
}

export type YoutubeResult = {
  video_id: string

  title: string
  description?: string

  thumbnail_url?: string

  view_count?: number
  like_count?: number

  channel_name?: string
  creator_name?: string
  creator_industry?: string


  sponsors?: Sponsor[]

  analysis?: YoutubeAnalysis
  recommendations?: Recommendation[]
  model_used?: string
}

export type CommentsAnalysisResponse = {
  video_id: string
  total_comments_analyzed: number
  overall_sentiment: string
  sentiment_distribution: {
    positive: number
    neutral: number
    negative: number
  }
  key_themes: string[]
  audience_questions: string[]
  brand_mentions: string[]
  top_comments: {
    author: string
    text: string
    sentiment: string
  }[]
  error?: string
}
