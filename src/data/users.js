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

// Fonction pour mettre à jour l'email d'un utilisateur
export const updateUserEmail = (userId, newEmail) => {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  // Vérifier si l'email est déjà utilisé
  const emailExists = mockUsers.some(u => u.email === newEmail && u.id !== userId);
  if (emailExists) {
    return { success: false, error: "Cet email est déjà utilisé" };
  }

  // Mettre à jour l'email
  mockUsers[userIndex].email = newEmail;
  const { password: _, ...userWithoutPassword } = mockUsers[userIndex];
  return { success: true, user: userWithoutPassword };
};

// Fonction pour mettre à jour le mot de passe d'un utilisateur
export const updateUserPassword = (userId, currentPassword, newPassword) => {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  // Vérifier le mot de passe actuel
  if (mockUsers[userIndex].password !== currentPassword) {
    return { success: false, error: "Mot de passe actuel incorrect" };
  }

  // Mettre à jour le mot de passe
  mockUsers[userIndex].password = newPassword;
  return { success: true };
};
