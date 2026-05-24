// lib/customDesignData.js — universal tailoring constants
// Categories themselves live on the backend; fetch via useCustomCategories.

export const MEASUREMENT_FIELDS = {
  neck:           { label: 'Neck',                    unit: 'in', group: 'upper',  guide: 'Wrap the tape around the base of your neck where a collar would sit. Keep one finger between the tape and your skin for breathing room.',                                                                  placeholder: '14-18' },
  shoulder:       { label: 'Shoulder Width',          unit: 'in', group: 'upper',  guide: 'Measure across the back from the tip of one shoulder bone to the other. Keep the tape flat and straight.',                                                                                              placeholder: '16-20' },
  sleeve:         { label: 'Sleeve Length',           unit: 'in', group: 'upper',  guide: 'From the shoulder seam (where your arm meets your shoulder) down to where you want the sleeve to end at your wrist. Arm slightly bent.',                                                                placeholder: '23-26' },
  bicep:          { label: 'Bicep',                   unit: 'in', group: 'upper',  guide: 'Wrap the tape around the fullest part of your upper arm. Keep your arm relaxed, not flexed.',                                                                                                            placeholder: '11-16' },
  wrist:          { label: 'Wrist',                   unit: 'in', group: 'upper',  guide: 'Wrap the tape around your wrist where a watch or cuff would sit.',                                                                                                                                       placeholder: '6-8'   },
  backLength:     { label: 'Back Length',             unit: 'in', group: 'upper',  guide: 'From the bone at the base of your neck (the one that sticks out when you tilt your head down) straight down to your natural waistline.',                                                                placeholder: '16-20' },
  chest:          { label: 'Chest',                   unit: 'in', group: 'upper',  guide: 'Wrap the tape around the fullest part of your chest, just under your armpits. Keep it level all the way around.',                                                                                       placeholder: '36-46' },
  bust:           { label: 'Bust',                    unit: 'in', group: 'upper',  guide: 'Wrap the tape around the fullest part of your bust, keeping it parallel to the floor. Wear a regular bra (not padded or push-up).',                                                                     placeholder: '32-44' },
  underBust:      { label: 'Under Bust',              unit: 'in', group: 'upper',  guide: 'Wrap the tape around your ribcage, directly under your bust where the bra band sits.',                                                                                                                  placeholder: '28-38' },
  shoulderToBust: { label: 'Shoulder to Bust Point',  unit: 'in', group: 'upper',  guide: 'From the top of your shoulder (where the strap sits) straight down to the fullest point of your bust.',                                                                                                 placeholder: '9-12'  },
  bustPointDistance: { label: 'Bust Point to Point',  unit: 'in', group: 'upper',  guide: 'The horizontal distance between the two fullest points of your bust. Used for accurate dart placement.',                                                                                                placeholder: '6-9'   },
  frontLength:    { label: 'Front Length',            unit: 'in', group: 'upper',  guide: 'From the base of your neck, down the front of your body, to your natural waistline.',                                                                                                                   placeholder: '14-18' },
  waist:          { label: 'Natural Waist',           unit: 'in', group: 'lower',  guide: 'The narrowest part of your torso — usually about an inch above your belly button. Keep the tape level.',                                                                                                placeholder: '26-40' },
  hip:            { label: 'Hip',                     unit: 'in', group: 'lower',  guide: 'The fullest part of your hips and seat — usually about 7-9 inches below your natural waist. Keep the tape parallel to the floor.',                                                                      placeholder: '34-46' },
  highHip:        { label: 'High Hip',                unit: 'in', group: 'lower',  guide: 'About 4 inches below your natural waist — across the top of your hipbones.',                                                                                                                            placeholder: '32-44' },
  trouserWaist:   { label: 'Trouser Waist',           unit: 'in', group: 'lower',  guide: 'Where you actually want your trousers to sit. Often slightly below the natural waist.',                                                                                                                  placeholder: '28-42' },
  inseam:         { label: 'Inseam',                  unit: 'in', group: 'lower',  guide: 'From the top of your inner thigh (crotch seam) straight down the inside of your leg to where you want the trouser to end.',                                                                             placeholder: '28-34' },
  outseam:        { label: 'Outseam',                 unit: 'in', group: 'lower',  guide: 'From your trouser waist down the outside of your leg to where the trouser should end.',                                                                                                                 placeholder: '38-44' },
  thigh:          { label: 'Thigh',                   unit: 'in', group: 'lower',  guide: 'Around the fullest part of your upper thigh, near the crotch.',                                                                                                                                          placeholder: '20-28' },
  knee:           { label: 'Knee',                    unit: 'in', group: 'lower',  guide: 'Around your knee, with leg slightly bent.',                                                                                                                                                              placeholder: '14-18' },
  ankle:          { label: 'Trouser Bottom',          unit: 'in', group: 'lower',  guide: 'How wide you want the trouser opening at the ankle.',                                                                                                                                                    placeholder: '13-18' },
  topLength:      { label: 'Top Length',              unit: 'in', group: 'length', guide: 'From the top of your shoulder straight down to where you want the top to end.',                                                                                                                         placeholder: '24-32' },
  dressLength:    { label: 'Dress Length',            unit: 'in', group: 'length', guide: 'From the top of your shoulder straight down to where you want the dress to end (mini, knee, midi, ankle, or floor).',                                                                                  placeholder: '36-58' },
  skirtLength:    { label: 'Skirt Length',            unit: 'in', group: 'length', guide: 'From your natural waist down to where you want the skirt to end.',                                                                                                                                       placeholder: '18-40' },
  fullLength:     { label: 'Full Garment Length',     unit: 'in', group: 'length', guide: 'For agbada or long kaftans — from the top of your shoulder all the way down to where you want the hem (often ankle).',                                                                                  placeholder: '52-60' },
};

export const MEASUREMENT_SETS = {
  menFull:           ['neck', 'chest', 'shoulder', 'sleeve', 'bicep', 'wrist', 'waist', 'hip', 'trouserWaist', 'thigh', 'knee', 'ankle', 'inseam', 'outseam', 'fullLength'],
  unisexUpperLong:   ['neck', 'chest', 'shoulder', 'sleeve', 'bicep', 'wrist', 'waist', 'hip', 'fullLength'],
  unisexUpperShort:  ['neck', 'chest', 'shoulder', 'sleeve', 'bicep', 'wrist', 'waist', 'topLength'],
  unisexLower:       ['trouserWaist', 'hip', 'thigh', 'knee', 'ankle', 'inseam', 'outseam'],
  womenFull:         ['bust', 'underBust', 'shoulderToBust', 'bustPointDistance', 'shoulder', 'sleeve', 'bicep', 'wrist', 'waist', 'highHip', 'hip', 'frontLength', 'backLength', 'thigh', 'knee', 'inseam', 'dressLength'],
  womenUpperLower:   ['bust', 'underBust', 'shoulderToBust', 'shoulder', 'sleeve', 'bicep', 'waist', 'hip', 'highHip', 'topLength', 'skirtLength'],
};

export const SIZE_CHARTS = {
  men: [
    { size: 'S',   chest: '36-38', waist: '30-32', hip: '36-38', neck: '14-14.5' },
    { size: 'M',   chest: '38-40', waist: '32-34', hip: '38-40', neck: '15-15.5' },
    { size: 'L',   chest: '40-42', waist: '34-36', hip: '40-42', neck: '16-16.5' },
    { size: 'XL',  chest: '42-44', waist: '36-38', hip: '42-44', neck: '17-17.5' },
    { size: 'XXL', chest: '44-46', waist: '38-40', hip: '44-46', neck: '18-18.5' },
    { size: '3XL', chest: '46-48', waist: '40-42', hip: '46-48', neck: '19-19.5' },
  ],
  women: [
    { size: 'XS / 6',   bust: '32-33', waist: '24-25', hip: '34-35' },
    { size: 'S / 8',    bust: '34-35', waist: '26-27', hip: '36-37' },
    { size: 'M / 10',   bust: '36-37', waist: '28-29', hip: '38-39' },
    { size: 'L / 12',   bust: '38-39', waist: '30-31', hip: '40-41' },
    { size: 'XL / 14',  bust: '40-41', waist: '32-33', hip: '42-43' },
    { size: 'XXL / 16', bust: '42-43', waist: '34-35', hip: '44-45' },
    { size: '3XL / 18', bust: '44-46', waist: '36-38', hip: '46-48' },
  ],
};

export const FITTING_PREFERENCES = [
  { id: 'slim',    name: 'Slim Fit',    desc: 'Close to body, tapered through waist and arms.',  priceModifier: 0.10 },
  { id: 'regular', name: 'Regular Fit', desc: 'Classic comfortable fit with room to move.',      priceModifier: 0    },
  { id: 'loose',   name: 'Loose Fit',   desc: 'Relaxed and roomy. More flow, less structure.',   priceModifier: 0    },
];

export const FABRIC_GRADES = [
  { id: 'standard', name: 'Standard',  desc: 'Quality everyday fabrics',         priceModifier: 0    },
  { id: 'premium',  name: 'Premium',   desc: 'Higher-grade weaves, finer feel',  priceModifier: 0.30 },
  { id: 'luxury',   name: 'Luxury',    desc: 'Imported, signature fabrics',      priceModifier: 0.60 },
];

export const EMBROIDERY_LEVELS = [
  { id: 'none',  name: 'None',           desc: 'Clean, no embroidery',           priceModifier: 0    },
  { id: 'light', name: 'Light Detail',   desc: 'Cuffs, collar, or chest only',   priceModifier: 0.15 },
  { id: 'heavy', name: 'Heavy / Full',   desc: 'Across body, intricate pattern', priceModifier: 0.30 },
];

export const LEAD_TIME_OPTIONS = [
  { id: 'standard', name: 'Standard',  desc: 'As listed for category',     priceModifier: 0    },
  { id: 'rush',     name: 'Rush',      desc: 'Fast-track — 5 to 7 days',   priceModifier: 0.25 },
];

// Live estimate. Handles both `basePrice/maxPrice` (when admin sets them) and
// fallback to `priceFrom` from backend (derives max as 2.5x).
export const computeEstimate = (category, choices) => {
  if (!category) return { low: 0, high: 0 };
  const basePrice = Number(category.basePrice ?? category.priceFrom ?? 0);
  const maxPrice  = Number(category.maxPrice  ?? basePrice * 2.5);
  if (basePrice <= 0) return { low: 0, high: 0 };

  const { fabric = 'standard', embroidery = 'none', leadTime = 'standard', fitting = 'regular' } = choices || {};
  const modifier =
    (FABRIC_GRADES.find((f) => f.id === fabric)?.priceModifier || 0) +
    (EMBROIDERY_LEVELS.find((e) => e.id === embroidery)?.priceModifier || 0) +
    (LEAD_TIME_OPTIONS.find((l) => l.id === leadTime)?.priceModifier || 0) +
    (FITTING_PREFERENCES.find((f) => f.id === fitting)?.priceModifier || 0);

  const mid = ((basePrice + maxPrice) / 2) * (1 + modifier);
  return { low: Math.round(mid * 0.85), high: Math.round(mid * 1.15) };
};

export const getMeasurementsForCategory = (category) =>
  (MEASUREMENT_SETS[category?.measurementSet] || []).map((id) => ({
    id,
    ...MEASUREMENT_FIELDS[id],
  }));

// AsyncStorage keys
export const STORAGE_KEYS = {
  draft:        'exploreaba_custom_order_draft',
  measurements: 'exploreaba_saved_measurements',
  orders:       'exploreaba_custom_orders',
};

export const WHATSAPP_NUMBER = '2348067087863';