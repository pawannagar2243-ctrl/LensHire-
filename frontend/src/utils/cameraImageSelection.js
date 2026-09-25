export const mergeUniqueFiles = (existingFiles = [], incomingFiles = [], maxAllowed = 8) => {
  const merged = [];
  const seen = new Set();

  for (const file of [...(existingFiles || []), ...(incomingFiles || [])]) {
    if (!file || typeof file !== 'object') continue;

    const identity = `${file.name ?? 'unknown'}-${file.size ?? 0}-${file.lastModified ?? 0}-${file.type ?? ''}`;
    if (!identity || seen.has(identity)) continue;

    seen.add(identity);
    merged.push(file);

    if (merged.length >= maxAllowed) {
      break;
    }
  }

  return merged;
};
