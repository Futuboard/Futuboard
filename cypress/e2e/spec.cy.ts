beforeEach(() => {
  cy.visit("http://localhost:5173")
})

const defaultBoard = {
  title: "Project Alpha",
  password: "alpha123"
}

const defaultColumn = {
  title: "To Do",
  swimlane: false
}

const otherColumn = {
  title: "Something else",
  swimlane: false
}

const defaultTask = {
  title: "Design Homepage",
  size: "3",
  description: "Create a mockup for the homepage",
  cornerNote: "Urgent"
}

const otherTask = {
  title: "Research Competitors",
  size: "2",
  description: "Analyze competitor websites for features and design",
  cornerNote: "Normal"
}

const taskTemplate = {
  title: "New task",
  size: "4",
  description: "Completing this task requires...",
  cornerNote: "Low priority",
  color: "#8bc34a"
}

describe("At the Futuboard home page", () => {
  it("has the correct title", () => {
    cy.get(".MuiTypography-root").should("contain", "Futuboard")
  })

  it("can create board and log in ", () => {
    cy.createBoard(defaultBoard)
    cy.loginToBoard("alpha123")
    cy.contains("Add a column")
  })
})

describe("In a board", () => {
  beforeEach(() => {
    cy.createBoard(defaultBoard)
    cy.loginToBoard("alpha123")
  })

  it("can create a column", () => {
    cy.createColumn(defaultColumn)

    cy.contains("To Do")
    cy.contains("No cards yet")
    cy.get("p[title='Number of tasks']").contains("0")
    cy.get("p[title='Total size of tasks']").contains("0")
  })

  it("can edit a column", () => {
    cy.createColumn(defaultColumn)

    cy.get('[data-testid="EditIcon"]').click()
    cy.get('[name="columnTitle"]').clear().type("Some other title")
    cy.get('[name="columnWipLimit"]').type("5")
    cy.get('[name="columnWipLimitStory"]').type("8")
    cy.contains("Submit").click()

    cy.contains("Some other title")
    cy.contains("To Do").should("not.exist")
    cy.get("p[title='Number of tasks']").contains("0 / 5")
    cy.get("p[title='Total size of tasks']").contains("0 / 8")
  })

  it("can add tasks", () => {
    cy.createColumn(defaultColumn)
    cy.createTask(defaultTask)
    cy.wait(100)
    cy.createTask(otherTask)

    cy.get("strong").contains(defaultTask.title)
    cy.get("strong").contains(otherTask.title)
  })

  it("can edit a task", () => {
    cy.createColumn(defaultColumn)
    cy.createTask(defaultTask)
    cy.editTask(otherTask)

    cy.get("strong").contains(otherTask.title)
    cy.get("strong").contains(defaultTask.title).should("not.exist")
  })

  it("can add users", () => {
    cy.createUser({ name: "Antonio", buttonIndex: 0 })
    cy.createUser({ name: "Samuli", buttonIndex: 0 })
    cy.createUser({ name: "Alex", buttonIndex: 1 })

    cy.contains("Antonio")
    cy.contains("Samuli")
    cy.contains("Alex")
  })

  it("can delete a board", () => {
    cy.createColumn(defaultColumn)
    cy.createUser({ name: "Antonio", buttonIndex: 0 })
    cy.createTask(defaultTask)

    cy.get('[data-testid="MoreVertIcon"]').click()
    cy.get('[data-testid="DeleteIcon"]').click()
    cy.get(".MuiDialog-root").find("label").contains("Password").parent().find("input").type("alpha123")
    cy.get(".MuiDialog-root").contains("button", "Submit").click()
    cy.get("button").contains("Confirm Deletion").click()

    cy.contains("Futuboard")
    cy.contains("Antonio").should("not.exist")
    cy.contains("Create board")
  })

  it("can change board background color", () => {
    cy.get('[data-testid="MoreVertIcon"]').click()
    cy.get("li").contains("Board Background Color").click()

    cy.get("input[name='hexColorInput']").clear().type("7dd354")
    cy.get("button").contains("Submit").click()

    cy.get("html").should("have.css", "background-color", "rgb(125, 211, 84)")
  })

  it("can edit task template", () => {
    cy.createColumn(defaultColumn)

    cy.get('button[aria-label="add task"]').first().click()
    cy.get('textarea[name="taskTitle"]').should("be.empty")
    cy.get(".description").should("not.have.text")
    cy.get('input[name="size"').should("be.empty")
    cy.get('input[name="cornerNote"').should("be.empty")
    cy.get('input[type="radio"][value="#ffffff"]').should("be.checked")
    cy.get("button").contains("Cancel").click()

    cy.editTaskTemplate(taskTemplate)

    cy.get('button[aria-label="add task"]').first().click()
    cy.get('textarea[name="taskTitle"]').should("have.value", taskTemplate.title)
    cy.get(".description").should("have.text", taskTemplate.description)
    cy.get('input[name="size"').should("have.value", taskTemplate.size)
    cy.get('input[name="cornerNote"').should("have.value", taskTemplate.cornerNote)
    cy.get(`input[type="radio"][value="${taskTemplate.color}"]`).should("be.checked")
  })

  it("can change board password", () => {
    cy.get('[data-testid="MoreVertIcon"]').click()
    cy.get("li").contains("Change Board Password").click()

    cy.contains("Enter a New Password").should("be.visible")
    cy.get('[name="old_password"]').type("alpha123")
    cy.get('[name="new_password"]').type("newPassword")
    cy.get('[name="confirm_password"]').type("newPassword")
    cy.get("button").contains("Submit").click()
    cy.contains("Enter a New Password").should("not.exist")

    cy.get("li").contains("Change Board Password").click()

    cy.get('[name="old_password"]').clear().type("alpha123")
    cy.get("button").contains("Submit").click()
    cy.contains("The old password is incorrect").should("be.visible")
  })
})

describe("When exporting and/or importing a board", () => {
  it("can export and import a board", () => {
    cy.createBoard(defaultBoard)
    cy.loginToBoard("alpha123")
    cy.createColumn(defaultColumn)
    cy.createTask(defaultTask)
    cy.wait(100)
    cy.createTask(otherTask)
    cy.createColumn(otherColumn)
    cy.createUser({ name: "Antonio", buttonIndex: 0 })
    cy.createUser({ name: "Samuli", buttonIndex: 0 })

    cy.get('[data-testid="MoreVertIcon"]').click()
    cy.get('[data-testid="DownloadIcon"]').click()

    const date = new Date()
    const fileName = `${defaultBoard.title}-${date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/[^a-zA-Z0-9]/g, "_")}.csv`
    const filePath = `downloads/${fileName}`

    cy.readFile(filePath).should("exist")

    cy.get("button[aria-label='Home']").click()

    cy.contains("Create board").click()

    cy.get("input[name='title']").type("Imported Test Board")
    cy.get("input[name='password']").type("password")
    cy.get("input[type='file']").selectFile(filePath, { force: true })
    cy.get("button").contains("Submit").click()

    cy.loginToBoard("password")

    cy.contains("Imported Test Board")
    cy.contains(defaultTask.title)
    cy.contains(otherTask.title)
    cy.contains("Antonio")
    cy.contains("Samuli")
  })

  it("can import a board with correct action placement", () => {
    cy.contains("Create board").click()
    cy.get("input[name='title']").type("Imported Test Board")
    cy.get("input[type='file']").selectFile("fixtures/two_columns_with_actions.csv", { force: true })
    cy.get("button").contains("Submit").click()

    cy.get('button[aria-label="expand swimlane"]').eq(0).click()

    for (let i = 0; i < 4; i++) {
      cy.get(`[data-testid="action-list-${i}"]`)
        .find(`div[title="a${i + 1}"]`)
        .should("exist")
    }

    cy.get('button[aria-label="expand swimlane"]').eq(0).click()

    cy.get('button[aria-label="expand swimlane"]').eq(1).click()

    for (let i = 0; i < 4; i++) {
      cy.get(`[data-testid="action-list-${i}"]`)
        .find(`div[title="b${i + 1}"]`)
        .should("exist")
    }
  })
})

describe('When changing the title of a board', () => {
  // This name should succeed as it is four letters long.
  const validBoardName = "test"

  // This name should fail as it is too short. 
  const invalidBoardName = "e2"
  const nameTooShort = "Board name must be at least 3 characters"

  // An empty name should prompt this error.
  const nameIsEmpty = "Board name is required"

  it('With a valid input, the title of a board changes', () => {
    cy.createBoard()
    cy.loginToBoard('alpha123')
    
    cy.get('button[aria-label=more]').click()
    cy.get('p').contains('Edit Board Name').click()
    cy.get('input[name=title][type=text]').clear().type(validBoardName)
    cy.get('button[type=submit]').click()
    cy.get('h6').contains(validBoardName)
  })

  it('With an invalid input, the title of the board stays the same and there is a warning', () => {
    cy.createBoard()
    cy.loginToBoard('alpha123')
  
    cy.get('button[aria-label=more]').click()
    cy.get('p').contains('Edit Board Name').click()
    cy.get('input[name=title][type=text]').clear().type(invalidBoardName)
    cy.get('button[type=submit]').click()

    // Check that there is both an error message and that the board name has not changed.
    cy.get('p').contains(nameTooShort)
    cy.get('h6').contains("Project Alpha")

    // Attempt to give an empty name.
    cy.get('input[name=title][type=text]').clear()
    cy.get('button[type=submit]').click()
    cy.get('p').contains(nameIsEmpty)
    cy.get('h6').contains("Project Alpha")
  })
})

describe("When using board templates", () => {
  it("can create board template and a new board from a template", () => {
    cy.createBoard(defaultBoard)
    cy.loginToBoard("alpha123")
    cy.createColumn(defaultColumn)
    cy.createTask(defaultTask)

    cy.url().then((boardUrl) => {
      cy.get("button[aria-label='Home']").click()

      cy.get("a[href='/admin']").click()

      cy.get("input[name='password']").type("admin")
      cy.get("button").contains("Submit").click()

      cy.get("button[aria-label='Create new template']").click()

      const testTemplateName = Math.random().toString(36)

      cy.get("input[name='boardUrl']").type(boardUrl)
      cy.get("input[name='title']").type(testTemplateName)
      cy.get("input[name='description']").type("This is a test template")
      cy.get("button").contains("Create").click()

      cy.get("button[aria-label='Home']").click()
      cy.contains("Create board").click()

      cy.contains(testTemplateName).click()
      cy.contains("This is a test template")

      cy.get("input[name='title']").type("Template Board")
      cy.get("input[name='password']").type("password for template board")
      cy.get("button").contains("Submit").click()

      cy.loginToBoard("password for template board")

      cy.contains("Template Board")
      cy.contains(defaultColumn.title)
      cy.contains(defaultTask.title)

      cy.get("button[aria-label='Home']").click()
      cy.get("a[href='/admin']").click()

      cy.contains(testTemplateName)
      cy.get(`button[aria-label="Delete template ${testTemplateName}"]`).click()

      cy.contains(testTemplateName).should("not.exist")
    })
  })
})

describe("When working with multiple users", () => {
  it("can see changes made by other users and own updates are responsive", () => {
    // Import board with data, so responsivess is tested more realistically
    cy.contains("Create board").click()
    cy.get("input[name='title']").type("Imported test Board")
    cy.get("input[name='password']").type("alpha123")
    cy.get("input[type='file']").selectFile("fixtures/large_board.csv", { force: true })
    cy.get("button").contains("Submit").click()

    cy.loginToBoard("alpha123")

    cy.contains("Imported test Board")

    cy.contains("about this board")
    cy.contains("pokemon31-40")
    cy.contains("pikachu")
    cy.contains("Jess")

    // Only testing with 5 concurrent users, because all browser are running on the same machine.
    // With more users, test becomes flaky.
    const concurrentUsers = 5

    // Check that board doesn't contain data that it shouldn't contain yet
    for (let i = 0; i < concurrentUsers; i++) {
      cy.contains(`To Do (${i})`).should("not.exist")
    }

    cy.contains("Something else").should("not.exist")
    cy.contains("Research Competitors").should("not.exist")

    // Test that updates from other users are responsive

    cy.url().then((url) => {
      cy.task("stress-test", { boardUrl: url, concurrentUsers })
    })

    for (let i = 0; i < concurrentUsers; i++) {
      cy.contains(`To Do (${i})`, { timeout: 4_000 })
    }

    // Test own updates are responsive, when board in use

    cy.createColumn(otherColumn)
    cy.contains("Something else")

    cy.createTask(otherTask)
    cy.contains("Research Competitors")
  })
})
