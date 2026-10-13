/**
 * Sanity Document Schema: Creator Profile
 */
export default {
  name: 'creator',
  title: 'Creator & Contributor',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'nameHi',
      title: 'Name in Devanagari (नाम हिंदी में)',
      type: 'string'
    },
    {
      name: 'penName',
      title: 'Pen Name / साहित्यिक उपनाम',
      type: 'string'
    },
    {
      name: 'role',
      title: 'Role / Designation',
      type: 'string',
      initialValue: 'Founder & Editor'
    },
    {
      name: 'bio',
      title: 'Biography (English)',
      type: 'text',
      rows: 4
    },
    {
      name: 'bioHi',
      title: 'Biography (Hindi / हिंदी परिचय)',
      type: 'text',
      rows: 4
    },
    {
      name: 'avatar',
      title: 'Profile Portrait',
      type: 'image',
      options: { hotspot: true }
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'avatar'
    }
  }
};
