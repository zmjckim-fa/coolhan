import numpy as np, json, hashlib, platform

SEED = 20260613
rng = np.random.default_rng(SEED)

# Synthetic data: group X has a real shift over group Y (true effect present)
nX, nY = 80, 80
groupX = rng.normal(loc=0.8, scale=1.0, size=nX)
groupY = rng.normal(loc=0.0, scale=1.0, size=nY)

raw_data = np.concatenate([groupX, groupY])
labels = np.array([1]*nX + [0]*nY)
data_hash = hashlib.sha256(raw_data.tobytes()).hexdigest()[:16]

def welch_t(a, b):
    # Welch's t and two-sided p via normal approx of t (degrees high enough); use scipy-free
    ma, mb = a.mean(), b.mean()
    va, vb = a.var(ddof=1), b.var(ddof=1)
    se = np.sqrt(va/len(a) + vb/len(b))
    t = (ma - mb)/se
    # df Welch
    df = (va/len(a)+vb/len(b))**2 / ((va/len(a))**2/(len(a)-1) + (vb/len(b))**2/(len(b)-1))
    return t, df, ma-mb, se

def cohens_d(a,b):
    pooled = np.sqrt(((len(a)-1)*a.var(ddof=1)+(len(b)-1)*b.var(ddof=1))/(len(a)+len(b)-2))
    return (a.mean()-b.mean())/pooled

# t-distribution survival via numerical integration (no scipy)
def t_sf_two_sided(t, df):
    # use Monte Carlo from t-distribution to estimate two-sided p
    samp = rng.standard_t(df, size=2_000_000)
    return float(np.mean(np.abs(samp) >= abs(t)))

# --- H1: groupX mean > groupY mean (competing: H0 null = no difference) ---
t_obs, df, diff, se = welch_t(groupX, groupY)
p_obs = t_sf_two_sided(t_obs, df)
d_obs = cohens_d(groupX, groupY)

# --- Competing hypothesis scoring: H0 (no effect) vs H1 (effect) via likelihood-ish ---
# Score = effect size magnitude; null predicts ~0
score_H1 = abs(d_obs)
score_H0 = 0.0  # null predicts no difference

# --- Negative control: shuffle labels, effect should vanish ---
shuffle_diffs = []
for _ in range(2000):
    perm = rng.permutation(labels)
    a = raw_data[perm==1]; b = raw_data[perm==0]
    shuffle_diffs.append(a.mean()-b.mean())
shuffle_diffs = np.array(shuffle_diffs)
shuffle_mean_abs = float(np.mean(np.abs(shuffle_diffs)))
# perm-test p: fraction of |shuffled diff| >= |observed diff|
perm_p = float(np.mean(np.abs(shuffle_diffs) >= abs(diff)))
shuffle_effect_gone = shuffle_mean_abs < abs(diff)/2  # effect drops sharply under shuffle

# --- Held-out: hold out 25%, recompute on remaining 75% ---
ho_idx = rng.choice(len(raw_data), size=len(raw_data)//4, replace=False)
mask = np.ones(len(raw_data), bool); mask[ho_idx]=False
a2 = raw_data[mask & (labels==1)]; b2 = raw_data[mask & (labels==0)]
t2,df2,diff2,se2 = welch_t(a2,b2)
p2 = t_sf_two_sided(t2, df2)
held_out_reproduced = (diff2 > 0) and (p2 < 0.05)

# --- Multiple comparison: pretend we ran 3 tests; apply FDR (Benjamini-Hochberg) ---
pvals = np.array([p_obs, perm_p, p2])
def bh_fdr(p):
    p = np.asarray(p); n=len(p); order=np.argsort(p)
    ranked = p[order]*n/(np.arange(1,n+1))
    # enforce monotonicity
    ranked = np.minimum.accumulate(ranked[::-1])[::-1]
    out=np.empty(n); out[order]=np.clip(ranked,0,1); return out
p_fdr = bh_fdr(pvals)

result = {
  "seed": SEED,
  "data_hash": data_hash,
  "n": {"X": nX, "Y": nY},
  "observed": {
    "mean_X": round(float(groupX.mean()),4),
    "mean_Y": round(float(groupY.mean()),4),
    "diff": round(float(diff),4),
    "welch_t": round(float(t_obs),4),
    "df": round(float(df),2),
    "p_raw": round(float(p_obs),5),
    "cohens_d": round(float(d_obs),4)
  },
  "competing_scores": {"H1_effect": round(score_H1,4), "H0_null": score_H0},
  "negative_control_shuffle": {
    "mean_abs_shuffled_diff": round(shuffle_mean_abs,4),
    "perm_test_p": round(perm_p,5),
    "effect_gone_under_shuffle": bool(shuffle_effect_gone)
  },
  "held_out": {
    "diff_75pct": round(float(diff2),4),
    "p_75pct": round(float(p2),5),
    "reproduced": bool(held_out_reproduced)
  },
  "multiple_comparison_fdr": {
    "p_raw": [round(float(x),5) for x in pvals],
    "p_fdr": [round(float(x),5) for x in p_fdr],
    "any_significant_after_fdr": bool(np.any(p_fdr<0.05))
  },
  "env": platform.python_version()
}
with open("sci-S2-results.json","w") as f: json.dump(result,f,indent=2)
print(json.dumps(result,indent=2))
