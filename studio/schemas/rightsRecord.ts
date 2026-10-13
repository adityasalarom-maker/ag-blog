/**
 * Sanity Object Schema: Rights Declaration
 * Distinguishes creator-declared originality from attributed citations.
 */
export default {
  name: 'rightsRecord',
  title: 'Rights & Provenance Record',
  type: 'object',
  fields: [
    {
      name: 'declaredBy',
      title: 'Declared By',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      description: 'Name of the creator, entity, or historical source declaring attribution.'
    },
    {
      name: 'declarationType',
      title: 'Declaration Type',
      type: 'string',
      options: {
        list: [
          { title: 'Original Creator (रचनाकार द्वारा मौलिक)', value: 'Original Creator' },
          { title: 'Public Domain Attributed (सार्वजनिक कार्यक्षेत्र)', value: 'Public Domain Attributed' },
          { title: 'Curated Citation (उद्धरण)', value: 'Curated Citation' }
        ],
        layout: 'radio'
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'status',
      title: 'Rights Status',
      type: 'string',
      options: {
        list: [
          { title: 'Creator-Declared', value: 'Creator-Declared' },
          { title: 'Attributed', value: 'Attributed' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'notice',
      title: 'Public Rights Notice',
      type: 'text',
      rows: 2,
      validation: (Rule: any) => Rule.required(),
      description: 'The exact copyright disclaimer or fair dealing attribution displayed publicly to readers.'
    },
    {
      name: 'privateEvidenceRef',
      title: 'Internal Provenance Reference (CONFIDENTIAL)',
      type: 'string',
      description: 'INTERNAL ONLY: Local reference ID or file hash for archival evidence. WARNING: Do NOT upload sensitive identity documents or private secrets to public media datasets!'
    }
  ]
};
