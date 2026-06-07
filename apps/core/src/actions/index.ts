import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createCatalogUseCases } from '@lib/catalog/infrastructure/di';

export const server = {
  indexRepository: defineAction({
    accept: 'form',
    input: z.object({
      path: z.string().min(1, 'Repository path is required'),
    }),
    handler: async ({ path }) => {
      const catalog = createCatalogUseCases();
      return catalog.indexRepository(path);
    },
  }),

  removeRepository: defineAction({
    accept: 'form',
    input: z.object({
      path: z.string().min(1),
    }),
    handler: async ({ path }) => {
      const catalog = createCatalogUseCases();
      await catalog.removeRepository(path);
    },
  }),

  clearAll: defineAction({
    accept: 'form',
    handler: async () => {
      const catalog = createCatalogUseCases();
      await catalog.clearAll();
    },
  }),
};
