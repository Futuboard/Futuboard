/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Create board
     * @example
     * cy.createBoard()
     */
    createBoard(board: { title: string; password?: string }): Chainable<any>
    /**
     * Logins to board
     * @example
     * cy.createTodo('password')
     */
    loginToBoard(password: string): Chainable<any>
    /**
     * Creates a column
     * @example
     * cy.createColumn({ title: 'Test Column' })
     */
    createColumn(column: { title: string; swimlane: boolean }): Chainable<any>
    /**
     * Creates a task
     * @example
     * cy.createTask({ title: 'Test Task', size: 5, description: 'Test Description', cornerNote: 'Normal' })
     */
    createTask(
      task: { title: string; size?: string; description?: string; cornerNote?: string },
      columnIndex?: number
    ): Chainable<any>
    /**
     * Edits a task
     * @example
     * cy.editTask({ title: 'Test Task', size: 5, description: 'Test Description', cornerNote: 'Normal' })
     */
    editTask(task: { title?: string; size?: string; description?: string; cornerNote?: string }): Chainable<any>
    /**
     * Create a user, and use one of the two buttons (either in the corner, or middle of page, if board is empty)
     * @example
     * cy.createUser({ name: 'Test User', buttonIndex: 0 })
     */
    createUser(user: { name: string; buttonIndex: 0 | 1 }): Chainable<any>
    /**
     * Create an action
     * @example
     * cy.createAction({ title: 'Test Action' })
     */
    createAction(action: { title: string }, columnIndex: number): Chainable<any>
    /**
     * Drag a draggable from dragSelector to dropSelector
     * @example
     * cy.drag()
     */
    drag(dragSelector: string, dropSelector: string): Chainable<any>
  }
}
