# Ask better questions of your data

A short Pandas lesson by **Malik Kolade**. This example uses an illustrative dataset, not a real business result.

---

# Start with a small table

```python
import pandas as pd

# Illustrative data for learning
df = pd.DataFrame({
    "product": ["A", "B", "C"],
    "units": [12, 8, 15]
})
print(df.head())
```

<!-- notes: Explain that these numbers are simulated. -->

---

# Check before you calculate

- Look at column types with `df.dtypes`.
- Check missing values with `df.isna().sum()`.
- Ask what one row represents.

> [!TIP]
> A correct calculation can still answer the wrong question.

---

# Explain the average

For observations $x_1, \ldots, x_n$, the mean is:

$$
\bar{x} = \frac{1}{n}\sum_{i=1}^{n}x_i
$$

```python
mean_units = df["units"].mean()
```

---

# Keep the context

**Takeaway:** inspect, question, then calculate.

What would you check before sharing this average?

[Reference: Pandas documentation](https://pandas.pydata.org/docs/)
