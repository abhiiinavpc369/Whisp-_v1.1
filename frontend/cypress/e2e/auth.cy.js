/* global cy */

describe('Authentication', () => {
  // eslint-disable-next-line no-undef
  it('should login with valid credentials', () => {
    cy.visit('/');
    cy.get('input[placeholder="Username"]').type('abhinavji');
    cy.get('input[placeholder="Password"]').type('1234');
    cy.get('button[type="submit"]').click();
    cy.contains('Chats').should('be.visible');
  });
});