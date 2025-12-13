// Mock Data simulant la structure Airtable
export const mockLeads = [
  {
    id: "lead-001",
    nom: "Sophie Dubois",
    email: "sophie.dubois@email.com",
    score: "CHAUD",
    statut: "QUALIFIE",
    summary: "Investissement locatif, budget validé 200k€, recherche T3 secteur Nord. Prête à visiter cette semaine.",
    stop_ai: false,
    phone: "+33 6 12 34 56 78",
    contacted: false,
    budget: "200 000€",
    typeProjet: "Investissement locatif",
    secteur: "Nord",
    delai: "Cette semaine",
    conversation: [
      { sender: "bot", message: "Bonjour Sophie ! Je suis l'assistant EMKAI. Vous recherchez un bien immobilier ?" },
      { sender: "lead", message: "Oui, je cherche un T3 pour de l'investissement locatif" },
      { sender: "bot", message: "Excellent ! Quel est votre budget ?" },
      { sender: "lead", message: "J'ai validé 200k€ avec ma banque" },
      { sender: "bot", message: "Parfait. Dans quel secteur ?" },
      { sender: "lead", message: "Secteur Nord de préférence" },
      { sender: "bot", message: "Vous êtes disponible pour visiter quand ?" },
      { sender: "lead", message: "Cette semaine si possible, je suis très motivée" }
    ]
  },
  {
    id: "lead-002",
    nom: "Marc Lefebvre",
    email: "marc.lefebvre@email.com",
    score: "CHAUD",
    statut: "QUALIFIE",
    summary: "Résidence principale, apport 80k€, financement pré-approuvé. Cherche maison 4 chambres rapidement.",
    stop_ai: false,
    phone: "+33 6 23 45 67 89",
    contacted: false,
    budget: "350 000€",
    typeProjet: "Résidence principale",
    secteur: "Centre-ville",
    delai: "Urgent",
    conversation: [
      { sender: "bot", message: "Bonjour Marc, comment puis-je vous aider ?" },
      { sender: "lead", message: "Je cherche une maison pour ma famille" },
      { sender: "bot", message: "Combien de chambres souhaitez-vous ?" },
      { sender: "lead", message: "4 chambres minimum" },
      { sender: "bot", message: "Avez-vous un financement ?" },
      { sender: "lead", message: "Oui, pré-approuvé avec 80k d'apport" }
    ]
  },
  {
    id: "lead-003",
    nom: "Julie Martin",
    email: "julie.martin@email.com",
    score: "TIEDE",
    statut: "NOUVEAU",
    summary: "Primo-accédant, budget à définir, projet dans 6 mois. Demande plus d'informations sur les quartiers.",
    stop_ai: true,
    phone: "+33 6 34 56 78 90",
    contacted: false,
    budget: "À définir",
    typeProjet: "Primo-accédant",
    secteur: "À définir",
    delai: "6 mois",
    conversation: [
      { sender: "bot", message: "Bonjour Julie, vous souhaitez acheter ?" },
      { sender: "lead", message: "Oui mais je me renseigne juste pour l'instant" },
      { sender: "bot", message: "Pas de problème ! Quel type de bien ?" },
      { sender: "lead", message: "Un appartement, mais j'ai besoin d'infos sur les quartiers" }
    ]
  },
  {
    id: "lead-004",
    nom: "Thomas Bernard",
    email: "thomas.bernard@email.com",
    score: "CHAUD",
    statut: "QUALIFIE",
    summary: "Investissement LMNP, budget 150k€, recherche studio bien placé. Disponible pour RDV demain.",
    stop_ai: false,
    phone: "+33 6 45 67 89 01",
    contacted: false,
    budget: "150 000€",
    typeProjet: "Investissement LMNP",
    secteur: "Centre-ville",
    delai: "Immédiat",
    conversation: [
      { sender: "bot", message: "Bonjour Thomas !" },
      { sender: "lead", message: "Salut, je veux investir en LMNP" },
      { sender: "bot", message: "Super ! Quel budget ?" },
      { sender: "lead", message: "150k max" },
      { sender: "bot", message: "Type de bien ?" },
      { sender: "lead", message: "Studio bien placé pour de la location courte durée" },
      { sender: "bot", message: "Quand êtes-vous dispo pour un RDV ?" },
      { sender: "lead", message: "Demain si vous voulez" }
    ]
  },
  {
    id: "lead-005",
    nom: "Isabelle Petit",
    email: "isabelle.petit@email.com",
    score: "FROID",
    statut: "NOUVEAU",
    summary: "Simple demande d'info, pas de budget défini, projet vague. À recontacter dans 3 mois.",
    stop_ai: false,
    phone: "+33 6 56 78 90 12",
    contacted: false,
    budget: "Non défini",
    typeProjet: "Non défini",
    secteur: "Non défini",
    delai: "3 mois+",
    conversation: [
      { sender: "bot", message: "Bonjour Isabelle !" },
      { sender: "lead", message: "Bonjour, je regarde juste" },
      { sender: "bot", message: "Vous avez un projet immobilier ?" },
      { sender: "lead", message: "Pas vraiment, je me renseigne" }
    ]
  },
  {
    id: "lead-006",
    nom: "Laurent Moreau",
    email: "laurent.moreau@email.com",
    score: "TIEDE",
    statut: "QUALIFIE",
    summary: "Revente + achat, maison familiale recherchée. Dossier en cours de montage bancaire.",
    stop_ai: true,
    phone: "+33 6 67 89 01 23",
    contacted: false,
    budget: "400 000€",
    typeProjet: "Revente + Achat",
    secteur: "Banlieue",
    delai: "2-3 mois",
    conversation: [
      { sender: "bot", message: "Bonjour Laurent !" },
      { sender: "lead", message: "Bonjour, je veux vendre pour acheter plus grand" },
      { sender: "bot", message: "Votre maison actuelle est en vente ?" },
      { sender: "lead", message: "Je suis en train de monter le dossier banque" }
    ]
  },
  {
    id: "lead-007",
    nom: "Céline Roux",
    email: "celine.roux@email.com",
    score: "CHAUD",
    statut: "QUALIFIE",
    summary: "Investisseur confirmé, cash buyer 300k€. Recherche duplex centre-ville, décision rapide.",
    stop_ai: false,
    phone: "+33 6 78 90 12 34",
    contacted: false,
    budget: "300 000€ cash",
    typeProjet: "Investissement",
    secteur: "Centre-ville",
    delai: "Immédiat",
    conversation: [
      { sender: "bot", message: "Bonjour Céline !" },
      { sender: "lead", message: "Bonjour, je cherche un duplex en centre-ville" },
      { sender: "bot", message: "Investissement ou résidence principale ?" },
      { sender: "lead", message: "Investissement, j'ai déjà 3 biens. Je paie cash 300k" },
      { sender: "bot", message: "Excellent ! Quand pouvez-vous visiter ?" },
      { sender: "lead", message: "Quand vous voulez, je décide vite" }
    ]
  },
  {
    id: "lead-008",
    nom: "Antoine Girard",
    email: "antoine.girard@email.com",
    score: "TIEDE",
    statut: "NOUVEAU",
    summary: "Projet investissement, budget incertain. Demande simulation et conseils fiscaux.",
    stop_ai: true,
    phone: "+33 6 89 01 23 45",
    contacted: false,
    budget: "Incertain",
    typeProjet: "Investissement",
    secteur: "À définir",
    delai: "À définir",
    conversation: [
      { sender: "bot", message: "Bonjour Antoine !" },
      { sender: "lead", message: "Salut, je veux investir mais j'ai besoin de conseils" },
      { sender: "bot", message: "Quel budget envisagez-vous ?" },
      { sender: "lead", message: "Je ne sais pas encore, je veux une simulation fiscale d'abord" }
    ]
  }
];

// Calcul automatique des KPIs
export const getKPIs = () => {
  const totalQualifies = mockLeads.filter(lead => lead.statut === "QUALIFIE").length;
  const leadsChauds = mockLeads.filter(lead => lead.score === "CHAUD").length;
  const leadsTiedes = mockLeads.filter(lead => lead.score === "TIEDE").length;
  const leadsFroids = mockLeads.filter(lead => lead.score === "FROID").length;

  return {
    totalQualifies,
    leadsChauds,
    leadsTiedes,
    leadsFroids
  };
};
