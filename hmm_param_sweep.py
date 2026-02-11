"""HMM Bot Parameter Sweep - Find optimal TP/SL/trailing stop combos"""
import subprocess, re, json

results = []

# Test grid: TP from 1.5-4%, SL from 1-2.5%
combos = [
    (1.5, 1.0), (1.5, 1.5),
    (2.0, 1.0), (2.0, 1.5), (2.0, 2.0),
    (2.5, 1.0), (2.5, 1.5), (2.5, 2.0),
    (3.0, 1.5), (3.0, 2.0),
    (3.5, 2.0), (3.5, 2.5),
    (4.0, 2.0), (4.0, 2.5),
]

bot_file = "hmm_regime_bot.py"

# Read original
with open(bot_file) as f:
    original = f.read()

for tp, sl in combos:
    # Patch TP/SL
    patched = re.sub(r'TAKE_PROFIT_PCT = [\d.]+', f'TAKE_PROFIT_PCT = {tp}', original)
    patched = re.sub(r'STOP_LOSS_PCT = [\d.]+', f'STOP_LOSS_PCT = {sl}', patched)
    with open(bot_file, 'w') as f:
        f.write(patched)
    
    # Run backtest
    import os
    env = os.environ.copy()
    env['PYTHONUNBUFFERED'] = '1'
    out = subprocess.run(['python3', '-u', bot_file, '--backtest'], capture_output=True, text=True, timeout=120, env=env)
    output = out.stdout + out.stderr
    
    # Parse results
    def extract(pattern, text, default="N/A"):
        m = re.search(pattern, text)
        return float(m.group(1)) if m else default
    
    ret = extract(r'Return \[%\]\s+([-\d.]+)', output)
    pf = extract(r'Profit Factor\s+([-\d.]+)', output)
    wr = extract(r'Win Rate \[%\]\s+([-\d.]+)', output)
    dd = extract(r'Max\. Drawdown \[%\]\s+([-\d.]+)', output)
    sharpe = extract(r'Sharpe Ratio\s+([-\d.]+)', output)
    trades = extract(r'# Trades\s+(\d+)', output)
    expect = extract(r'Expectancy \[%\]\s+([-\d.]+)', output)
    
    results.append({
        'tp': tp, 'sl': sl, 'return': ret, 'profit_factor': pf,
        'win_rate': wr, 'max_dd': dd, 'sharpe': sharpe,
        'trades': trades, 'expectancy': expect
    })
    
    print(f"TP={tp}% SL={sl}% → Return={ret}% PF={pf} WR={wr}% DD={dd}% Sharpe={sharpe} Trades={int(trades) if trades != 'N/A' else 'N/A'} Exp={expect}%")

# Restore best
best = max([r for r in results if r['profit_factor'] != 'N/A'], key=lambda x: x['profit_factor'])
print(f"\n🏆 BEST: TP={best['tp']}% SL={best['sl']}% → Return={best['return']}% PF={best['profit_factor']} Sharpe={best['sharpe']}")

# Restore with best params
patched = re.sub(r'TAKE_PROFIT_PCT = [\d.]+', f'TAKE_PROFIT_PCT = {best["tp"]}', original)
patched = re.sub(r'STOP_LOSS_PCT = [\d.]+', f'STOP_LOSS_PCT = {best["sl"]}', patched)
with open(bot_file, 'w') as f:
    f.write(patched)

print(f"\n✅ Bot updated with best params: TP={best['tp']}% SL={best['sl']}%")

# Save all results
with open('hmm_sweep_results.json', 'w') as f:
    json.dump(results, f, indent=2)
