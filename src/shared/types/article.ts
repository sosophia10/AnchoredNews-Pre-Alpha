/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Defines the shared article and trend data contracts used across the
 * rebuilt dashboard without changing the exported content model.
 */

export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  country: string;
  countryCode: string;
  topic: string;
  publishedDate: string;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  entities: string[];
  keywords: string[];
  lat: number;
  lng: number;
}

export interface CountryCentroid {
  countryCode: string;
  country: string;
  lat: number;
  lng: number;
}

export interface TrendSeriesPoint {
  countryCode: string;
  country: string;
  articleCount: number;
}

export interface TrendData {
  date: string;
  topic: string;
  series: TrendSeriesPoint[];
}
