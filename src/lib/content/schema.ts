import { z } from 'astro/zod';

/**
 * Rights Declaration Schema
 * Enforces distinction between creator-declared originality and public domain/fair dealing citations.
 */
export const rightsDeclarationSchema = z.object({
  declaredBy: z.string().min(1, "DeclaredBy is required"),
  declarationType: z.enum([
    'Original Creator',
    'Public Domain Attributed',
    'Curated Citation'
  ]),
  status: z.enum([
    'Creator-Declared',
    'Attributed'
  ]),
  notice: z.string().min(1, "Rights notice text is required"),
  // Internal private note reference — never exposed to public frontend responses
  privateEvidenceRef: z.string().optional()
});

/**
 * Quote Source Schema
 * Captures historical/bibliographic citation data with explicit verification flag.
 */
export const quoteSourceSchema = z.object({
  author: z.string().min(1, "Quote author is required"),
  workTitle: z.string().min(1, "Source work title is required"),
  year: z.string().optional(),
  url: z.string().url("Source URL must be a valid link").optional(),
  isVerified: z.boolean().default(false)
});

/**
 * Artwork Details Schema
 * Technical specifications for visual arts and crafts.
 */
export const artworkDetailsSchema = z.object({
  medium: z.string().min(1, "Artwork medium is required"),
  yearCreated: z.number().int().min(1800).max(2100),
  dimensions: z.string().min(1, "Artwork dimensions are required"),
  aspectRatio: z.enum(['16:9', '1:1', '3:4', '4:3', '2:3'])
});

/**
 * Work Schema — Core Entity
 * Models poems, stories, essays, thoughts, quotations, and artworks.
 */
export const workSchema = z.object({
  id: z.string().min(1, "Stable internal ID is required"),
  title: z.string().min(1, "Title is required").max(250),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  contentType: z.enum(['poem', 'story', 'essay', 'thought', 'quote', 'artwork']),
  language: z.enum(['hi', 'en', 'mixed']),
  script: z.enum(['Deva', 'Latn', 'mixed']),
  creator: z.string().min(1, "Creator attribution is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  body: z.string().optional(),
  coverImage: z.string().optional(),
  coverAlt: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  publishedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  collectionSlugs: z.array(z.string()).optional(),
  translatedEditionSlug: z.string().optional(),
  translatedEditionTitle: z.string().optional(),
  translatedEditionLang: z.enum(['hi', 'en']).optional(),
  readingTimeMinutes: z.number().int().positive().optional(),
  quoteSource: quoteSourceSchema.optional(),
  artworkDetails: artworkDetailsSchema.optional(),
  rights: rightsDeclarationSchema,
  // Sensitive internal notes: kept off public APIs
  internalNotes: z.string().optional()
});

/**
 * Curated Collection Schema
 * Enables thematic grouping of works without duplicating records.
 */
export const collectionSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  titleHi: z.string().optional(),
  description: z.string().min(1),
  curatorNote: z.string().min(1),
  coverImage: z.string().min(1),
  itemSlugs: z.array(z.string()).min(1, "Collection must contain at least one work")
});

/**
 * Creator Profile Schema
 */
export const creatorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameHi: z.string().optional(),
  penName: z.string().optional(),
  role: z.string().min(1),
  bio: z.string().min(1),
  bioHi: z.string().optional(),
  avatar: z.string().optional()
});

export type Work = z.infer<typeof workSchema>;
export type Collection = z.infer<typeof collectionSchema>;
export type Creator = z.infer<typeof creatorSchema>;
export type RightsDeclaration = z.infer<typeof rightsDeclarationSchema>;
export type QuoteSource = z.infer<typeof quoteSourceSchema>;
export type ArtworkDetails = z.infer<typeof artworkDetailsSchema>;
