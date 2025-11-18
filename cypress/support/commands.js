// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
// ***********************************************

/**
 * Custom command for login
 * Usage: cy.login('email@example.com', 'password')
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

/**
 * Custom command for logout
 * Usage: cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.contains('Logout').click();
  cy.url().should('include', '/');
});

/**
 * Custom command to check for security headers
 * Usage: cy.checkSecurityHeaders()
 */
Cypress.Commands.add('checkSecurityHeaders', () => {
  cy.request('/').then((response) => {
    expect(response.headers).to.have.property('x-content-type-options');
    expect(response.headers).to.have.property('x-frame-options');
    expect(response.headers).not.to.have.property('x-powered-by');
  });
});

/**
 * Custom command to wait for API response
 * Usage: cy.waitForAPI('users')
 */
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(`@${alias}`);
});

/**
 * Custom command to take accessibility snapshot
 * Usage: cy.checkA11y()
 * Requires: cypress-axe plugin
 */
// Cypress.Commands.add('checkA11y', () => {
//   cy.injectAxe();
//   cy.checkA11y(null, null, (violations) => {
//     console.log('Accessibility violations:', violations);
//   });
// });

/**
 * Custom command to set localStorage
 * Usage: cy.setLocalStorage('key', 'value')
 */
Cypress.Commands.add('setLocalStorage', (key, value) => {
  cy.window().then((window) => {
    window.localStorage.setItem(key, value);
  });
});

/**
 * Custom command to get localStorage
 * Usage: cy.getLocalStorage('key')
 */
Cypress.Commands.add('getLocalStorage', (key) => {
  cy.window().then((window) => {
    return window.localStorage.getItem(key);
  });
});

/**
 * Custom command to clear all localStorage
 * Usage: cy.clearLocalStorage()
 */
Cypress.Commands.add('clearLocalStorageAll', () => {
  cy.window().then((window) => {
    window.localStorage.clear();
  });
});

