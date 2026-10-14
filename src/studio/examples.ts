export const examples = [
  {
    name: 'Python · First look at a dataset',
    topic: 'Python / Pandas',
    source:
      '# Ask better questions of your data\n\nA short Pandas lesson by **Malik Kolade**. This example uses an illustrative dataset, not a real business result.\n\n---\n\n# Start with a small table\n\n```python\nimport pandas as pd\n\n# Illustrative data for learning\ndf = pd.DataFrame({\n    "product": ["A", "B", "C"],\n    "units": [12, 8, 15]\n})\nprint(df.head())\n```\n\n<!-- notes: Explain that these numbers are simulated. -->\n\n---\n\n# Check before you calculate\n\n- Look at column types with `df.dtypes`.\n- Check missing values with `df.isna().sum()`.\n- Ask what one row represents.\n\n> [!TIP]\n> A correct calculation can still answer the wrong question.\n\n---\n\n# Explain the average\n\nFor observations $x_1, \\ldots, x_n$, the mean is:\n\n$$\n\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n}x_i\n$$\n\n```python\nmean_units = df["units"].mean()\n```\n\n---\n\n# Keep the context\n\n**Takeaway:** inspect, question, then calculate.\n\nWhat would you check before sharing this average?\n\n[Reference: Pandas documentation](https://pandas.pydata.org/docs/)',
  },
  {
    name: 'Statistics · Understanding spread',
    topic: 'Statistics',
    source:
      '# Same mean. Different stories.\n\nA statistical explanation using **illustrative observations**.\n\n---\n\n# Look beyond the centre\n\n| Sample | Observations | Mean |\n| --- | --- | --- |\n| A | 4, 5, 6 | 5 |\n| B | 1, 5, 9 | 5 |\n\nThe means match, but the spread does not.\n\n---\n\n# Sample standard deviation\n\n$$\ns = \\sqrt{\\frac{\\sum_{i=1}^{n}(x_i-\\bar{x})^2}{n-1}}\n$$\n\nThe denominator is $n-1$ for this sample statistic.\n\n---\n\n# A worked example\n\nFor A, squared deviations sum to $1+0+1=2$.\n\n$$\ns_A=\\sqrt{2/2}=1\n$$\n\nFor B, squared deviations sum to $16+0+16=32$, so $s_B=4$.\n\n---\n\n# Read the distribution\n\n**Spread matters.** Report context, sample size, and units alongside a summary statistic.\n\nTry explaining the difference without using a formula.',
  },
  {
    name: 'Economics · Read a trend carefully',
    topic: 'Economics / Visualization',
    source:
      '# A line is not the whole story\n\nAn economic data visualization lesson. **All values below are simulated** and are not Nigerian official statistics.\n\n---\n\n# Start with the source\n\n| Period | Illustrative index |\n| --- | --- |\n| 2021 | 100 |\n| 2022 | 108 |\n| 2023 | 112 |\n| 2024 | 119 |\n\nAlways label the base period, unit, and source.\n\n---\n\n# Level and growth are different\n\n$$\ng_t=\\frac{I_t-I_{t-1}}{I_{t-1}}\\times100\n$$\n\nAn index level describes a position relative to a base. Growth describes a change between periods.\n\n---\n\n# Plot honestly\n\n- Use a clearly labeled time axis.\n- Explain any transformation.\n- Distinguish nominal and real values.\n- Do not infer causation from a trend alone.\n\n---\n\n# Ask one more question\n\nWhat changed in the measurement, coverage, or economic context?\n\nReplace simulated data with a verified source before making factual claims.\n\n[Source discovery: National Bureau of Statistics](https://www.nigerianstat.gov.ng/)',
  },
];
