/**
 * Cuentas de prueba sembradas por la edge function `seed-data`.
 * Úsalas únicamente en entornos de test / desarrollo.
 */

export interface TestUser {
  email: string;
  password: string;
  role: "organizer" | "sponsor";
  name: string;
}

export const TEST_ORGANIZER: TestUser = {
  email: "pruebaorganizador@gmail.com",
  password: "123123",
  role: "organizer",
  name: "Prueba Organizador",
};

export const TEST_SPONSOR: TestUser = {
  email: "pruebasponsor@gmail.com",
  password: "123123",
  role: "sponsor",
  name: "Prueba Sponsor",
};

export const TEST_USERS = {
  organizer: TEST_ORGANIZER,
  sponsor: TEST_SPONSOR,
} as const;
