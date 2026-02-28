import { NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AO3 Tradutor API',
    description: 'API para tradução automática de fanfics do AO3 com geração de EPUB.',
    version: '1.0.0',
  },
  servers: [
    { url: '/', description: 'Servidor atual' },
  ],
  paths: {
    '/api/translate': {
      post: {
        summary: 'Iniciar tradução',
        description: 'Recebe uma ou mais URLs do AO3, faz scraping, traduz e gera EPUB. O processo é assíncrono — o endpoint retorna imediatamente e a tradução continua em background.',
        tags: ['Tradução'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['urls'],
                properties: {
                  urls: {
                    type: 'array',
                    items: { type: 'string', format: 'uri' },
                    description: 'Lista de URLs do AO3 para traduzir',
                    example: ['https://archiveofourown.org/works/12345678'],
                  },
                  languageTo: {
                    type: 'string',
                    default: 'pt',
                    description: 'Idioma destino (código ISO 639-1)',
                    enum: ['pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Traduções iniciadas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          url: { type: 'string' },
                          fanficId: { type: 'string', format: 'uuid' },
                          error: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Requisição inválida (URLs inválidas ou body malformado)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Não autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/fanfics': {
      get: {
        summary: 'Listar fanfics',
        description: 'Retorna todas as fanfics do usuário autenticado, ordenadas por data de criação (mais recente primeiro).',
        tags: ['Biblioteca'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de fanfics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fanfics: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Fanfic' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Não autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/fanfics/{id}': {
      get: {
        summary: 'Download EPUB',
        description: 'Faz download do arquivo EPUB de uma fanfic traduzida.',
        tags: ['Biblioteca'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID da fanfic',
          },
        ],
        responses: {
          '200': {
            description: 'Arquivo EPUB',
            content: {
              'application/epub+zip': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '404': {
            description: 'Fanfic não encontrada ou EPUB não disponível',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Deletar fanfic',
        description: 'Remove uma fanfic da biblioteca e deleta o EPUB do storage.',
        tags: ['Biblioteca'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID da fanfic',
          },
        ],
        responses: {
          '200': {
            description: 'Fanfic deletada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' } },
                },
              },
            },
          },
          '404': {
            description: 'Fanfic não encontrada',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sb-access-token',
        description: 'Autenticação via cookies do Supabase (gerenciada automaticamente após login)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Mensagem de erro' },
        },
      },
      Fanfic: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          work_id: { type: 'string', description: 'ID numérico do AO3' },
          url: { type: 'string', format: 'uri' },
          title_original: { type: 'string', nullable: true },
          title_translated: { type: 'string', nullable: true },
          author: { type: 'string' },
          language_from: { type: 'string', example: 'en' },
          language_to: { type: 'string', example: 'pt' },
          status: {
            type: 'string',
            enum: ['pending', 'scraping', 'translating', 'completed', 'error'],
          },
          progress: { type: 'integer', minimum: 0, maximum: 100 },
          error_message: { type: 'string', nullable: true },
          epub_path: { type: 'string', nullable: true },
          total_paragraphs: { type: 'integer' },
          translated_paragraphs: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
