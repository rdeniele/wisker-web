// MOCK DATA - COMMENTED OUT FOR TESTING REAL API
// Uncomment if you want to test UI without backend

/* export const subjects = [
  {
    id: 1,
    name: "Biology",
    notes: 0,
    time: "5s ago",
    img: "/images/wisky-read.png",
  },
  {
    id: 2,
    name: "Programming",
    notes: 5,
    time: "4d ago",
    img: "/images/wisky-read.png",
  },
  {
    id: 3,
    name: "Science",
    notes: 3,
    time: "1w ago",
    img: "/images/wisky-read.png",
  },
  {
    id: 4,
    name: "Mathematics",
    notes: 14,
    time: "5d ago",
    img: "/images/wisky-read.png",
  },
]; */

export const subjects: never[] = [];

// Mock notes data for each subject
/* export const subjectNotes: Record<number, Array<{ id: number; title: string; createdAt: Date; lastOpened: Date; characterCount: number }>> = {
  1: [
    { id: 1, title: "Cell Structure", createdAt: new Date("2024-12-10T09:30:00"), lastOpened: new Date(Date.now() - 20000), characterCount: 1245 },
    { id: 2, title: "Genetics Overview", createdAt: new Date("2024-12-12T14:20:00"), lastOpened: new Date(Date.now() - 7200000), characterCount: 892 },
  ],
  2: [
    { id: 1, title: "JavaScript Basics", createdAt: new Date("2024-12-01T10:00:00"), lastOpened: new Date(Date.now() - 300000), characterCount: 2156 },
    { id: 2, title: "React Components", createdAt: new Date("2024-12-05T11:30:00"), lastOpened: new Date(Date.now() - 3600000), characterCount: 1678 },
    { id: 3, title: "TypeScript Basics", createdAt: new Date("2024-12-08T13:45:00"), lastOpened: new Date(Date.now() - 86400000), characterCount: 3421 },
    { id: 4, title: "Next.js Routing", createdAt: new Date("2024-12-10T15:20:00"), lastOpened: new Date(Date.now() - 172800000), characterCount: 987 },
    { id: 5, title: "React Hooks", createdAt: new Date("2024-12-14T16:00:00"), lastOpened: new Date(Date.now() - 604800000), characterCount: 2543 },
  ],
  3: [
    { id: 1, title: "Physics Laws", createdAt: new Date("2024-12-03T08:15:00"), lastOpened: new Date(Date.now() - 120000), characterCount: 1834 },
    { id: 2, title: "Chemistry Basics", createdAt: new Date("2024-12-07T10:30:00"), lastOpened: new Date(Date.now() - 1800000), characterCount: 1456 },
    { id: 3, title: "Scientific Method", createdAt: new Date("2024-12-11T14:00:00"), lastOpened: new Date(Date.now() - 259200000), characterCount: 2109 },
  ],
  4: [
    { id: 1, title: "Algebra Basics", createdAt: new Date("2024-11-28T09:00:00"), lastOpened: new Date(Date.now() - 45000), characterCount: 1567 },
    { id: 2, title: "Calculus Intro", createdAt: new Date("2024-11-30T10:30:00"), lastOpened: new Date(Date.now() - 600000), characterCount: 2890 },
    { id: 3, title: "Geometry Theorems", createdAt: new Date("2024-12-02T11:15:00"), lastOpened: new Date(Date.now() - 7200000), characterCount: 1923 },
    { id: 4, title: "Trigonometry", createdAt: new Date("2024-12-04T13:20:00"), lastOpened: new Date(Date.now() - 43200000), characterCount: 2345 },
    { id: 5, title: "Statistics", createdAt: new Date("2024-12-06T14:45:00"), lastOpened: new Date(Date.now() - 129600000), characterCount: 3124 },
    { id: 6, title: "Linear Algebra", createdAt: new Date("2024-12-08T09:30:00"), lastOpened: new Date(Date.now() - 432000000), characterCount: 2678 },
    { id: 7, title: "Differential Equations", createdAt: new Date("2024-12-09T10:00:00"), lastOpened: new Date(Date.now() - 1209600000), characterCount: 3456 },
    { id: 8, title: "Number Theory", createdAt: new Date("2024-12-10T11:30:00"), lastOpened: new Date(Date.now() - 2592000000), characterCount: 1789 },
    { id: 9, title: "Set Theory", createdAt: new Date("2024-12-11T13:00:00"), lastOpened: new Date(Date.now() - 180000), characterCount: 2012 },
    { id: 10, title: "Probability", createdAt: new Date("2024-12-12T14:30:00"), lastOpened: new Date(Date.now() - 900000), characterCount: 2234 },
    { id: 11, title: "Graph Theory", createdAt: new Date("2024-12-13T15:15:00"), lastOpened: new Date(Date.now() - 10800000), characterCount: 1645 },
    { id: 12, title: "Complex Numbers", createdAt: new Date("2024-12-14T09:45:00"), lastOpened: new Date(Date.now() - 54000000), characterCount: 1901 },
    { id: 13, title: "Vectors", createdAt: new Date("2024-12-15T10:20:00"), lastOpened: new Date(Date.now() - 216000000), characterCount: 2567 },
    { id: 14, title: "Matrices", createdAt: new Date("2024-12-16T11:00:00"), lastOpened: new Date(Date.now() - 518400000), characterCount: 2890 },
  ],
}; */

export const subjectNotes: Record<
  number,
  Array<{
    id: number;
    title: string;
    createdAt: Date;
    lastOpened: Date;
    characterCount: number;
  }>
> = {};

// Mock note content data
/* export const noteContent: Record<string, { title: string; content: string }> = {
  "1-1": {
    title: "Cell Structure",
    content: `Cells are the basic building blocks of all living things. The cell structure includes various organelles that perform specific functions.

**Key Components:**
- Cell Membrane: Controls what enters and exits the cell
- Nucleus: Contains genetic material (DNA)
- Cytoplasm: Gel-like substance where organelles are suspended
- Mitochondria: Powerhouse of the cell, produces energy
- Ribosomes: Protein synthesis

**Types of Cells:**
1. Prokaryotic cells - no nucleus
2. Eukaryotic cells - have a nucleus`,
  },
  "1-2": {
    title: "Genetics Overview",
    content: `Genetics is the study of heredity and the variation of inherited characteristics.

**DNA Structure:**
DNA (Deoxyribonucleic Acid) is a double helix structure that carries genetic information.

**Key Concepts:**
- Genes: Units of heredity
- Chromosomes: Structures containing DNA
- Alleles: Different versions of the same gene
- Genotype: Genetic makeup
- Phenotype: Observable characteristics`,
  },
  "2-1": {
    title: "JavaScript Basics",
    content: `JavaScript is a versatile programming language used for web development.

**Variables:**
- let: Block-scoped variable
- const: Block-scoped constant
- var: Function-scoped variable (avoid using)

**Data Types:**
- Primitive: string, number, boolean, null, undefined, symbol
- Complex: object, array, function

**Control Flow:**
- if/else statements
- switch statements
- for/while loops`,
  },
  "2-2": {
    title: "React Components",
    content: `React components are reusable pieces of UI that can be composed together.

**Types of Components:**
1. Function Components (modern approach)
2. Class Components (legacy)

**Props:**
Data passed from parent to child components

**State:**
Internal data managed by the component

**Hooks:**
- useState: Manage state
- useEffect: Handle side effects
- useContext: Access context
- Custom hooks: Reusable logic`,
  },
}; */

export const noteContent: Record<string, { title: string; content: string }> =
  {};
