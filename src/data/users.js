// Profils utilisateurs (Mock Data)
export const mockUsers = [
  {
    id: "user-001",
    email: "thomas.durand@emkai.com",
    password: "agent123",
    name: "Thomas Durand",
    role: "agent"
  },
  {
    id: "user-002",
    email: "sophie.martin@emkai.com",
    password: "agent123",
    name: "Sophie Martin",
    role: "agent"
  },
  {
    id: "user-003",
    email: "julien.bernard@emkai.com",
    password: "manager123",
    name: "Julien Bernard",
    role: "manager"
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
