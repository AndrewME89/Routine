// Auslan Drive folder supplied by the user — the authoritative resource
// library. Individual file links aren't known here, so starter resources
// point at the folder itself until Andrew edits in the specific file URL.
export const AUSLAN_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1wDlUGgaR5IvDDa4MLOtHnzRr4dRZSYoh";

// Source priority, as supplied — shown in-app so the ordering is never lost.
export const AUSLAN_SOURCE_PRIORITY = [
  "Personal - Education - Auslan - Student Book.pdf",
  "Auslan Alphabet PDF",
  "Auslan Reference Images / fingerspelling poster",
  "Other clearly identified Auslan resources",
];

// General reference facts, as supported by the Student Book. Written here as
// plain notes, not reproduced from the book itself.
export const AUSLAN_REFERENCE_NOTES = [
  "Auslan is Australian Sign Language — it is not a universal sign language.",
  "It has its own grammar, rather than simply being English expressed with signs.",
  "Facial expression, body language and lip patterns are meaningful parts of communication.",
  "Regional variation exists; the Student Book distinguishes broad Southern and Northern varieties. Neither is universally \"correct\" — Southern/Victorian is set as the default here only because AndrewOS is configured for Melbourne, and that's editable.",
];

export const AUSLAN_AREAS = [
  "Introduction / Auslan & Deaf Culture",
  "Fingerspelling",
  "Numbers",
  "Vocabulary",
  "Conversation",
  "Grammar",
  "Receptive Skills",
  "Expressive Skills",
  "Visual / Manual Skills",
  "Culture Notes",
  "Activities",
  "Revision",
  "Resources",
];

export const AUSLAN_PRACTICE_CATEGORIES = [
  "Fingerspelling production",
  "Fingerspelling recognition",
  "Numbers",
  "Vocabulary",
  "Receptive practice",
  "Expressive practice",
  "Conversation",
  "Grammar",
  "Culture / revision",
];

export interface AuslanResourceSeed {
  title: string;
  resourceType: "PDF" | "IMAGE";
  category: string;
}

// Only the two specifically named reference resources from the spec are
// seeded — everything else in the Drive folder gets added by hand via the
// resource library below, since the folder's full contents aren't known here.
export const AUSLAN_RESOURCE_SEED: AuslanResourceSeed[] = [
  { title: "Auslan Alphabet PDF", resourceType: "PDF", category: "Fingerspelling" },
  {
    title: "DCA_PPH_Fingerspelling_A3poster_2023_PRINT-1-pdf.jpg",
    resourceType: "IMAGE",
    category: "Fingerspelling",
  },
];
