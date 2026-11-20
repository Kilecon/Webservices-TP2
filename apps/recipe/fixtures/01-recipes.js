/* global db, ObjectId */
// Demo recipes, inserted by the MongoDB image on the first start of recipe-db.

const alice = '665f00000000000000000001';
const bob = '665f00000000000000000002';
const chloe = '665f00000000000000000003';
const recipes = db.getSiblingDB('recipes').recipes;

recipes.insertMany([
  {
    _id: ObjectId(),
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    ingredients: ['200 g de pâtes', '2 oeufs', '100 g de pecorino'],
    ownerId: alice,
    steps: [
      'Cuire les pâtes.',
      'Mélanger les oeufs et le fromage.',
      'Assembler.',
    ],
    title: 'Pâtes carbonara',
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  },
  {
    _id: ObjectId(),
    createdAt: new Date('2026-01-02T10:00:00.000Z'),
    ingredients: ['2 tomates', '1 concombre', '100 g de feta'],
    ownerId: bob,
    steps: ['Couper les légumes.', 'Ajouter la feta.', 'Assaisonner.'],
    title: 'Salade grecque',
    updatedAt: new Date('2026-01-02T10:00:00.000Z'),
  },
  {
    _id: ObjectId(),
    createdAt: new Date('2026-01-03T10:00:00.000Z'),
    ingredients: ['1 pâte brisée', '3 pommes', '20 g de sucre'],
    ownerId: chloe,
    steps: ['Étaler la pâte.', 'Disposer les pommes.', 'Cuire 30 minutes.'],
    title: 'Tarte aux pommes',
    updatedAt: new Date('2026-01-03T10:00:00.000Z'),
  },
  {
    _id: ObjectId(),
    createdAt: new Date('2026-01-04T10:00:00.000Z'),
    ingredients: ['200 g de riz', '1 poivron', '1 carotte'],
    ownerId: alice,
    steps: ['Cuire le riz.', 'Saisir les légumes.', 'Mélanger.'],
    title: 'Riz aux légumes',
    updatedAt: new Date('2026-01-04T10:00:00.000Z'),
  },
  {
    _id: ObjectId(),
    createdAt: new Date('2026-01-05T10:00:00.000Z'),
    ingredients: ['3 oeufs', '120 g de farine', '50 cl de lait'],
    ownerId: bob,
    steps: ['Préparer la pâte.', 'La laisser reposer.', 'Cuire les crêpes.'],
    title: 'Crêpes',
    updatedAt: new Date('2026-01-05T10:00:00.000Z'),
  },
]);
