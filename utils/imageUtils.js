const isUnsplash   = (url) => url.includes('unsplash.com');
const isCloudinary = (url) => url.includes('res.cloudinary.com');
const isImgix      = (url) => url.includes('.imgix.net');

const buildUnsplashUrl = (url, width, quality) => {
  let result = url;
  if (/[?&]w=\d+/.test(result)) {
    result = result.replace(/([?&]w=)\d+/, `$1${width}`);
  } else {
    result += (result.includes('?') ? '&' : '?') + `w=${width}`;
  }
  if (/[?&]q=\d+/.test(result)) {
    result = result.replace(/([?&]q=)\d+/, `$1${quality}`);
  } else {
    result += `&q=${quality}`;
  }
  if (!/[?&]fm=/.test(result)) result += '&fm=webp';
  return result;
};

// A transformation segment looks like "w_400,q_75/" or "t_thumb/":
// 1-3 letters, an underscore, then params. The version ("v123") and folder
// names ("exploreaba/products/...") have no such underscore, so they are kept.
const TRANSFORM_SEGMENT = /\/upload\/(?:[a-z]{1,3}_[^/]*\/)+/;

const buildCloudinaryUrl = (url, width, quality) => {
  const transform = `w_${width},q_${quality},f_auto,c_fill`;
  const base = url.replace(TRANSFORM_SEGMENT, '/upload/'); // drop old transforms only
  return base.replace('/upload/', `/upload/${transform}/`); // insert ours
};

const buildImgixUrl = (url, width, quality) => {
  let result = url;
  if (/[?&]w=\d+/.test(result)) {
    result = result.replace(/([?&]w=)\d+/, `$1${width}`);
  } else {
    result += (result.includes('?') ? '&' : '?') + `w=${width}`;
  }
  if (/[?&]q=\d+/.test(result)) {
    result = result.replace(/([?&]q=)\d+/, `$1${quality}`);
  } else {
    result += `&q=${quality}`;
  }
  if (!/[?&]auto=/.test(result)) result += '&auto=format';
  return result;
};

export const optimizeUrl = (url, { width = 400, quality = 75 } = {}) => {
  if (!url || typeof url !== 'string') return url;

  try {
    if (isUnsplash(url))   return buildUnsplashUrl(url, width, quality);
    if (isCloudinary(url)) return buildCloudinaryUrl(url, width, quality);
    if (isImgix(url))      return buildImgixUrl(url, width, quality);
  } catch {
    return url;
  }

  return url;
};

export const thumbUrl  = (url) => optimizeUrl(url, { width: 400, quality: 75 });
export const mediumUrl = (url) => optimizeUrl(url, { width: 800, quality: 80 });
export const heroUrl   = (url) => optimizeUrl(url, { width: 1400, quality: 85 });
export const tinyUrl   = (url) => optimizeUrl(url, { width: 40, quality: 30 });