import { element, uid, type Page } from '../model';
import type { Template } from '../templates';
const families: [string, string, string[], string[], string][] = [
  [
    'Python notebook',
    'Python',
    [
      'Inspect before you infer',
      'Missing values, visible',
      'One function. One purpose.',
      'A readable Pandas pipeline',
    ],
    [
      'import pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.info())',
      'missing = df.isna().sum()\nprint(missing.sort_values())',
      'def growth(new, old):\n    return (new - old) / old',
      'result = (df\n    .dropna(subset=["value"])\n    .groupby("group")["value"]\n    .mean())',
    ],
    'Instagram',
  ],
  [
    'Query walkthrough',
    'SQL',
    [
      'Read a query in order',
      'Choose the right rows',
      'Aggregate with intention',
      'Join without losing context',
    ],
    [
      'SELECT category, COUNT(*)\nFROM observations\nGROUP BY category;',
      'SELECT *\nFROM observations\nWHERE value IS NOT NULL;',
      'SELECT region, AVG(value)\nFROM observations\nGROUP BY region;',
      'SELECT a.id, b.label\nFROM observations a\nLEFT JOIN groups b\nON a.group_id = b.id;',
    ],
    'LinkedIn',
  ],
  [
    'Concept / practice',
    'Tutorials',
    [
      'Train and test, separately',
      'Correlation needs context',
      'A useful feature starts here',
      'From question to chart',
    ],
    [
      'CONCEPT\nEvaluate on unseen data.\n\nPRACTICE\nSplit before fitting transformations.',
      'CONCEPT\nTwo variables move together.\n\nPRACTICE\nCheck confounders and study design.',
      'CONCEPT\nRepresent information the model can use.\n\nPRACTICE\nInspect availability at prediction time.',
      'QUESTION\nWhat comparison matters?\n\nCHART\nChoose encodings that reveal it.',
    ],
    'Instagram',
  ],
  [
    'Before / after',
    'Comparison',
    [
      'A clearer Python expression',
      'Counts versus proportions',
      'A label that earns its place',
      'Description versus explanation',
    ],
    [
      'BEFORE\nx = a / b\n\nAFTER\nrate = events / observations',
      'COUNTS\nHow many observations?\n\nPROPORTIONS\nWhat share of the total?',
      'BEFORE\nA number without units.\n\nAFTER\nA label, period, unit, and source.',
      'DESCRIPTION\nWhat changed?\n\nEXPLANATION\nWhat evidence supports why?',
    ],
    'X',
  ],
  [
    'Method map',
    'Research',
    [
      'A reproducible workflow',
      'Ask. Measure. Reconsider.',
      'Design an experiment',
      'From reading to a research question',
    ],
    [
      '01 · DEFINE\nState the question.\n\n02 · CHECK\nInspect sources and assumptions.\n\n03 · EXPLAIN\nShare methods and limitations.',
      '01 · ASK\nDefine the decision.\n\n02 · MEASURE\nChoose relevant evidence.\n\n03 · RECONSIDER\nTest your interpretation.',
      '01 · DESIGN\nSpecify the comparison.\n\n02 · COLLECT\nFollow a consistent protocol.\n\n03 · EVALUATE\nReport uncertainty.',
      '01 · READ\nTrace the literature.\n\n02 · CONNECT\nIdentify a gap.\n\n03 · FOCUS\nForm a testable question.',
    ],
    'LinkedIn',
  ],
  [
    'Research memo',
    'Research',
    [
      'What this study can tell us',
      'A result is not the whole paper',
      'Read the methods first',
      'A careful research summary',
    ],
    [
      'QUESTION\n[The question investigated]\n\nMETHOD\n[Data, sample, and design]\n\nLIMITATION\n[What the evidence cannot establish]',
      'FINDING\n[Verified result and source]\n\nCONTEXT\n[Population and time period]\n\nUNCERTAINTY\n[Limitations and intervals]',
      'DESIGN\n[Study design]\n\nMEASUREMENT\n[How variables were measured]\n\nINTERPRETATION\n[What follows from the evidence]',
      'SOURCE\n[Author, year, and link]\n\nINSIGHT\n[Your careful explanation]\n\nNEXT QUESTION\n[What remains open]',
    ],
    'LinkedIn',
  ],
  [
    'Data story',
    'Data Visualization',
    [
      'Give the axis a voice',
      'A trend, with context',
      'Read the distribution',
      'Make uncertainty visible',
    ],
    [
      'WHAT TO SHOW\n[Your chart and verified data]\n\nWHAT TO SAY\nName the unit, baseline, and period.',
      'THE PATTERN\n[Your observation]\n\nTHE CONTEXT\n[Source, coverage, and caveat]',
      'CENTRE\nWhat is typical?\n\nSPREAD\nHow different are observations?\n\nSHAPE\nWhat does a summary hide?',
      'ESTIMATE\n[Your calculated value]\n\nINTERVAL\n[Your uncertainty measure]\n\nINTERPRETATION\n[What it means in context]',
    ],
    'Facebook',
  ],
  [
    'Formula notebook',
    'Mathematics',
    [
      'Formula of the day',
      'Standard deviation, unpacked',
      'An econometric equation',
      'A probability worth understanding',
    ],
    [
      '\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i',
      's=\\sqrt{\\frac{\\sum(x_i-\\bar{x})^2}{n-1}}',
      'y_i=\\beta_0+\\beta_1 x_i+\\varepsilon_i',
      'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}',
    ],
    'Instagram',
  ],
  [
    'Myth / nuance',
    'Myth vs Fact',
    [
      'More data is not a guarantee',
      'Accuracy is not the whole story',
      'Significance needs interpretation',
      'Averages can hide differences',
    ],
    [
      'MYTH\nA bigger dataset fixes every problem.\n\nNUANCE\nQuality, coverage, and the question still matter.',
      'MYTH\nAccuracy alone identifies the best model.\n\nNUANCE\nClass balance, costs, and calibration matter.',
      'MYTH\nStatistically significant means practically important.\n\nNUANCE\nReport effect sizes and context.',
      'MYTH\nThe mean tells the complete story.\n\nNUANCE\nInspect spread, shape, and subgroups.',
    ],
    'X',
  ],
  [
    'Field checklist',
    'Education',
    [
      'Before sharing a chart',
      'Before training a model',
      'Before calling it a finding',
      'Before publishing code',
    ],
    [
      '□ Label the axes and units\n□ Check the source\n□ Show a meaningful scale\n□ Explain uncertainty',
      '□ Define the target\n□ Prevent leakage\n□ Choose a baseline\n□ Plan evaluation',
      '□ Verify the calculation\n□ Examine assumptions\n□ Consider alternatives\n□ State limitations',
      '□ Remove private data\n□ Document dependencies\n□ Use clear names\n□ Test the example',
    ],
    'WhatsApp',
  ],
  [
    'Portfolio case',
    'Project showcases',
    [
      'The question behind my project',
      'A project, explained simply',
      'What I changed and why',
      'From analysis to a useful artifact',
    ],
    [
      'PROBLEM\n[The question you investigated]\n\nAPPROACH\n[Your actual method]\n\nLESSON\n[What you learned]',
      'INPUT\n[Data you used]\n\nPROCESS\n[Your actual workflow]\n\nOUTPUT\n[Your verified deliverable]',
      'BEFORE\n[Your earlier approach]\n\nCHANGE\n[What you actually adjusted]\n\nREASON\n[Evidence for the decision]',
      'QUESTION\n[Your research question]\n\nARTIFACT\n[Dashboard, notebook, or report]\n\nNEXT\n[Your planned improvement]',
    ],
    'LinkedIn',
  ],
  [
    'Learning journal',
    'Career',
    [
      'A lesson I am taking forward',
      'Learning in public',
      'The question I could not answer',
      'Progress deserves a footnote',
    ],
    [
      'WHAT I TRIED\n[Your real experience]\n\nWHAT I LEARNED\n[Your reflection]\n\nWHAT IS NEXT\n[Your next step]',
      'THIS WEEK\n[What you practiced]\n\nONE INSIGHT\n[What became clearer]\n\nONE QUESTION\n[What you are exploring]',
      'THE QUESTION\n[What challenged you]\n\nTHE GAP\n[What you need to understand]\n\nTHE PLAN\n[How you will investigate]',
      'MILESTONE\n[Your actual achievement]\n\nPROCESS\n[The work behind it]\n\nTHANKS\n[People or resources to acknowledge]',
    ],
    'Facebook',
  ],
  [
    'Thread opener',
    'Data Science',
    [
      'A small guide to better data questions',
      'SQL, one idea at a time',
      'What a chart leaves unsaid',
      'Statistics without the shortcuts',
    ],
    [
      'A question. A method. A caveat.\n\nStart a conversation grounded in evidence.',
      'Read the data.\nUnderstand the grain.\nWrite the query.\nCheck the result.',
      'Every chart makes choices.\n\nLook at the scale, grouping, and missing context.',
      'Build intuition.\nKeep the assumptions.\nExplain the uncertainty.',
    ],
    'X',
  ],
  [
    'Vertical micro-lesson',
    'Quick tips',
    [
      'One Python habit for today',
      'One chart habit for today',
      'One research habit for today',
      'One SQL habit for today',
    ],
    [
      'WRITE FOR YOUR FUTURE SELF\n\nUse a clear name.\nExplain an assumption.\nKeep a small example.',
      'START WITH THE QUESTION\n\nChoose the comparison.\nName the unit.\nCheck the scale.',
      'FOLLOW THE SOURCE\n\nRead the method.\nCheck the sample.\nRecord the limitation.',
      'KNOW YOUR ROWS\n\nCheck duplicates.\nUnderstand joins.\nInspect missing values.',
    ],
    'WhatsApp',
  ],
];
export const studioTemplates: Template[] = families.flatMap(
  ([family, category, titles, bodies, platform], i) =>
    titles.map((title, j) => ({
      id: `studio-${i}-${j}`,
      name: `${family} · ${j + 1}`,
      category,
      title,
      body: bodies[j],
      label: `MALIK KOLADE / ${category.toUpperCase()}`,
      palette: (i % 4 === 0
        ? ['#101B34', '#F5F7FB', '#8A6CF0']
        : i % 4 === 1
          ? ['#F5F7FB', '#101B34', '#3469EF']
          : i % 4 === 2
            ? ['#ffffff', '#20283C', '#8A6CF0']
            : ['#edf2fc', '#101B34', '#3469EF']) as [string, string, string],
      layout: 5 + i,
      platform,
      tags: [
        family,
        category,
        platform,
        'Data Science',
        ...(i === 7
          ? [
              'Formula of the Day',
              'Statistical Concept Explained',
              'Equation Breakdown',
              'Worked Example',
              'Econometrics Tutorial',
            ]
          : []),
      ],
      description: `${family}: ${title.toLowerCase()}. Replace bracketed prompts with your own verified material.`,
      format: platform === 'WhatsApp' ? '1080 × 1920' : '1080 × 1350',
    })),
);
export function studioTemplatePage(
  t: Template,
  w: number,
  h: number,
  title = t.title,
  body = t.body,
): Page {
  const [bg, ink, accent] = t.palette,
    unit = Math.min(w, h),
    m = w * 0.075,
    family = t.layout - 5;
  const elements = [] as Page['elements'];
  const rect = (x: number, y: number, width: number, height: number, fill: string, radius = 0) =>
    elements.push(
      element('rect', {
        x,
        y,
        width,
        height,
        fill,
        radius,
        role: fill === accent ? 'accent' : 'secondary',
      }),
    );
  const text = (
    s: string,
    x: number,
    y: number,
    width: number,
    height: number,
    size: number,
    role: 'heading' | 'body' | 'watermark' = 'body',
    fill = ink,
  ) =>
    elements.push(
      element('text', {
        text: s,
        x,
        y,
        width,
        height,
        fontSize: size,
        fill,
        fontFamily: family === 5 || family === 11 ? 'Georgia' : 'Arial',
        fontStyle: role === 'heading' ? 'bold' : 'normal',
        role,
      }),
    );
  text(t.label, m, h * 0.065, w * 0.85, h * 0.045, unit * 0.017);
  text(title, m, h * 0.16, w * 0.85, h * 0.2, unit * 0.067, 'heading');
  const chunks = body.split('\n\n');
  if (family === 0 || family === 1) {
    elements.push(
      element('code', {
        text: body,
        code: {
          language: family === 0 ? 'python' : 'sql',
          theme: family === 0 ? 'dark' : 'light',
          filename: family === 0 ? 'notebook.py' : 'query.sql',
          lineNumbers: true,
          wrap: true,
          highlights: '',
          padding: 30,
          transparent: false,
        },
        x: m,
        y: h * 0.4,
        width: w * 0.85,
        height: h * 0.38,
        fontSize: unit * 0.029,
        fill: ink,
      }),
    );
    text('READ IT  →  TRY IT  →  EXPLAIN IT', m, h * 0.83, w * 0.8, h * 0.06, unit * 0.02);
  } else if (family === 2 || family === 3 || family === 8) {
    rect(m, h * 0.41, w * 0.4, h * 0.4, accent, 16);
    rect(w * 0.525, h * 0.41, w * 0.4, h * 0.4, bg === '#101B34' ? '#202d49' : '#e2e9f7', 16);
    text(
      chunks[0],
      m + w * 0.025,
      h * 0.45,
      w * 0.35,
      h * 0.32,
      unit * 0.037,
      'body',
      family === 8 ? '#101B34' : ink,
    );
    text(chunks.slice(1).join('\n\n'), w * 0.55, h * 0.45, w * 0.35, h * 0.32, unit * 0.037);
  } else if (family === 4) {
    chunks.forEach((c, i) => {
      const x = m + i * w * 0.295;
      rect(
        x,
        h * 0.44,
        w * 0.26,
        h * 0.33,
        i === 1 ? accent : bg === '#101B34' ? '#24314c' : '#e2e9f7',
        14,
      );
      text(c, x + w * 0.017, h * 0.475, w * 0.226, h * 0.25, unit * 0.029);
    });
  } else if (family === 5) {
    rect(m, h * 0.395, w * 0.012, h * 0.44, accent);
    chunks.forEach((c, i) =>
      text(c, w * 0.12, h * 0.4 + i * h * 0.15, w * 0.76, h * 0.125, unit * 0.028),
    );
  } else if (family === 6) {
    rect(m, h * 0.39, w * 0.85, h * 0.14, accent, 14);
    text(chunks[0], m + w * 0.025, h * 0.41, w * 0.8, h * 0.1, unit * 0.029);
    chunks
      .slice(1)
      .forEach((c, i) => text(c, m, h * 0.59 + i * h * 0.13, w * 0.85, h * 0.115, unit * 0.03));
  } else if (family === 7) {
    elements.push(
      element('rich', {
        text: `$$\n${body}\n$$`,
        x: m,
        y: h * 0.4,
        width: w * 0.85,
        height: h * 0.2,
        fontSize: unit * 0.045,
        fill: ink,
      }),
    );
    rect(m, h * 0.65, w * 0.85, h * 0.002, accent);
    text(
      'DEFINE THE SYMBOLS\nExplain the variables, assumptions, and a worked example.',
      m,
      h * 0.7,
      w * 0.82,
      h * 0.14,
      unit * 0.029,
    );
  } else if (family === 9) {
    body.split('\n').forEach((c, i) => {
      rect(m, h * 0.39 + i * h * 0.105, w * 0.85, h * 0.08, i % 2 ? bg : accent, 8);
      text(c, m + w * 0.02, h * 0.405 + i * h * 0.105, w * 0.81, h * 0.055, unit * 0.031);
    });
  } else if (family === 10) {
    rect(m, h * 0.39, w * 0.85, h * 0.16, accent, 12);
    text(chunks[0], m + w * 0.03, h * 0.414, w * 0.79, h * 0.12, unit * 0.03);
    text(chunks[1] || '', m, h * 0.61, w * 0.39, h * 0.24, unit * 0.029);
    text(chunks[2] || '', w * 0.54, h * 0.61, w * 0.39, h * 0.24, unit * 0.029);
  } else if (family === 11) {
    text('“', m, h * 0.34, w * 0.2, h * 0.14, unit * 0.15, 'heading', accent);
    text(body, w * 0.18, h * 0.48, w * 0.67, h * 0.35, unit * 0.033);
  } else if (family === 12) {
    rect(m, h * 0.41, w * 0.11, h * 0.009, accent);
    text(body, m, h * 0.5, w * 0.85, h * 0.3, unit * 0.044);
    text('A THREAD FOR CURIOUS MINDS  ↗', m, h * 0.84, w * 0.85, h * 0.04, unit * 0.019);
  } else {
    rect(m, h * 0.39, w * 0.85, h * 0.43, accent, 24);
    text(body, m + w * 0.05, h * 0.445, w * 0.75, h * 0.33, unit * 0.044, 'body', '#101B34');
  }
  text(
    'Malik Kolade  ·  Learn. Question. Explain.',
    m,
    h * 0.94,
    w * 0.82,
    h * 0.033,
    unit * 0.016,
    'watermark',
  );
  return { id: uid(), background: bg, elements, duration: 4, transition: 'fade' };
}
