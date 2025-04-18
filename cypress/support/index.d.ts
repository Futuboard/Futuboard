/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Create board
     * @example
     * cy.createBoard({ title: 'Project Alpha', password: 'alpha123' })
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
     * cy.createColumn({ title: 'Test Column', swimlane: false })
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
     * Create an action to column with ordernum == columnIndex
     * @example
     * cy.createAction({ title: 'Test Action' }, 0)
     */
    createAction(action: { title: string }, columnIndex: number): Chainable<any>
    /**
     * Edits a task template
     * @example
     * cy.editTaskTemplate({ title: 'Example', size: 5, description: "Test description", cornerNote: "Normal", color: "#ffffff" })
     */
    editTaskTemplate(taskTemplate: {
      title: string
      size: string
      description: string
      cornerNote: string
      color: string
    }): Chainable<any>
  }
}
