/**
 * Nested filter menu: group name → list of { id, title }.
 * id `null` means no matrix (original / reset selection only).
 */
export const defaultFilterOptions = {
  Default: [{ id: null, title: 'Original' }],
  Classic: [
    { id: 'chrome', title: 'Chrome' },
    { id: 'fade', title: 'Fade' },
    { id: 'pastel', title: 'Pastel' },
    { id: 'warm', title: 'Warm' },
    { id: 'cold', title: 'Cold' },
  ],
  Monochrome: [
    { id: 'monoDefault', title: 'Mono' },
    { id: 'monoNoir', title: 'Noir' },
    { id: 'monoWash', title: 'Wash' },
    { id: 'monoStark', title: 'Stark' },
  ],
  Sepia: [
    { id: 'sepiaDefault', title: 'Sepia' },
    { id: 'sepiaRust', title: 'Rust' },
    { id: 'sepiaBlues', title: 'Blues' },
    { id: 'sepiaColor', title: 'Color' },
  ],
};
