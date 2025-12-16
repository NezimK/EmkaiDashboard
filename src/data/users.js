// Profils utilisateurs (Mock Data) - Multi-Agency Support
// Chaque utilisateur est rattaché à une agence spécifique
export const mockUsers = [
  // IMMOCOPE - Users
  {
    id: "user-001",
    email: "demo@immocope.com",
    password: "demo123",
    name: "Agent Immocope",
    role: "agent",
    agency: "AGENCY_A",
    agencyName: "Immocope"
  },
  {
    id: "user-002",
    email: "agent@immocope.com",
    password: "agent123",
    name: "Sophie Martin",
    role: "agent",
    agency: "AGENCY_A",
    agencyName: "Immocope"
  },
  {
    id: "user-003",
    email: "manager@immocope.com",
    password: "manager123",
    name: "Manager Immocope",
    role: "manager",
    agency: "AGENCY_A",
    agencyName: "Immocope"
  },

  // REALAGENCY - Users
  {
    id: "user-004",
    email: "demo@realagency.com",
    password: "demo123",
    name: "Agent RealAgency",
    role: "agent",
    agency: "AGENCY_B",
    agencyName: "RealAgency"
  },
  {
    id: "user-005",
    email: "agent@realagency.com",
    password: "agent123",
    name: "Pierre Rousseau",
    role: "agent",
    agency: "AGENCY_B",
    agencyName: "RealAgency"
  },
  {
    id: "user-006",
    email: "manager@realagency.com",
    password: "manager123",
    name: "Manager RealAgency",
    role: "manager",
    agency: "AGENCY_B",
    agencyName: "RealAgency"
  }
];

// Fonction de validation de login
export const validateLogin = (email, password) => {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (user) {
    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  }
  return { success: false, error: "Email ou mot de passe incorrect" };
};
