Cypress.Commands.add("createBoard", ({ title, password }) => {
  cy.get("button").contains("Create board").click()
  cy.get(".MuiDialog-root").should("be.visible")
  cy.get(".MuiDialog-root").find("label").contains("Board Name").parent().find("input").type(title)
  password && cy.get(".MuiDialog-root").find("label").contains("Board Password").parent().find("input").type(password)
  cy.get("button[type='submit']").contains("Create").click()
})

Cypress.Commands.add("loginToBoard", (password) => {
  cy.get(".MuiTypography-root", { timeout: 10000 }).should("contain", "Enter password to edit")
  cy.get('input[name="password"]').type(password)
  cy.get("button").contains("Edit board").click()
})

Cypress.Commands.add("createColumn", ({ title, swimlane = false }) => {
  cy.get('button[aria-label="add column"]').first().click()
  cy.get(".MuiDialog-root").find('input[name="columnTitle"]').type(title)
  swimlane && cy.get(".MuiDialog-root").find('input[type="checkbox"]').click()
  cy.get(".MuiDialog-root").contains("button", "Submit").click()
})

Cypress.Commands.add("createTask", ({ title, size, description, cornerNote }, columnIndex = 0) => {
  cy.get('button[aria-label="add task"]').eq(columnIndex).click()
  cy.get('textarea[name="taskTitle"]').type(title)
  size && cy.get('input[name="size"]').type(size)
  description && cy.get(".description").type(description)
  cornerNote && cy.get('input[name="cornerNote"]').type(cornerNote)
  cy.get("button").contains("Submit").click()
})

Cypress.Commands.add("editTask", ({ title, size, description, cornerNote }) => {
  cy.get(".task").click()
  title && cy.get('textarea[name="taskTitle"]').clear().type(title)
  size && cy.get('input[name="size"]').clear().type(size)
  description && cy.get(".description").type("{ctrl+a}+{del}").type(description)
  cornerNote && cy.get('input[name="cornerNote"]').clear().type(cornerNote)
  cy.get("button").contains("Save Changes").click()
})

Cypress.Commands.add("createUser", ({ name, buttonIndex }) => {
  cy.get('button[aria-label="add user"]').eq(buttonIndex).click()
  cy.get('input[name="name"]').clear().type(name)
  cy.get("button").contains("Submit").click()
})

Cypress.Commands.add("createAction", ({ title }, columnIndex) => {
  cy.get('button[aria-label="expand swimlane"]').eq(columnIndex).click()
  cy.get('button[aria-label="add action"]').eq(columnIndex).click()
  cy.get('input[name="actionTitle"]').type(title)
  cy.get('button[aria-label="submit action"]').click()
  cy.get('button[aria-label="cancel action"]').click()
})

Cypress.Commands.add("editTaskTemplate", ({ title, size, description, cornerNote, color }) => {
  cy.get('[data-testid="MoreVertIcon"]').click()
  cy.get("li").contains("Edit Card Template").click()
  cy.get('textarea[name="taskTitle"]').type(title)
  cy.get('input[name="size"]').type(size)
  cy.get(".description").type(description)
  cy.get('input[name="cornerNote"]').type(cornerNote)
  cy.get(`input[type="radio"][value="${color}"]`).check()
  cy.get("button").contains("Save Changes").click()
  cy.get(".MuiBackdrop-root").last().click()
})
