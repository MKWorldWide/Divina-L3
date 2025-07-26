/// <reference types="cypress" />

describe('Dashboard Page', () => {
  beforeEach(() => {
    // Mock API responses before each test
    cy.intercept('GET', '/api/games', { fixture: 'games.json' }).as('getGames');
    cy.intercept('GET', '/api/ai-insights', { fixture: 'ai-insights.json' }).as('getAIInsights');
    
    // Visit the dashboard page
    cy.visit('/dashboard');
    
    // Wait for API calls to complete
    cy.wait(['@getGames', '@getAIInsights']);
  });

  it('should display the dashboard title', () => {
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should display the game cards', () => {
    cy.get('[data-testid="game-card"]').should('have.length.at.least', 1);
  });

  it('should display AI insights', () => {
    cy.get('[data-testid="ai-insight-card"]').should('have.length.at.least', 1);
  });

  it('should navigate to game details when a game card is clicked', () => {
    cy.get('[data-testid="game-card"]').first().click();
    cy.url().should('include', '/game/');
  });
});
