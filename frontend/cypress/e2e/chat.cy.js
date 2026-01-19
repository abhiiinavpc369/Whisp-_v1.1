/* global cy */

describe('Chat Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[placeholder="Username"]').type('abhinavji');
    cy.get('input[placeholder="Password"]').type('1234');
    cy.get('button[type="submit"]').click();
    cy.contains('Chats').should('be.visible');
  });

  it('should display conversations', () => {
    cy.get('.flex-1.overflow-y-auto').should('be.visible');
  });

  it('should open profile settings', () => {
    cy.get('button i.fas.fa-cog').parent().click();
    cy.contains('Profile Settings').should('be.visible');
  });

  it('should search for users', () => {
    cy.get('input[placeholder="Search users..."]').type('shuklaji');
    cy.contains('AbhinavJi').should('not.exist'); // Since search results
    // Assuming search shows results
  });

  it('should select a conversation and send message', () => {
    // Assuming there is at least one conversation
    cy.get('.flex.items-center.p-3.hover\\:bg-gray-700').first().click();
    cy.get('input[placeholder="Type a message..."]').type('Test message from Cypress');
    cy.get('button i.fas.fa-paper-plane').parent().click();
    cy.contains('Test message from Cypress').should('be.visible');
  });

  it('should open file upload options', () => {
    cy.get('.flex.items-center.p-3.hover\\:bg-gray-700').first().click();
    cy.get('button i.fas.fa-plus').parent().click();
    cy.get('button i.fas.fa-file').parent().should('be.visible');
  });
});