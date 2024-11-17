describe("Futuboard Home Page Test", () => {
  it("should have the correct title", () => {
    // Visit the Futuboard URL
    cy.visit("https://futuboard.live")

    // Assert that the page title is "FutuBoard"
    cy.get(".MuiTypography-root").should("contain", "FutuBoard")
  })
})

describe("Board Creation and Task Management Test", () => {
  beforeEach(() => {
    // Visit the Futuboard URL before each test
    cy.visit("https://futuboard.live")
  })

  it("should create a board, add columns, tasks, and manage users", () => {
    // Click the "Create board" button to start a new project board
    cy.get("button").contains("Create board").click()

    // Assert that the board creation dialog is visible
    cy.get(".MuiDialog-root").should("be.visible")

    // Enter the board name and password
    cy.get(".MuiDialog-root").find("label").contains("Name").parent().find("input").type("Project Alpha")
    cy.get(".MuiDialog-root").find("label").contains("Password").parent().find("input").type("alpha123")

    // Submit the board creation form
    cy.get(".MuiDialog-root").contains("button", "Submit").click()

    // Log in to the newly created board
    cy.get(".MuiTypography-root", { timeout: 10000 }).should("contain", "Enter Board Password")
    cy.get('input[name="password"]').type("alpha123")
    cy.get("form").submit()

    // Add a new column for "To Do" tasks
    cy.get('button[aria-label="add column"]').click()
    cy.get(".MuiDialog-root").find("label").contains("Name").parent().type("To Do")
    cy.get(".MuiDialog-root").contains("button", "Submit").click()

    // Edit the "To Do" column to set work-in-progress limits
    cy.get('[data-testid="EditIcon"]').click()
    cy.get('[name="columnTitle"]').clear().type("To Do")
    cy.get('[name="columnWipLimit"]').type("5")
    cy.get('[name="columnWipLimitStory"]').type("8")
    cy.contains("Submit").click()

    // Add a task to the "To Do" column
    cy.get('button[aria-label="add task"]').click()
    cy.get('textarea[name="taskTitle"]').type("Design Homepage")
    cy.get('input[placeholder="Size"]').type("3")
    cy.get('textarea[name="description"]').type("Create a mockup for the homepage")
    cy.get('input[name="cornerNote"]').type("Urgent")
    cy.contains("button", "Submit").click()

    // Edit the task to update details
    cy.get('[data-testid="EditNoteIcon"]').click()
    cy.get('textarea[name="taskTitle"]').clear().type("Design Homepage - Revised")
    cy.get('input[placeholder="Size"]').clear().type("4")
    cy.get('textarea[name="description"]').clear().type("Update the homepage mockup with new requirements")
    cy.get('input[name="cornerNote"]').clear().type("High Priority")
    cy.contains("button", "Save Changes").click()

    // Add another task to the "To Do" column
    cy.get('button[aria-label="add task"]').click()
    cy.get('textarea[name="taskTitle"]').clear().type("Research Competitors")
    cy.get('input[placeholder="Size"]').clear().type("2")
    cy.get('textarea[name="description"]').clear().type("Analyze competitor websites for features and design")
    cy.get('input[name="cornerNote"]').clear().type("Normal")
    cy.contains("button", "Submit").click()

    // Add users to the board
    cy.get('button[aria-label="Add User"]').click()
    cy.get('input[name="name"]').clear().type("Antonio")
    cy.get("button").contains("Submit").click()
    cy.get('button[aria-label="Add User"]').click()
    cy.get('input[name="name"]').clear().type("Samuli")
    cy.get("button").contains("Submit").click()
    cy.get('button[aria-label="Add User"]').click()
    cy.get('input[name="name"]').clear().type("Alex")
    // Add the third user
    cy.get("button").contains("Submit").click()

    // Add a new column for "In Progress" tasks
    cy.get('button[aria-label="add column"]').click()
    cy.get(".MuiDialog-root").find("label").contains("Name").parent().type("In Progress")
    cy.get(".MuiCheckbox-root").click() // Optionally check a checkbox if needed
    cy.get(".MuiDialog-root").contains("button", "Submit").click()

    // Add a task to the "In Progress" column
    cy.get('button[aria-label="add task"]').eq(1).click() // Use eq(1) to click the second "Add task" button
    cy.get('textarea[name="taskTitle"]').type("Develop Homepage")
    cy.get('input[placeholder="Size"]').type("5")
    cy.get('textarea[name="description"]').type("Implement the homepage based on the design mockup")
    cy.get('input[name="cornerNote"]').type("Critical")
    cy.contains("button", "Submit").click()

    cy.get('[data-testid="ArrowForwardIosIcon"]').click()
    // First, locate the column with the "To Do" text, then find the "Add" button within it.
    cy.get('[data-testid="AddIcon"]').eq(2).click()
    cy.get("label").contains("Name").type("Syödä")
    cy.get("button").contains("Submit").click()
    cy.get("button").contains("Cancel").click()

    //Downloading the CSV
    cy.get('[data-testid="MoreVertIcon"]').click()
    cy.get('[data-testid="DownloadIcon"]').click()

    //Deleting the board
    cy.get('[data-testid="MoreVertIcon"]').click()
    cy.get('[data-testid="DeleteIcon"]').click()
    cy.get(".MuiDialog-root").find("label").contains("Password").parent().find("input").type("alpha123")
    cy.get(".MuiDialog-root").contains("button", "Submit").click()
    cy.get(".MuiDialog-root").contains("button", "Confirm Deletion").click()
  })
})
