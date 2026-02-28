import { EPub } from 'epub-gen-memory';
import type { EpubContent } from '@/types';

const CSS = `
  body {
    font-family: 'Segoe UI', Georgia, serif;
    text-align: justify;
    line-height: 1.8;
    padding: 1em;
    color: #222;
  }
  h1 { font-size: 1.6em; text-align: center; margin-bottom: 0.5em; }
  h2 { font-size: 1.3em; margin-top: 1.5em; }
  h3 { font-size: 1.1em; margin-top: 1.2em; }
  p { margin: 0.6em 0; text-indent: 1.5em; }
  blockquote {
    margin: 1em 2em;
    padding: 0.5em 1em;
    border-left: 3px solid #666;
    font-style: italic;
    color: #555;
  }
  .metadata {
    text-align: center;
    font-size: 0.9em;
    color: #666;
    margin-bottom: 2em;
    border-bottom: 1px solid #ddd;
    padding-bottom: 1em;
  }
  .metadata a { color: #4a7c9e; }
`;

export async function generateEpub(content: EpubContent): Promise<Buffer> {
  const metadataHtml = `
    <div class="metadata">
      <p><strong>Título Original:</strong> ${content.titleOriginal}</p>
      <p><strong>Autor:</strong> ${content.author}</p>
      <p><a href="${content.sourceUrl}">Abrir no AO3</a></p>
    </div>
  `;

  const chapters = content.chapters.map((ch, index) => ({
    title: ch.title || `Capítulo ${index + 1}`,
    content: index === 0 ? metadataHtml + ch.content : ch.content,
  }));

  const epub = new EPub(
    {
      title: content.title,
      author: content.author,
      css: CSS,
      tocTitle: 'Sumário',
      lang: 'pt-BR',
    },
    chapters,
  );

  return epub.genEpub();
}
