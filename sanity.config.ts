/**
 * Sanity Studio Configuration
 * Reproducible setup configured for Antigravity Review.
 */
import { schemaTypes } from './studio/schemas';

export default {
  name: 'antigravity-review-studio',
  title: 'Antigravity Review Editorial Studio',

  projectId: process.env.SANITY_PROJECT_ID || 'placeholder_project_id',
  dataset: process.env.SANITY_DATASET || 'production',

  schema: {
    types: schemaTypes,
  },

  document: {
    // Custom publication actions if needed
  }
};
