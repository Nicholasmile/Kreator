import { element, uid, type Page } from './model';
import { studioTemplates, studioTemplatePage } from './studio/templateFamilies';
export interface Template {
  id: string;
  name: string;
  category: string;
  title: string;
  body: string;
  label: string;
  palette: [string, string, string];
  layout: number;
  platform?: string;
  tags?: string[];
  description?: string;
  format?: string;
}
const entries: [string, string, string, string, string, [string, string, string], number][] = [
  [
    'The learning curve',
    'Education',
    'Small steps.\nBig discoveries.',
    'A little curiosity goes a long way. Start with one idea, then follow where it leads.',
    'A NEW PERSPECTIVE',
    ['#eee9f7', '#352850', '#9470ce'],
    0,
  ],
  [
    'Data, demystified',
    'Data Science',
    'Let your data\ntell the story.',
    'Ask better questions. Find meaningful patterns. Share what matters.',
    'THE DATA NOTEBOOK',
    ['#e9eee7', '#243c31', '#aac37f'],
    1,
  ],
  [
    'One good question',
    'Mathematics',
    'What if the\nanswer is simpler?',
    'Break the problem down. Look for a pattern. Try a different perspective.',
    'KARLMATHS / DAILY CHALLENGE',
    ['#f9ebd9', '#5a3623', '#e5a55d'],
    2,
  ],
  [
    'The research edit',
    'Research',
    'Good research\nstarts here.',
    'Turn a broad interest into a focused question worth exploring.',
    'FIELD NOTES / 001',
    ['#e9eef3', '#233b51', '#90b4c9'],
    3,
  ],
  [
    'Make room',
    'Quotes',
    'Make room for\nwhat moves you.',
    'Progress begins when you give your ideas the space to grow.',
    'A LITTLE REMINDER',
    ['#f1e8e4', '#653f3e', '#cc9b89'],
    4,
  ],
  [
    'Something new',
    'Business',
    'A new chapter\nstarts today.',
    'Thoughtfully built. Ready for you. Discover what we have been working on.',
    'THE BIG ANNOUNCEMENT',
    ['#282842', '#f4eee8', '#afa3ef'],
    0,
  ],
  [
    'The how-to',
    'Tutorials',
    'From “how?”\nto “got it.”',
    '01  Start with the essentials\n02  Put it into practice\n03  Make it your own',
    'YOUR STEP-BY-STEP GUIDE',
    ['#f0f1dc', '#424c30', '#b5be76'],
    1,
  ],
  [
    'Think again',
    'Myth vs Fact',
    'More data.\nBetter answers?',
    'MYTH: More is always better.\nFACT: Quality matters more than quantity.',
    'LET’S CLEAR THIS UP',
    ['#f5e3df', '#6b3636', '#d98e78'],
    3,
  ],
  [
    'Side by side',
    'Comparison',
    'Data science\nor analytics?',
    'SCIENCE  →  Predict what comes next.\nANALYTICS  →  Understand what happened.',
    'KNOW THE DIFFERENCE',
    ['#e3edf0', '#26454f', '#8bbfc0'],
    2,
  ],
  [
    'Made for you',
    'Product',
    'Your everyday.\nElevated.',
    'Considered details. Lasting quality. Meet your new favourite essential.',
    'THE NEW COLLECTION',
    ['#ede7dd', '#4d4030', '#bfa784'],
    4,
  ],
  [
    'A better way',
    'LinkedIn',
    'The best insight?\nA better question.',
    'Before opening another dashboard, ask what decision you want to make.',
    'NOTES ON WORK',
    ['#e8eaf6', '#343659', '#939bd7'],
    0,
  ],
  [
    'Swipe to learn',
    'Carousel',
    '5 ideas to\nchange your\nperspective.',
    'A quick guide for curious minds.\nSave this for your next big idea.',
    'THE LEARNING SERIES',
    ['#ebe3f5', '#49315f', '#b291d5'],
    1,
  ],
  [
    'Numbers in nature',
    'Mathematics',
    'Patterns are\neverywhere.',
    'From sunflower spirals to ocean waves, mathematics helps us see the world anew.',
    'BEAUTIFUL MATHEMATICS',
    ['#e8eedb', '#38482c', '#a2ba77'],
    4,
  ],
  [
    'The useful insight',
    'Data Science',
    'Clean data.\nClear thinking.',
    'Check missing values. Question outliers. Document every decision.',
    '3 HABITS WORTH KEEPING',
    ['#e2eef1', '#214c5c', '#72aeba'],
    2,
  ],
  [
    'Read between',
    'Research',
    'Read widely.\nThink deeply.',
    'A literature review is a conversation. Find the connections, tensions, and missing voices.',
    'THE RESEARCH PRACTICE',
    ['#f4e8d7', '#5c4230', '#cfab7b'],
    1,
  ],
  [
    'Keep going',
    'Quotes',
    'You don’t have\nto see the whole\nstaircase.',
    'Just take the next step.',
    'A NOTE TO YOURSELF',
    ['#e7e9f1', '#3d405d', '#9ba5cc'],
    4,
  ],
  [
    'Open for ideas',
    'Business',
    'Let’s make\nsomething great.',
    'New collaborations. Fresh possibilities. Our calendar is open.',
    'WORK WITH US',
    ['#f4e4ed', '#673950', '#c38eac'],
    3,
  ],
  [
    'The checklist',
    'Tutorials',
    'Before you\nhit publish.',
    '✓ One clear message\n✓ A headline that helps\n✓ A reason to save or share',
    'THE CREATOR CHECKLIST',
    ['#edf0e9', '#38463b', '#97b298'],
    0,
  ],
  [
    'Beyond the myth',
    'Myth vs Fact',
    'Talent is only\nthe beginning.',
    'MYTH: Great work comes naturally.\nFACT: Consistent practice builds skill.',
    'A FRESH PERSPECTIVE',
    ['#f5eadc', '#5b4431', '#d7b187'],
    2,
  ],
  [
    'Choose your path',
    'Comparison',
    'Busy work.\nMeaningful work.',
    'One fills your calendar.\nThe other moves your ideas forward.',
    'MAKE THE DISTINCTION',
    ['#e7e6f2', '#413b60', '#a39aca'],
    3,
  ],
  [
    'The thoughtful launch',
    'Product',
    'Less noise.\nMore intention.',
    'A collection designed around what you actually need. Explore the details.',
    'INTRODUCING THE ESSENTIALS',
    ['#e9e7e0', '#434839', '#a8ad8c'],
    1,
  ],
  [
    'Work in progress',
    'LinkedIn',
    'Share the lesson.\nNot just the win.',
    'The most useful stories are often the ones about what did not go to plan.',
    'IDEAS WORTH SHARING',
    ['#e3edf4', '#2c4761', '#89b0cb'],
    4,
  ],
  [
    'The concept guide',
    'Education',
    'Complex ideas.\nSimply explained.',
    'One concept, a practical example, and a new way to think about it.',
    'THE EXPLAINER',
    ['#f2e3df', '#653f35', '#d4a08d'],
    3,
  ],
  [
    'Start with curiosity',
    'Carousel',
    'Your next\nlightbulb moment.',
    'Seven small lessons.\nOne fresh way of seeing things.',
    'SWIPE INTO SOMETHING NEW',
    ['#f3edda', '#51492c', '#d2ba6c'],
    0,
  ],
];
export const templates: Template[] = [
  ...entries.map((e, i) => ({
    id: `template-${i}`,
    name: e[0],
    category: e[1],
    title: e[2],
    body: e[3],
    label: e[4],
    palette: e[5],
    layout: e[6],
  })),
  ...studioTemplates,
];
export function templatePage(
  t: Template,
  width = 1080,
  height = 1080,
  title = t.title,
  body = t.body,
  number?: string,
): Page {
  if (t.layout >= 5) return studioTemplatePage(t, width, height, title, body);
  const [bg, ink, accent] = t.palette,
    w = width,
    h = height,
    unit = Math.min(w, h),
    pad = w * 0.075;
  const box = (x: number, y: number, bw: number, bh: number, fill: string, radius = 0) =>
    element('rect', {
      x,
      y,
      width: bw,
      height: bh,
      fill,
      radius,
      role: fill === accent ? 'accent' : 'primary',
    });
  const text = (
    value: string,
    x: number,
    y: number,
    bw: number,
    bh: number,
    size: number,
    role: 'heading' | 'body' | 'watermark',
    extra = {},
  ) =>
    element('text', {
      text: value,
      x,
      y,
      width: bw,
      height: bh,
      fontSize: size,
      fontFamily: role === 'heading' && [0, 4].includes(t.layout) ? 'Georgia' : 'Arial',
      fontStyle: role === 'heading' ? 'bold' : 'normal',
      fill: ink,
      role,
      ...extra,
    });
  const elements = [
    text(t.label, pad, h * 0.075, w * 0.82, h * 0.06, unit * 0.019, 'body', {
      letterSpacing: unit * 0.002,
    }),
  ];
  if (t.layout === 0) {
    elements.push(
      element('ellipse', {
        x: w * 0.64,
        y: h * 0.13,
        width: w * 0.25,
        height: w * 0.25,
        fill: accent,
        opacity: 0.45,
        role: 'accent',
      }),
      box(pad, h * 0.27, w * 0.11, unit * 0.009, ink),
      text(title, pad, h * 0.34, w * 0.81, h * 0.36, unit * 0.086, 'heading'),
      text(body, pad, h * 0.74, w * 0.72, h * 0.13, unit * 0.029, 'body'),
    );
  }
  if (t.layout === 1) {
    elements.push(
      box(w * 0.7, h * 0.17, w * 0.22, h * 0.2, accent, unit * 0.018),
      element('ellipse', {
        x: w * 0.58,
        y: h * 0.2,
        width: unit * 0.19,
        height: unit * 0.19,
        fill: ink,
        opacity: 0.9,
        role: 'primary',
      }),
      text(title, pad, h * 0.31, w * 0.81, h * 0.39, unit * 0.088, 'heading'),
      text(body, pad, h * 0.74, w * 0.8, h * 0.14, unit * 0.03, 'body'),
    );
  }
  if (t.layout === 2) {
    elements.push(
      box(pad, h * 0.18, w * 0.85, h * 0.5, accent, unit * 0.025),
      text(title, w * 0.12, h * 0.24, w * 0.76, h * 0.37, unit * 0.09, 'heading'),
      text(body, pad, h * 0.74, w * 0.82, h * 0.15, unit * 0.031, 'body'),
    );
  }
  if (t.layout === 3) {
    elements.push(
      box(pad, h * 0.2, unit * 0.012, h * 0.45, accent),
      text(title, w * 0.12, h * 0.22, w * 0.78, h * 0.35, unit * 0.088, 'heading'),
      box(w * 0.12, h * 0.61, w * 0.75, unit * 0.002, ink),
      text(body, w * 0.12, h * 0.67, w * 0.75, h * 0.2, unit * 0.031, 'body'),
    );
  }
  if (t.layout === 4) {
    elements.push(
      text('“', pad, h * 0.13, w * 0.3, h * 0.18, unit * 0.23, 'heading', { fill: accent }),
      text(title, pad, h * 0.32, w * 0.85, h * 0.37, unit * 0.081, 'heading', { align: 'center' }),
      text(body, w * 0.15, h * 0.75, w * 0.7, h * 0.12, unit * 0.029, 'body', { align: 'center' }),
    );
  }
  elements.push(
    text('KREATOR STUDIO', pad, h * 0.94, w * 0.65, h * 0.035, unit * 0.015, 'watermark', {
      letterSpacing: unit * 0.002,
    }),
  );
  if (number)
    elements.push({
      ...text(number, w * 0.83, h * 0.935, w * 0.1, h * 0.04, unit * 0.021, 'body', {
        align: 'right',
      }),
      role: 'pageNumber',
    });
  return { id: uid(), background: bg, elements, duration: 4, transition: 'fade' };
}
