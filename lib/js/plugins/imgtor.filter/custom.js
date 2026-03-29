function cloneFilterOptions(src) {
  const out = {};
  for (const g of Object.keys(src)) {
    out[g] = src[g].map(function (item) {
      return { id: item.id, title: item.title };
    });
  }
  return out;
}

/**
 * Merge custom filters and menu groups into a shared registry object.
 *
 * @param {{ filterFunctions: Object, filterOptions: Object }} registry
 * @param {{ filterFunctions?: Object, filterOptions?: Object }} custom
 */
export function extendFilters(registry, custom) {
  if (custom.filterFunctions) {
    for (const k of Object.keys(custom.filterFunctions)) {
      registry.filterFunctions[k] = custom.filterFunctions[k];
    }
  }
  if (custom.filterOptions) {
    for (const g of Object.keys(custom.filterOptions)) {
      const incoming = custom.filterOptions[g];
      if (!registry.filterOptions[g]) {
        registry.filterOptions[g] = incoming.map(function (item) {
          return { id: item.id, title: item.title };
        });
      } else {
        registry.filterOptions[g] = registry.filterOptions[g].concat(
          incoming.map(function (item) {
            return { id: item.id, title: item.title };
          }),
        );
      }
    }
  }
}

export { cloneFilterOptions };
