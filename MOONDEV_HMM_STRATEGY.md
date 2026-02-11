# MoonDev Hidden Markov Model (HMM) Trading Strategy
## Complete Analysis from "How to Actually Use AI for Trading" (7-hour livestream, 541K views, 25K likes)

---

## 🎯 Core Thesis: Why NOT Price Prediction

**Key Insight:** AI should NOT be used to predict price directly.

**MoonDev's Argument:**
- If everyone uses AI to predict the next minute/hour/day price, that price won't be the predicted price anymore
- **Unlike weather prediction** - If 2,000 people predict tomorrow will be sunny, it doesn't change the weather
- **Trading is different** - If everybody predicts price, people will buy/sell around it, changing the outcome
- This is a **self-defeating prophecy** in markets

> "If everybody uses AI to predict price, that price is not going to be the price anymore because people are going to buy and sell around it."

---

## 🔬 The Two Ways to Actually Use AI for Trading

### 1. LLMs (Large Language Models) - Claude, ChatGPT, etc.
- Use AI to take ideas from your brain and put them into code
- Test strategies that used to take months/years with teams
- **Not for prediction** - for research and backtesting automation

### 2. Hidden Markov Models (HMM) - Jim Simons' Approach
- **Machine learning model that predicts hidden STATES/REGIMES**
- Not predicting price - predicting market conditions/moods
- Jim Simons (RIP, the GOAT of algo trading) repeatedly said he liked HMMs

---

## 🧠 Hidden Markov Model Deep Dive

### What is an HMM?

**Simple Explanation:**
Think of it as a "market mood detector" that identifies different hidden states:
- **Bull market state** - upward trending regime
- **Bear market state** - downward trending regime  
- **Sideways/consolidation state** - range-bound regime
- **Panic state** - high volatility shock events

**Technical:**
- Unsupervised machine learning model
- Identifies hidden states/regimes based on observable features
- Creates a transition matrix showing probability of moving between states
- Uses Gaussian HMM (from hmmlearn library)

---

## 📊 Feature Engineering - What Data Goes In

### Features Tested (in order of importance discovered):

#### **Volume Change** 🔥 (Most Important - 94-97% importance)
- Percentage change in trading volume
- **Consistently dominated** across all model variations
- MoonDev's conclusion: Volume change captures something fundamental about Bitcoin price movements

#### **Bollinger Band Width**
- Measures volatility expansion/contraction
- 2nd most important when volume excluded

#### **Volatility**  
- Rolling standard deviation of returns
- Calculated on close price percentage changes

#### **Returns**
- Percentage change of close price
- Surprisingly less important than volume

#### Other indicators tested:
- **ADX** (Average Directional Index) - 27.85% importance in one model
- **ATR** (Average True Range)
- **Donchian Channels**
- **Linear Regression**
- **MACD** (Moving Average Convergence Divergence)
- **True Range**
- **RSI** (Relative Strength Index)
- **EMA** crossovers

### Key Finding on Features:
> **Model 2 (Best performing):** Volume Change (94%) + BB Width + Volatility
> - 7 states, 89% state prediction accuracy
> - Log likelihood: -3890 (out-of-sample)
> - BIC: -27,000 (lower is better)

---

## 🎰 State Count Experiments - How Many Regimes?

MoonDev tested multiple state configurations:

| States | State Accuracy | Log Likelihood | BIC | Notes |
|--------|---------------|----------------|-----|-------|
| 3 | High | Low | - | Too simplistic, stayed in same state |
| **7** | **84%** | **-3890** | **-27,000** | **BEST for trading - stable, interpretable** |
| 8 | 88% | Higher | - | Good but less stable |
| 9 | 88% | -15,000 | - | Solid performance |
| 10 | 86.81% | Higher | Lower | Diminishing returns |
| 15 | 86.83% | -47,000 | -93,000 | More complex |
| **24** | **72%** | **-933** | **-187,000** | **Best statistical fit, harder to interpret** |
| 50 | - | - | - | Too many, overfitting concerns |

### The Winner: **7-State Model** vs **24-State Model**

**7-State Model (Model 2):**
- **Higher short-term prediction accuracy:** 84%
- **More stable state transitions:** Entropy 2.41
- **Longer average state duration:** 6.3 periods
- **Easier to interpret for trading**
- States used: 0, 2, 4, 6 (some states never used - suggests room for optimization)

**24-State Model:**
- **Better statistical fit:** Higher log likelihood, lower BIC
- **More granular:** Captures subtle market shifts
- **More frequent state changes**
- **Harder to interpret**
- More even state distribution

**MoonDev's Conclusion:**
- Use **7-state model for practical trading** (better short-term prediction, stability)
- **24-state model** provides better fit but may be over-complex for execution
- **Kobe number (24)** had personal significance, but 7 performed better in practice

---

## 🔢 Technical Implementation

### Libraries Required:
```python
import pandas as pd
import numpy as np
from hmmlearn import hmm  # pip install hmmlearn
import pandas_ta as ta
import talib
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
```

### Code Structure (High-Level):

#### 1. Data Loading & Preprocessing
```python
# Load BTC hourly data (34 weeks for training, tested on 200+ weeks)
# Features: returns, volatility, volume_change
data['returns'] = data['close'].pct_change()
data['volatility'] = data['returns'].rolling(window=20).std()
data['volume_change'] = data['volume'].pct_change()
data.dropna(inplace=True)
```

#### 2. Feature Normalization
```python
# StandardScaler - normalizes features to 0-1 range
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

#### 3. Train HMM
```python
model = hmm.GaussianHMM(
    n_components=7,  # 7 states
    covariance_type="full",  # Considers how features relate
    n_iter=100,  # Practice 100 times to improve
    random_state=42
)
model.fit(X_scaled)
```

#### 4. Predict States
```python
states = model.predict(X_scaled)
# States are just numbers (0-6), YOU name them based on analysis
```

#### 5. Evaluate Model
```python
# State prediction accuracy
# Log likelihood (higher is better)
# BIC - Bayesian Information Criterion (lower is better)
# Feature importance analysis
```

### Transition Matrix Example:
```
State 0 → State 0: 92% (stays in calm market)
State 0 → State 1: 7% (transitions to trend)
State 0 → State 2: 1% (rare shock event)

State 1 → State 0: 24%
State 1 → State 1: 75% (trend persists)

State 2 → State 0: 100% (shock instantly reverts)
```

**Interpretation:**
- **State 0:** Normal/baseline - very stable (92% stays)
- **State 1:** Trending state - moderately stable (75% persists)
- **State 2:** Volatile shock - extremely unstable (always reverts immediately)

---

## 📈 Backtest Results

### 7-State Model Performance:

#### **BTC 10-Year Data (2015-2025):**
- **Return:** 56% vs 280% buy-and-hold
- **Exposure:** 68% (capital free 32% of time)
- **Trades:** 280
- **Sharpe:** Lower than buy-and-hold
- **Win Rate:** Solid but not disclosed
- **Expectancy:** 1.83
- **Profit Factor:** 1.6

#### **BTC 34-Week Data (Out-of-Sample):**
- **Return:** 23% vs 35% buy-and-hold ❌
- **Exposure:** **11%** 🔥 (capital free 89% of time!)
- **Sharpe:** 1.1
- **Max Trade Duration:** 2 days
- **Key Insight:** Lower return BUT 89% less risk exposure

### 24-State Model Performance:

#### **ETH 200-Week Data:**
- **Return:** 380% vs 500% buy-and-hold
- **Exposure:** **33%** 🔥
- **Sharpe:** 2.54 (excellent)
- **Win Rate:** 54%
- **Profit Factor:** 10+ (on 6-trade sample - low statistical significance)

#### **SOL Data:**
- **Return:** Beats buy-and-hold
- **Trades:** 150 (statistically significant)
- **Exposure:** 67%

### MoonDev's Backtest Conclusions:

✅ **What's Working:**
- Dramatically reduced exposure time (11-33%) while maintaining decent returns
- Acts as an excellent **regime filter**
- High Sharpe ratios (1.1 - 2.54)
- Solid expectancy and profit factors

❌ **Limitations:**
- Doesn't beat buy-and-hold on absolute returns
- **But buy-and-hold is biased on BTC** (always up over 10 years)
- This is a **filter/regime detector**, not a complete strategy

💡 **Next Steps:**
- Layer additional strategies ON TOP of regime detection
- Use HMM states to switch between mean-reversion vs trend-following
- Combine with other edge factors

> "This is really just a filter. Being able to find profitable regimes is dope, but the market just goes straight up [on BTC]. I'd be interested to see how this looks on other data."

---

## 🧩 Jim Simons Insights - What MoonDev Learned

### Key Simons Principles:

1. **Starts with Data First**
   - If you start with data → you're using machine learning
   - Not starting with indicators/theories
   - Let the data reveal patterns

2. **Likes Hidden Markov Models**
   - Mentioned HMM as a favorite model
   - Helps predict different market states/regimes

3. **Uses 4-9 Volatility Regimes**
   - Different sources cited 4, 7, 9 regimes
   - Simons may have been secretive (intentionally vague)
   - MoonDev's testing validated 7 and 24 as optimal

4. **Machine Learning = Feature Engineering**
   - The edge isn't in the model itself
   - **The edge is in WHAT features you feed it**
   - "It's all feature engineering - that's where the edge is"

5. **Never Reveal Real Edge**
   - Simons probably didn't tell us his actual approach
   - "You think he'd actually tell us what he's doing? No way."

---

## 🔄 MoonDev's RBI System for Algo Trading

**R** - **Research**
- Watch videos, read books, listen to podcasts
- Search for trading ideas constantly
- One idea can change everything

**B** - **Backtest**
- Test if the idea actually worked in the past
- Past profitability gives hope (but not guarantee) for future
- Use out-of-sample data to validate

**I** - **Implement**
- Start with tiny size
- Most work is in R and B
- Don't just buy/build bots from the internet

**Critical Philosophy:**
> "Everybody wants to build a bot, including myself. Seriously - don't just go build a bot. Don't buy a bot on the internet. If everybody's running the same algo, it's going to converge to zero profits over time. It's just math."

---

## 💭 Trading Philosophy & Methodology

### **4 Hours a Day, Every Day**
- Consistent focused work beats sporadic effort
- MoonDev streams daily to show everything live
- **3,500 hours invested** so far (target: 10,000 hours to mastery)

### **Test 100 Ideas**
- Keep shooting shots
- Don't care if you miss
- "I will just keep shooting. I don't care how much time this takes - I'm here for 60 years."

### **Repetition is Key**
- Go over code multiple times
- Explain it different ways (to 12-year-olds, traders, etc.)
- "500 shots a day since I was a kid - same game, different court"

### **Code is the Great Equalizer**
- Anyone can learn to code
- AI (Claude, ChatGPT) gives massive leverage
- "They gave us too much power with these AI platforms. If they knew how much power coders have now with AI, they would cut it off."

### **Compete with Data, Not Predictions**
- If everyone uses similar models → convergence to zero
- Need unique features, unique approaches
- **Machine learning is hard for trading BECAUSE everyone has access**

---

## 🛠️ Practical Implementation Steps

### Step 1: Capture More Data
MoonDev identified these additions:
- **Liquidation data** - Helps identify capitulation points (upward/downward)
- **Open interest**
- **Funding rates**
- **Different timeframes** (tested hourly, could try daily/4H/15min)
- **Different assets** (BTC, ETH, SOL - extend to forex, stocks)

### Step 2: Optimize State Count
- Start with 7 states (proven sweet spot)
- Test 24 if you need more granularity
- **Don't go above 50** - diminishing returns, overfitting

### Step 3: Feature Engineering Experiments
Priority order based on MoonDev's results:
1. **Volume change** (proven king - 94%+ importance)
2. **BB width** or **Volatility** (tie for 2nd)
3. **ADX** (27% importance when volume excluded)
4. Try combinations without volume to force feature diversity
5. Test liquidations, open interest, funding when available

### Step 4: Validate on Out-of-Sample Data
- Train on 34 weeks
- Test on 200+ weeks you've never shown the model
- Compare log likelihood, BIC, cross-validation scores
- **Most important:** Does it beat buy-and-hold on exposure-adjusted basis?

### Step 5: Build Regime-Based Strategy
The HMM is a **filter**, not a complete strategy:

**Example State-Based Rules:**
- **State 0 (Calm):** Use conservative strategies, scalping small profits
- **State 1 (Bullish Trend):** Implement aggressive buying, trend-following
- **State 2 (Volatile/Shock):** Stay out OR implement shorting/hedging
- **State 4 (Bearish):** Mean-reversion shorts, tight stops

### Step 6: Layer Additional Strategies
MoonDev's next steps:
- Combine HMM regime filter with proven indicators
- Switch between mean-reversion (sideways states) and trend-following (trending states)
- Use reduced exposure time (11-33%) to deploy capital elsewhere
- Multi-strategy approach based on detected regime

---

## 🧪 Model Comparison Matrix

### Best Models Tested:

| Model | Features | States | Accuracy | Log Likelihood | BIC | Notes |
|-------|----------|--------|----------|----------------|-----|-------|
| **Model 2** ⭐ | Volume(94%) + BB + Vol | 7 | 84% | -3890 | -27,000 | **Best for trading** |
| Model 24-State | Volume(94%) + BB + Vol | 24 | 72% | -933 | -187,000 | Best statistical fit |
| ADX/ATR/Don | ADX(28%) + ATR + Don | 7 | 98% | -93,000 | -187,000 | High accuracy, poor fit |
| Lin/MACD/TR | Linear Reg + MACD + TR | 7 | - | - | - | Tested, results pending |
| No-Volume | BB + Vol + RSI | 7 | 95% | -6956 | - | Forced diversity, worse fit |

### Evaluation Metrics Explained:

**State Prediction Accuracy:**
- How well the model predicts the NEXT state change
- Higher is better
- 84% = very good, 72% = acceptable, 98% = suspicious (check other metrics)

**Log Likelihood:**
- Measure of how well model fits the data
- **Higher (less negative) is better**
- -3890 beats -93,000

**BIC (Bayesian Information Criterion):**
- Balances model fit with complexity
- **Lower (more negative) is better**
- Penalizes overfitting
- -27,000 beats -187,000

**Cross-Validation Score:**
- How well model generalizes to unseen data
- Higher is better
- Positive scores better than negative

**Feature Importance:**
- Which features the model relies on most
- Sum to 100%
- High reliance on one feature (94% volume) = that feature captures something fundamental
- Balanced features = more robust but potentially less powerful

---

## 🎓 Key Learnings & Mistakes

### What Worked:
✅ Volume change as primary feature (consistent 94%+ importance)
✅ 7-state configuration (best balance of accuracy and interpretability)  
✅ StandardScaler normalization (critical for HMM)
✅ Out-of-sample testing (caught overfitting early)
✅ Testing on multiple assets (BTC, ETH, SOL)
✅ Using regime filter instead of price prediction

### What Didn't Work:
❌ 3 states - too simplistic (model stayed in one state)
❌ 50 states - too many (diminishing returns, overfitting)
❌ Trying to beat BTC buy-and-hold on raw returns (unfair comparison)
❌ Models without volume change performed significantly worse
❌ Unused states (states 1, 3, 5 in 7-state model never activated - suggests over-parameterization)

### Mistakes to Avoid:
⚠️ **Don't name states prematurely** - Let data reveal what they represent
⚠️ **Don't use HMM for price prediction** - It's for regime detection
⚠️ **Don't compare to buy-and-hold on absolute returns** - Compare on risk-adjusted basis (Sharpe, exposure time)
⚠️ **Don't skip out-of-sample testing** - In-sample will always look great
⚠️ **Don't assume more states = better** - Tested up to 50, sweet spot is 7-24

---

## 🔮 Future Research Directions

MoonDev's TODO list:

1. **Add Liquidation Data**
   - Identify upward/downward capitulation points
   - May help distinguish panic states from normal volatility

2. **Test Jim Simons' Suggested Regimes**
   - 4 volatility regimes: Low Vol, Rising Vol, High Vol, Falling Vol
   - 9 regimes (other sources mentioned this)
   - Compare to current 7/24 state models

3. **Multi-Processing for Faster Training**
   - Use Python multiprocessing library
   - Train multiple models in parallel
   - Backtest faster across parameter combinations

4. **Other HMM Types**
   - Currently using GaussianHMM
   - Research: Are there other HMM variants worth testing?

5. **Cross-Asset Validation**
   - Already tested: BTC, ETH, SOL
   - Next: Forex pairs (EUR/USD, GBP/USD, USD/JPY)
   - Stocks, commodities
   - Does volume change dominance hold across all assets?

6. **Regime-Specific Strategy Layers**
   - Mean-reversion strategies for sideways states
   - Trend-following for bullish/bearish states
   - Risk-off for volatile shock states
   - **This is where the real edge will come from**

7. **Ensemble Models**
   - Combine 7-state and 24-state predictions
   - Use both for confirmation
   - Blend HMM with other ML models (Random Forest, XGBoost)

---

## 📚 Resources & References

### Code & Tools:
- **hmmlearn:** `pip install hmmlearn`
- **pandas_ta:** Technical indicators library
- **ta-lib:** Alternative technical analysis library
- **sklearn:** StandardScaler for normalization
- **backtesting.py:** MoonDev's preferred backtesting framework

### Learning Resources:
- Andrew Ng machine learning courses (Stanford)
- "It's all feature engineering" - Andrew Ng principle
- Hidden Markov Model documentation (hmmlearn)
- Jim Simons interviews/videos on YouTube

### MoonDev's Offerings:
- **Bootcamp:** Step-by-step algo trading automation ($69)
- **Money-back guarantee** (always)
- **Daily livestreams** showing everything (free on YouTube)
- **Discord community** for sharing ideas

---

## 🎯 Conclusion - The Big Picture

### MoonDev's Core Message:

**This is just the start.**

The HMM strategy isn't a complete trading system - it's a **regime detection filter** that:
- Reduces exposure time dramatically (11-33% vs 100%)
- Identifies market moods/states with 84% accuracy
- Provides a foundation to layer profitable strategies on top

**What makes this different:**
- Not predicting price (self-defeating in crowded markets)
- Detecting REGIMES (states that persist long enough to trade)
- Using data-first approach (Jim Simons' method)
- Emphasis on out-of-sample validation

**The real work begins:**
- Feature engineering (finding unique data others don't have)
- Strategy layering (mean-reversion in sideways, trend-following in trends)
- Risk management (use the free capital from 11% exposure)
- Continuous testing and iteration

**Remember:**
> "I don't care if I miss the shot bro, I will just keep shooting. I know I'm a shooter. I'mma keep shooting. Every day for 60 years. I don't care how much time this takes - I'm here present."

---

## ⚡ Quick Reference - Best Model Spec

**Winning Configuration:**
- **Model:** GaussianHMM (hmmlearn)
- **States:** 7 (n_components=7)
- **Features:** Volume Change (94%) + BB Width + Volatility
- **Normalization:** StandardScaler (critical)
- **Training iterations:** 100
- **Random state:** 42 (for reproducibility)
- **Covariance type:** "full"

**Performance:**
- State prediction accuracy: 84%
- Log likelihood: -3890 (out-of-sample)
- BIC: -27,000
- Transition entropy: 2.41 (stable states)
- Average state duration: 6.3 periods
- States actively used: 0, 2, 4, 6

**Backtest (BTC 34-week OOS):**
- Return: 23% (vs 35% buy-and-hold)
- Exposure: 11%
- Sharpe: 1.1
- Max trade time: 2 days

**Use Case:**
Regime filter for layering additional strategies. Not meant to beat buy-and-hold alone, but to identify when to deploy capital and when to stay on sidelines.

---

*Analysis compiled from MoonDev's 7-hour livestream "How to Actually Use AI for Trading" - 541K views, 25K likes*

*MoonDev streams live every day on YouTube showing his 4-hour coding sessions*

*Current progress: 3,500 hours invested / 10,000 hours to mastery*

---

**777** 🎯
