describe('Whisp Application', () => {
  // eslint-disable-next-line no-undef
  it('should load the application', () => {
    cy.visit('/');
    cy.contains('Login to Whisp');
  });
});