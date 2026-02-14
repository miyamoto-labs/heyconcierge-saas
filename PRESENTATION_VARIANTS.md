# HeyConcierge Presentation Variants

Created: 2026-02-14  
Purpose: Multiple frontend designs for different presentation contexts

## Available Variants

### 1. **Original (Playful/Consumer)** 
📁 `app/page.tsx`

**Vibe:** Friendly, fun, approachable  
**Target:** Individual hosts, small vacation rentals, Airbnb hosts  
**Colors:** Purple/pink/mint (playful palette)  
**Mascot:** Happy animated character with sparkles  
**Best for:**
- Small property owners
- Individual Airbnb hosts  
- Boutique guesthouses
- Presentations emphasizing ease-of-use

---

### 2. **Cruise Line (Maritime/Corporate)** 🚢
📁 `app/page-cruise.tsx`

**Vibe:** Professional, nautical, premium  
**Target:** Cruise lines, maritime hospitality  
**Colors:** Navy blue, gold, ocean blue (maritime)  
**Mascot:** Captain's hat + suit overlay (needs CSS customization)  
**Special elements:**
- Animated ship floating on waves
- Compass rose decoration
- Nautical stars background
- Wave animations
- Maritime color scheme

**Best for:**
- Cruise line pitches
- Large fleet operators
- Premium maritime hospitality
- Corporate presentations to shipping/cruise companies

**Key Messaging:**
- "Enterprise-Grade Guest Services at Sea & Shore"
- Fleet-wide deployment
- Multi-vessel management
- Premium service focus

---

### 3. **Corporate Hotel/Resort** 🏨
📁 `app/page-corporate.tsx`

**Vibe:** Clean, professional, data-driven  
**Target:** Hotel chains, resort groups, corporate hospitality  
**Colors:** Slate/blue (minimal, professional)  
**Mascot:** Professional setting (in clean white card)  
**Special elements:**
- Trust badges (SOC 2, GDPR, 99.9% uptime)
- ROI metrics prominently displayed
- Business-focused language
- Stats bar with key numbers

**Best for:**
- Hotel chain presentations
- Resort group pitches
- Enterprise sales meetings
- Investor presentations
- ROI-focused discussions

**Key Messaging:**
- "Measurable Business Impact"
- 40% cost reduction
- Enterprise security
- Scalable pricing

---

## How to Use

### For Demo/Presentation

**Option A: Swap the main file**
```bash
# Back up original
cp app/page.tsx app/page-original.tsx

# Use cruise variant
cp app/page-cruise.tsx app/page.tsx

# Deploy or run locally
npm run dev
```

**Option B: Deploy multiple versions to different URLs**
```bash
# Create separate routes
mkdir -p app/cruise
cp app/page-cruise.tsx app/cruise/page.tsx

mkdir -p app/corporate  
cp app/page-corporate.tsx app/corporate/page.tsx

# Access via:
# https://heyconcierge.vercel.app/         (original)
# https://heyconcierge.vercel.app/cruise   (cruise variant)
# https://heyconcierge.vercel.app/corporate (corporate variant)
```

### Recommended Presentation Flow

**For Cruise Lines:**
1. Use `page-cruise.tsx`
2. Emphasize fleet-wide deployment
3. Show captain mascot for brand alignment
4. Highlight multilingual + 24/7 for international passengers
5. Focus on enterprise features + SLA

**For Hotel Chains:**
1. Use `page-corporate.tsx`
2. Lead with ROI metrics (40% cost reduction)
3. Show trust badges (SOC 2, GDPR)
4. Emphasize scalability (Starter → Enterprise)
5. Data-driven pitch (satisfaction scores, response times)

**For Small Operators:**
1. Use `page.tsx` (original)
2. Emphasize simplicity ("5 minutes to set up")
3. Show friendly mascot (approachable)
4. Focus on low cost (€49/month Starter tier)
5. No-code setup appeal

---

## Customization Notes

### Mascot Captain's Hat (Cruise Variant)

**Currently:** SVG overlay positioned via CSS  
**To improve:** Edit `components/MascotSVG.tsx` to add captain's hat directly to SVG

```tsx
// Add to MascotSVG component when variant="captain" prop is passed
<g transform="translate(50, 10)">
  {/* Captain's hat SVG */}
</g>
```

### Ship Animation

Cruise variant includes animated ship (`ship-float` animation). Can be customized:
- Change ship size in CSS
- Adjust wave amplitude
- Add more nautical elements (anchors, lighthouses, etc.)

### Color Themes

Each variant has CSS variables at top:
- **Cruise:** `--navy`, `--gold`, `--ocean`
- **Corporate:** `--corp-navy`, `--corp-blue`, `--corp-gray`
- **Original:** Tailwind theme (purple/pink/mint)

Easy to adjust for specific brand guidelines.

---

## Partner Presentation Strategy

### Jacob/Mildrid/Lars Meeting (Feb 16)

**Recommended approach:**
1. **Show original** first (what exists today)
2. **Switch to corporate** variant mid-presentation
3. Explain: "We can customize branding per vertical"
4. Emphasize: Professional + playful versions both ready

**Benefits:**
- Shows polish + attention to detail
- Demonstrates market flexibility
- Proves we're thinking about different customer segments
- Ready for diverse sales channels

---

## Next Steps

**Quick Wins:**
1. Deploy all 3 variants to separate routes on Vercel
2. Create screenshots of each for sales deck
3. Add mascot captain's hat to SVG component properly
4. Consider luxury villa variant (gold/marble theme)

**Future Variants (if needed):**
- Budget hostel (vibrant, youth-focused)
- Luxury villa (marble, gold, exclusivity)
- Camping/glamping (nature theme)
- Business hotel (minimal, efficiency-focused)

---

**Files created:**
- ✅ `app/page.tsx` (original - already existed)
- ✅ `app/page-cruise.tsx` (maritime/corporate cruise)
- ✅ `app/page-corporate.tsx` (hotel/resort corporate)
- ✅ `PRESENTATION_VARIANTS.md` (this file)

All variants use the same components, just styled differently. Easy to maintain.
