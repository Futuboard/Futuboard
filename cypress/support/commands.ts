Cypress.Commands.add("createBoard", () => {
  cy.get("button").contains("Create board").click()
  cy.get(".MuiDialog-root").should("be.visible")
  cy.get(".MuiDialog-root").find("label").contains("Name").parent().find("input").type("Project Alpha")
  cy.get(".MuiDialog-root").find("label").contains("Password").parent().find("input").type("alpha123")
  cy.get(".MuiDialog-root").contains("button", "Submit").click()
})

Cypress.Commands.add("loginToBoard", (password) => {
  cy.get(".MuiTypography-root", { timeout: 10000 }).should("contain", "Enter Board Password")
  cy.get('input[name="password"]').type(password)
  cy.get("form").submit()
})

Cypress.Commands.add("createColumn", ({ title }) => {
  cy.get('button[aria-label="add column"]').click()
  // FInd input with name columnTitle
  cy.get(".MuiDialog-root").find('input[name="columnTitle"]').type(title)
  cy.get(".MuiDialog-root").contains("button", "Submit").click()
})

Cypress.Commands.add("createTask", ({ title, size, description, cornerNote }) => {
  cy.get('button[aria-label="add task"]').first().click()
  cy.get('textarea[name="taskTitle"]').type(title)
  cy.get('input[name="size"]').type(size)
  cy.get(".description").type(description)
  cy.get('input[name="cornerNote"]').type(cornerNote)
  cy.get("button").contains("Submit").click()
})

Cypress.Commands.add("editTask", ({ title, size, description, cornerNote }) => {
  cy.get('[data-testid="EditNoteIcon"]').click()
  cy.get('textarea[name="taskTitle"]').clear().type(title)
  cy.get('input[name="size"]').clear().type(size)
  cy.get(".description").type("{ctrl+a}+{del}").type(description)
  cy.get('input[name="cornerNote"]').clear().type(cornerNote)
  cy.get("button").contains("Save Changes").click()
})

Cypress.Commands.add("createUser", ({ name, buttonIndex }) => {
  cy.get('button[aria-label="Add User"]').eq(buttonIndex).click()
  cy.get('input[name="name"]').clear().type(name)
  cy.get("button").contains("Submit").click()
})
