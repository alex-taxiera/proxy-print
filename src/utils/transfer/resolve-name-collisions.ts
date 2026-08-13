/**
 * Given names already in use and a list of incoming names, returns a mapping
 * from incoming name -> name to actually use. When `overwrite` is false,
 * colliding names get a " (n)" suffix; when true, collisions are left as-is
 * so the caller overwrites the existing entry.
 */
export const resolveNameCollisions = (
  existingNames: string[],
  incomingNames: string[],
  overwrite: boolean,
): Map<string, string> => {
  const taken = new Set(existingNames);
  const resolved = new Map<string, string>();

  for (const name of incomingNames) {
    if (!taken.has(name) || overwrite) {
      resolved.set(name, name);
      taken.add(name);
      continue;
    }

    let attempt = 2;
    let candidate = `${name} (${attempt})`;
    while (taken.has(candidate)) {
      attempt += 1;
      candidate = `${name} (${attempt})`;
    }
    resolved.set(name, candidate);
    taken.add(candidate);
  }

  return resolved;
};
