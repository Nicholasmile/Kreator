import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { examples } = await server.ssrLoadModule('/src/studio/examples.ts');
  const { contentRecord, projectFromContent } =
    await server.ssrLoadModule('/src/studio/campaign.ts');
  const { presets, element } = await server.ssrLoadModule('/src/model.ts');
  const { layoutPage } = await server.ssrLoadModule('/src/studio/composition.ts');
  await mkdir('examples', { recursive: true });
  for (const [index, example] of examples.entries()) {
    const name = ['python-tutorial', 'statistics-spread', 'economics-simulated-index'][index];
    const project = projectFromContent(
      contentRecord({ title: example.name, markdown: example.source, topic: example.topic }),
      presets[0],
    );
    if (index === 2) {
      project.pages[1].elements = project.pages[1].elements.filter((e) => e.role !== 'body');
      project.pages[1].elements.push(
        element('chart', {
          role: 'body',
          chart: {
            type: 'line',
            title: 'Illustrative index · 2021 = 100',
            xLabel: 'Year',
            yLabel: 'Index',
            color: '#3469EF',
            highlightColor: '#8A6CF0',
            highlight: '2024',
            annotation: 'SIMULATED DATA · Not official Nigerian statistics',
            legend: true,
            bins: 5,
            data: [100, 108, 112, 119].map((y, i) => ({ label: String(2021 + i), x: 2021 + i, y })),
          },
        }),
      );
      project.pages[1] = layoutPage(project.pages[1], project.width, project.height, 'Focus');
    }
    await writeFile(`examples/${name}.md`, example.source + '\n');
    await writeFile(`examples/${name}.json`, JSON.stringify(project, null, 2) + '\n');
  }
} finally {
  await server.close();
}
