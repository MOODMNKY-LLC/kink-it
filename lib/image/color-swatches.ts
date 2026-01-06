/**
 * Color Swatches for Image Generation Props
 * Provides hex color values for skin tones, hair colors, and item colors
 */

// Skin Tone Color Swatches (hex values)
export const SKIN_TONE_COLORS: Record<string, string> = {
  "fair": "#F4E4BC",
  "light": "#E6C79A",
  "light brown": "#D4A574",
  "warm, light brown or tanned": "#C68642",
  "tanned": "#B87333",
  "medium brown": "#8B4513",
  "dark brown": "#654321",
  "deep": "#3D2817",
}

// Hair Color Swatches (hex values) - Maps hair option names to colors
export const HAIR_COLOR_COLORS: Record<string, string> = {
  // Brown shades
  "short spiky brown hair": "#8B4513",
  "medium length brown hair": "#654321",
  "long brown hair": "#5C4033",
  "short spiky dark brown hair": "#3D2817",
  "medium length dark brown hair": "#3D2817",
  "long dark brown hair": "#3D2817",
  "short spiky light brown hair": "#A0826D",
  "medium length light brown hair": "#A0826D",
  "long light brown hair": "#A0826D",
  "short spiky chestnut hair": "#954535",
  "medium length chestnut hair": "#954535",
  "long chestnut hair": "#954535",
  "wavy brown hair": "#8B4513",
  "curly brown hair": "#8B4513",
  "straight brown hair": "#8B4513",
  "braided brown hair": "#8B4513",
  "undercut brown hair": "#8B4513",
  "fade brown hair": "#8B4513",
  "mohawk brown": "#8B4513",
  "dreadlocks brown": "#8B4513",
  "afro brown": "#8B4513",
  // Black shades
  "short spiky black hair": "#1A1A1A",
  "medium length black hair": "#000000",
  "long black hair": "#1C1C1C",
  "wavy black hair": "#000000",
  "curly black hair": "#000000",
  "straight black hair": "#000000",
  "braided black hair": "#000000",
  "undercut black hair": "#000000",
  "fade black hair": "#000000",
  "mohawk black": "#000000",
  "dreadlocks black": "#000000",
  "afro black": "#000000",
  // Blonde shades
  "short spiky blonde hair": "#F5DEB3",
  "medium length blonde hair": "#F5DEB3",
  "long blonde hair": "#F5DEB3",
  "wavy blonde hair": "#F5DEB3",
  "curly blonde hair": "#F5DEB3",
  "straight blonde hair": "#F5DEB3",
  "braided blonde hair": "#F5DEB3",
  "undercut blonde hair": "#F5DEB3",
  "fade blonde hair": "#F5DEB3",
  "mohawk blonde": "#F5DEB3",
  "short spiky platinum hair": "#E5E4E2",
  "short spiky silver hair": "#C0C0C0",
  // Red shades
  "short spiky red hair": "#A52A2A",
  "medium length red hair": "#A52A2A",
  "long red hair": "#A52A2A",
  "wavy red hair": "#A52A2A",
  "straight red hair": "#A52A2A",
  "undercut red hair": "#A52A2A",
  "fade red hair": "#A52A2A",
  "mohawk red": "#A52A2A",
  "short spiky auburn hair": "#922724",
  "medium length auburn hair": "#922724",
  "long auburn hair": "#922724",
  "short spiky copper hair": "#B87333",
  "short spiky burgundy hair": "#800020",
  "short spiky orange hair": "#FF8C00",
  // Gray/White shades
  "short spiky gray hair": "#808080",
  "medium length gray hair": "#808080",
  "long gray hair": "#808080",
  "fade gray hair": "#808080",
  "afro gray": "#808080",
  "short spiky white hair": "#FFFFFF",
  "medium length white hair": "#FFFFFF",
  "long white hair": "#FFFFFF",
  // Unnatural colors
  "short spiky blue hair": "#0000FF",
  "mohawk multicolored": "#FF00FF",
  "dreadlocks multicolored": "#FF00FF",
  "short spiky multicolored hair": "#FF00FF",
  "short spiky green hair": "#00FF00",
  "short spiky purple hair": "#800080",
  "short spiky pink hair": "#FFC0CB",
  // No hair
  "buzz cut": "#2F2F2F",
  "bald": "#000000",
  "shaved head": "#1A1A1A",
  "bald with beard": "#000000",
}

// Background Color Swatches (hex values)
export const BACKGROUND_COLOR_SWATCHES: Record<string, string> = {
  "black": "#000000",
  "white": "#FFFFFF",
  "dark blue": "#00008B",
  "dark gray": "#404040",
  "charcoal": "#36454F",
  "navy": "#000080",
  "burgundy": "#800020",
  "forest green": "#228B22",
  "brown": "#8B4513",
  "tan": "#D2B48C",
}

// Item Color Options (for clothing, accessories)
export const ITEM_COLOR_OPTIONS = [
  { name: "black", hex: "#000000" },
  { name: "white", hex: "#FFFFFF" },
  { name: "gray", hex: "#808080" },
  { name: "navy", hex: "#000080" },
  { name: "brown", hex: "#8B4513" },
  { name: "tan", hex: "#D2B48C" },
  { name: "burgundy", hex: "#800020" },
  { name: "forest green", hex: "#228B22" },
  { name: "red", hex: "#FF0000" },
  { name: "blue", hex: "#0000FF" },
  { name: "green", hex: "#008000" },
  { name: "purple", hex: "#800080" },
] as const

export type ItemColor = typeof ITEM_COLOR_OPTIONS[number]["name"]

// Eye Color Swatches (hex values)
export const EYE_COLOR_COLORS: Record<string, string> = {
  // Brown eyes
  "dark brown eyes": "#3D2817",
  "brown eyes": "#654321",
  "light brown eyes": "#8B4513",
  "amber brown eyes": "#D4A574",
  "honey brown eyes": "#C68642",
  "chocolate brown eyes": "#5C4033",
  "chestnut brown eyes": "#954535",
  // Blue eyes
  "blue eyes": "#4169E1",
  "dark blue eyes": "#00008B",
  "light blue eyes": "#87CEEB",
  "sky blue eyes": "#87CEEB",
  "ocean blue eyes": "#006994",
  "steel blue eyes": "#4682B4",
  "ice blue eyes": "#B0E0E6",
  "navy blue eyes": "#000080",
  // Green eyes
  "green eyes": "#228B22",
  "dark green eyes": "#006400",
  "light green eyes": "#90EE90",
  "emerald green eyes": "#50C878",
  "hazel green eyes": "#8B7355",
  "forest green eyes": "#228B22",
  "jade green eyes": "#00A86B",
  // Gray eyes
  "gray eyes": "#808080",
  "dark gray eyes": "#696969",
  "light gray eyes": "#D3D3D3",
  "steel gray eyes": "#708090",
  "silver gray eyes": "#C0C0C0",
  // Hazel eyes
  "hazel eyes": "#8B7355",
  "light hazel eyes": "#A0826D",
  "dark hazel eyes": "#654321",
  "amber hazel eyes": "#D4A574",
  // Other colors
  "amber eyes": "#FFBF00",
  "golden eyes": "#FFD700",
  "yellow eyes": "#FFFF00",
  "violet eyes": "#8A2BE2",
  "purple eyes": "#800080",
  "red eyes": "#FF0000",
  "heterochromia (different colored eyes)": "#808080",
}

