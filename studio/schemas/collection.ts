/**
 * Sanity Document Schema: Thematic Collection
 */
export default {
  name: 'collection',
  title: 'Curated Collection',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Collection Title (English)',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'titleHi',
      title: 'Collection Title (Hindi / हिंदी शीर्षक)',
      type: 'string'
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'description',
      title: 'Editorial Description',
      type: 'text',
      rows: 3,
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'curatorNote',
      title: 'Curator’s Statement / Note',
      type: 'text',
      rows: 3
    },
    {
      name: 'coverImage',
      title: 'Anthology Cover Media',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'items',
      title: 'Interlinked Works in Collection',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'work' }] }],
      description: 'Works grouped in this anthology across poetry, prose, and visual art without duplicating content.'
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'titleHi',
      media: 'coverImage'
    }
  }
};
