/**
 * Sanity Document Schema: Literary & Art Work
 * Multi-type schema supporting poems, prose, thoughts, quotations, and artworks.
 */
export default {
  name: 'work',
  title: 'Literary & Visual Work',
  type: 'document',
  fieldsets: [
    { name: 'content', title: 'Core Literary Content', options: { collapsible: false } },
    { name: 'meta', title: 'Taxonomy & Categorization', options: { collapsible: true, collapsed: false } },
    { name: 'bilingual', title: 'Bilingual Translation Links', options: { collapsible: true, collapsed: false } },
    { name: 'artworkSpecs', title: 'Visual Art Technical Specs', options: { collapsible: true, collapsed: true } },
    { name: 'quoteDetails', title: 'Citation & Source Reference', options: { collapsible: true, collapsed: true } },
    { name: 'rightsGovernance', title: 'Rights, Ownership & Legal Boundary', options: { collapsible: false } }
  ],
  fields: [
    {
      name: 'id',
      title: 'Stable Internal ID',
      type: 'string',
      fieldset: 'content',
      readOnly: true,
      initialValue: () => 'work-' + Math.random().toString(36).substring(2, 9),
      description: 'Permanent identifier that persists across title and slug modifications.'
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      fieldset: 'content',
      validation: (Rule: any) => Rule.required().max(250)
    },
    {
      name: 'slug',
      title: 'Canonical URL Slug',
      type: 'slug',
      fieldset: 'content',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) => input
          .toLowerCase()
          .trim()
          .replace(/[\s\W-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'contentType',
      title: 'Content Medium',
      type: 'string',
      fieldset: 'content',
      options: {
        list: [
          { title: 'Poem / कविता', value: 'poem' },
          { title: 'Short Story / कथा', value: 'story' },
          { title: 'Essay / निबंध', value: 'essay' },
          { title: 'Original Thought / मौलिक विचार', value: 'thought' },
          { title: 'Attributed Quotation / उद्धरण', value: 'quote' },
          { title: 'Visual Artwork / दृश्य कला', value: 'artwork' }
        ],
        layout: 'dropdown'
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'poem'
    },
    {
      name: 'language',
      title: 'Language',
      type: 'string',
      fieldset: 'content',
      options: {
        list: [
          { title: 'Hindi (हिंदी)', value: 'hi' },
          { title: 'English', value: 'en' },
          { title: 'Mixed / Bilingual', value: 'mixed' }
        ],
        layout: 'radio'
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'hi'
    },
    {
      name: 'script',
      title: 'Script',
      type: 'string',
      fieldset: 'content',
      options: {
        list: [
          { title: 'Devanagari (देवनागरी)', value: 'Deva' },
          { title: 'Latin / Romanized', value: 'Latn' },
          { title: 'Mixed Script', value: 'mixed' }
        ],
        layout: 'radio'
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'Deva'
    },
    {
      name: 'creator',
      title: 'Creator / Author',
      type: 'reference',
      to: [{ type: 'creator' }],
      fieldset: 'content',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'excerpt',
      title: 'Excerpt / Summary',
      type: 'text',
      rows: 3,
      fieldset: 'content',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'body',
      title: 'Body Text / Verses',
      type: 'text',
      rows: 15,
      fieldset: 'content',
      description: 'For poetry: line breaks and double spacing between stanzas will be strictly preserved.'
    },
    {
      name: 'coverImage',
      title: 'Featured / Artwork Media',
      type: 'image',
      fieldset: 'content',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alternative Text for Accessibility',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        }
      ]
    },
    {
      name: 'status',
      title: 'Publication Status',
      type: 'string',
      fieldset: 'meta',
      options: {
        list: [
          { title: 'Draft (Protected from public builds)', value: 'draft' },
          { title: 'Published (Publicly visible)', value: 'published' },
          { title: 'Archived / Withdrawn', value: 'archived' }
        ],
        layout: 'radio'
      },
      initialValue: 'published',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'publishedAt',
      title: 'Publication Date',
      type: 'datetime',
      fieldset: 'meta',
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'tags',
      title: 'Tags & Themes',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      fieldset: 'meta'
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
      fieldset: 'meta'
    },
    {
      name: 'readingTimeMinutes',
      title: 'Estimated Reading Time (Minutes)',
      type: 'number',
      fieldset: 'meta'
    },

    // Bilingual translation link
    {
      name: 'translatedEdition',
      title: 'Linked Translation Edition',
      type: 'reference',
      to: [{ type: 'work' }],
      fieldset: 'bilingual',
      description: 'Select the companion translation or alternate language edition of this work.'
    },

    // Artwork specific fields
    {
      name: 'artworkMedium',
      title: 'Medium (e.g. Watercolor, Traditional Ink, Oil on Linen)',
      type: 'string',
      fieldset: 'artworkSpecs'
    },
    {
      name: 'artworkDimensions',
      title: 'Physical Dimensions (e.g. 56 × 32 cm)',
      type: 'string',
      fieldset: 'artworkSpecs'
    },
    {
      name: 'artworkYearCreated',
      title: 'Year Created',
      type: 'number',
      fieldset: 'artworkSpecs'
    },
    {
      name: 'artworkAspectRatio',
      title: 'Visual Aspect Ratio',
      type: 'string',
      fieldset: 'artworkSpecs',
      options: {
        list: [
          { title: '16:9 Landscape', value: '16:9' },
          { title: '1:1 Square', value: '1:1' },
          { title: '3:4 Portrait', value: '3:4' }
        ]
      }
    },

    // Quotation citation fields
    {
      name: 'quoteAuthor',
      title: 'Original Quote Author',
      type: 'string',
      fieldset: 'quoteDetails'
    },
    {
      name: 'quoteWorkTitle',
      title: 'Original Source Title',
      type: 'string',
      fieldset: 'quoteDetails'
    },
    {
      name: 'quoteYear',
      title: 'Year of Original Work',
      type: 'string',
      fieldset: 'quoteDetails'
    },
    {
      name: 'quoteUrl',
      title: 'Source Verification URL',
      type: 'url',
      fieldset: 'quoteDetails'
    },
    {
      name: 'quoteIsVerified',
      title: 'Source Verified by Editorial Review',
      type: 'boolean',
      fieldset: 'quoteDetails',
      initialValue: false
    },

    // Rights & Governance
    {
      name: 'rights',
      title: 'Rights & Provenance Declaration',
      type: 'rightsRecord',
      fieldset: 'rightsGovernance',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'internalNotes',
      title: 'Internal Editorial Notes (NEVER PUBLIC)',
      type: 'text',
      rows: 3,
      fieldset: 'rightsGovernance',
      description: 'Private editor notes. This field is stripped before serving public website visitors.'
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'contentType',
      media: 'coverImage',
      status: 'status'
    },
    prepare({ title, subtitle, media, status }: any) {
      return {
        title: title || 'Untitled Work',
        subtitle: `${subtitle?.toUpperCase()} [${status?.toUpperCase()}]`,
        media
      };
    }
  }
};
